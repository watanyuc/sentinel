import { Request, Response } from 'express';
import { runtimeStore } from '../services/runtimeStore';
import { broadcastToUser } from '../websocket/broadcaster';
import { checkAlerts, checkOfflineAlert } from '../services/alertService';
import { commandQueue } from '../services/commandQueue';
import { sendCloseAllNotification } from '../services/commandNotifier';
import { detectClosedTrades } from '../services/tradeHistoryService';
import { recordSnapshot } from '../services/equityService';
import { markAsReal, unmarkAsReal } from '../mock/simulator';
import type { Account, Order, PendingOrder } from '../mock/data';

interface MT5PushPayload {
  apiKey: string;
  accountNumber: string;
  name?: string;
  broker?: string;
  server?: string;
  currency?: string;
  leverage?: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  orders: {
    ticket: number;
    symbol: string;
    type: number;
    lots: number;
    openPrice: number;
    currentPrice: number;
    profit: number;
    swap: number;
    openTime: string;
    sl: number;
    tp: number;
  }[];
  pending: {
    ticket: number;
    symbol: string;
    type: number;
    lots: number;
    openPrice: number;
    sl: number;
    tp: number;
    expiration: string;
  }[];
  brokerTimeOffset?: number;
}

const ORDER_TYPE_MAP: Record<number, Order['type']> = {
  0: 'BUY',
  1: 'SELL',
};

const PENDING_TYPE_MAP: Record<number, PendingOrder['type']> = {
  2: 'BUY_LIMIT',
  3: 'SELL_LIMIT',
  4: 'BUY_STOP',
  5: 'SELL_STOP',
  6: 'BUY_STOP_LIMIT',
  7: 'SELL_STOP_LIMIT',
};

export const receiveMT5Push = (req: Request, res: Response): void => {
  const payload = req.body as MT5PushPayload;

  if (!payload.apiKey) {
    res.status(400).json({ error: 'apiKey is required' });
    return;
  }

  const result = runtimeStore.findAccountByApiKey(payload.apiKey);

  if (!result) {
    res.status(404).json({ error: 'Account not found. Add it via dashboard first.' });
    return;
  }

  const { account, userId } = result;

  const orders: Order[] = (payload.orders || []).map(o => ({
    ticket: o.ticket,
    symbol: o.symbol,
    type: ORDER_TYPE_MAP[o.type] ?? 'BUY',
    lots: o.lots,
    openPrice: o.openPrice,
    currentPrice: o.currentPrice,
    profit: o.profit,
    swap: o.swap ?? 0,
    openTime: o.openTime,
    sl: o.sl,
    tp: o.tp,
  }));

  const pending: PendingOrder[] = (payload.pending || []).map(p => ({
    ticket: p.ticket,
    symbol: p.symbol,
    type: PENDING_TYPE_MAP[p.type] ?? 'BUY_LIMIT',
    lots: p.lots,
    openPrice: p.openPrice,
    sl: p.sl,
    tp: p.tp,
    expiration: p.expiration || null,
  }));

  const buyLots = orders.filter(o => o.type === 'BUY').reduce((s, o) => s + o.lots, 0);
  const sellLots = orders.filter(o => o.type === 'SELL').reduce((s, o) => s + o.lots, 0);
  const drawdown = payload.equity < payload.balance
    ? parseFloat(((payload.balance - payload.equity) / payload.balance * 100).toFixed(2))
    : 0;

  const updated: Account = {
    ...account,
    status: 'online',
    balance: payload.balance,
    equity: payload.equity,
    margin: payload.margin,
    freeMargin: payload.freeMargin,
    marginLevel: payload.marginLevel,
    profit: payload.profit,
    drawdown,
    openLots: parseFloat((buyLots + sellLots).toFixed(2)),
    buyLots: parseFloat(buyLots.toFixed(2)),
    sellLots: parseFloat(sellLots.toFixed(2)),
    pendingOrders: pending.length,
    orders,
    pending,
    ...(payload.broker && { broker: payload.broker }),
    ...(payload.server && { server: payload.server }),
    ...(payload.leverage && { leverage: payload.leverage }),
    ...(payload.brokerTimeOffset != null && { brokerTimeOffset: payload.brokerTimeOffset }),
  };

  // Detect closed trades BEFORE updating (compare previous vs current orders)
  detectClosedTrades(account.id, orders)
    .catch(err => console.error('[TradeHistory] detectClosedTrades error:', err.message));

  runtimeStore.updateAccount(userId, updated);
  broadcastToUser(userId, runtimeStore.getAccountsByUser(userId));

  // Record equity snapshot (sampled 1x/hour)
  recordSnapshot(account.id, payload.equity, payload.balance, drawdown)
    .catch(err => console.error('[Equity] recordSnapshot error:', err.message));

  // Check alert conditions with fresh data
  checkAlerts(userId, runtimeStore.getAccountsByUser(userId))
    .catch(err => console.error('[Alert] checkAlerts error:', err.message));

  markAsReal(account.id);
  resetHeartbeat(account.id, userId);

  // Drain any pending commands for this apiKey
  const commands = commandQueue.drain(payload.apiKey);

  const response: Record<string, unknown> = {
    ok: true,
    accountId: account.id,
    orders: orders.length,
    pending: pending.length,
  };

  if (commands.length > 0) {
    response.commands = commands.map(cmd => ({ type: cmd.type }));

    for (const cmd of commands) {
      if (cmd.type === 'CLOSE_ALL') {
        sendCloseAllNotification(cmd.userId, account.name, orders.length)
          .catch(err => console.error('[CmdNotify] Telegram send failed:', err.message));
      }
    }

    console.log(`[MT5] Sent ${commands.length} commands to ${account.name}`);
  }

  res.json(response);
};

const heartbeats = new Map<string, ReturnType<typeof setTimeout>>();

const resetHeartbeat = (accountId: string, userId: string): void => {
  const existing = heartbeats.get(accountId);
  if (existing) clearTimeout(existing);

  heartbeats.set(accountId, setTimeout(() => {
    const accounts = runtimeStore.getAccountsByUser(userId);
    const account = accounts.find(a => a.id === accountId);
    if (account && account.status === 'online') {
      console.log(`[MT5] Account ${account.name} went offline (no push for 30s)`);
      const updated: Account = { ...account, status: 'offline' };
      runtimeStore.updateAccount(userId, updated);
      broadcastToUser(userId, runtimeStore.getAccountsByUser(userId));
      // Fire offline alert
      checkOfflineAlert(userId, updated)
        .catch(err => console.error('[Alert] checkOfflineAlert error:', err.message));
      unmarkAsReal(accountId);
    }
    heartbeats.delete(accountId);
  }, 30000));
};
