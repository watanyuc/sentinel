import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { runtimeStore } from '../services/runtimeStore';
import prisma from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

// Convert cents-based currencies to USD for aggregation
const toUsd = (value: number, currency: string): number => {
  const cur = currency.toUpperCase();
  if (cur === 'USC' || cur === 'UST' || cur === 'USDC') return value / 100;
  return value;
};

router.get('/overview', (req: AuthRequest, res: Response) => {
  const accounts = runtimeStore.getAccountsByUser(req.user!.id);
  const online = accounts.filter(a => a.status === 'online');
  const offline = accounts.filter(a => a.status === 'offline');

  const totalBalance = accounts.reduce((s, a) => s + toUsd(a.balance, a.currency), 0);
  const totalEquity = accounts.reduce((s, a) => s + toUsd(a.equity, a.currency), 0);
  const totalProfit = accounts.reduce((s, a) => s + toUsd(a.profit, a.currency), 0);
  const totalOpenLots = accounts.reduce((s, a) => s + a.openLots, 0);
  const totalBuyLots = accounts.reduce((s, a) => s + a.buyLots, 0);
  const totalSellLots = accounts.reduce((s, a) => s + a.sellLots, 0);
  const totalPending = accounts.reduce((s, a) => s + a.pendingOrders, 0);

  res.json({
    totalAccounts: accounts.length,
    onlineAccounts: online.length,
    offlineAccounts: offline.length,
    totalBalance: parseFloat(totalBalance.toFixed(2)),
    totalEquity: parseFloat(totalEquity.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    totalOpenLots: parseFloat(totalOpenLots.toFixed(2)),
    totalBuyLots: parseFloat(totalBuyLots.toFixed(2)),
    totalSellLots: parseFloat(totalSellLots.toFixed(2)),
    totalPendingOrders: totalPending,
  });
});

router.get('/heatmap/accounts', (req: AuthRequest, res: Response) => {
  const accounts = runtimeStore.getAccountsByUser(req.user!.id);
  const data = accounts.map(a => ({
    id: a.id,
    name: a.name,
    broker: a.broker,
    status: a.status,
    balance: a.balance,
    equity: a.equity,
    drawdown: a.drawdown,
    marginLevel: a.marginLevel,
    profit: a.profit,
    currency: a.currency,
  }));
  res.json(data);
});

router.get('/heatmap/orders', (req: AuthRequest, res: Response) => {
  const accounts = runtimeStore.getAccountsByUser(req.user!.id);
  const orders: object[] = [];
  accounts.forEach(account => {
    account.orders.forEach(order => {
      const openTime = new Date(order.openTime);
      const durationMs = Date.now() - openTime.getTime();
      const durationMin = Math.floor(durationMs / 60000);
      orders.push({
        ...order,
        accountName: account.name,
        accountId: account.id,
        broker: account.broker,
        durationMin,
      });
    });
  });
  res.json(orders);
});

router.get('/heatmap/pending', (req: AuthRequest, res: Response) => {
  const accounts = runtimeStore.getAccountsByUser(req.user!.id);
  const pending: object[] = [];
  accounts.forEach(account => {
    account.pending.forEach(order => {
      pending.push({
        ...order,
        accountName: account.name,
        accountId: account.id,
        broker: account.broker,
      });
    });
  });
  res.json(pending);
});

// Today's closed P/L per account
router.get('/today-pnl', async (req: AuthRequest, res: Response) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const trades = await prisma.closedTrade.findMany({
    where: {
      closeTime: { gte: startOfDay },
      account: { userId: req.user!.id },
    },
    select: { accountId: true, profit: true },
  });

  const pnlMap: Record<string, number> = {};
  for (const t of trades) {
    pnlMap[t.accountId] = (pnlMap[t.accountId] || 0) + t.profit;
  }

  // Round values
  for (const id of Object.keys(pnlMap)) {
    pnlMap[id] = parseFloat(pnlMap[id].toFixed(2));
  }

  res.json(pnlMap);
});

export default router;
