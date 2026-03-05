import prisma from '../lib/prisma';
import type { Order } from '../mock/data';

const MAX_AGE_DAYS = 90;

// In-memory: previous orders per account for comparison
const previousOrders = new Map<string, Map<number, Order>>();

/**
 * Detect closed trades by comparing current orders with previous snapshot.
 * Missing tickets = trades that were closed.
 */
export const detectClosedTrades = async (
  accountId: string,
  currentOrders: Order[],
): Promise<void> => {
  const prevMap = previousOrders.get(accountId);

  // Build current ticket map
  const currentMap = new Map<number, Order>();
  for (const o of currentOrders) {
    currentMap.set(o.ticket, o);
  }

  // Update previous orders for next comparison
  previousOrders.set(accountId, currentMap);

  // Skip first push (no previous data to compare)
  if (!prevMap) return;

  // Find tickets that were in previous but not in current = closed
  const closedTickets: Order[] = [];
  for (const [ticket, order] of prevMap.entries()) {
    if (!currentMap.has(ticket)) {
      closedTickets.push(order);
    }
  }

  if (closedTickets.length === 0) return;

  // Batch insert closed trades
  for (const order of closedTickets) {
    try {
      await prisma.closedTrade.create({
        data: {
          accountId,
          ticket: order.ticket,
          symbol: order.symbol,
          type: order.type,
          lots: order.lots,
          openPrice: order.openPrice,
          closePrice: order.currentPrice,
          profit: order.profit,
          swap: order.swap ?? 0,
          openTime: new Date(order.openTime),
          sl: order.sl,
          tp: order.tp,
        },
      });
      console.log(`[TradeHistory] Closed trade #${order.ticket} ${order.symbol} P/L: ${order.profit}`);
    } catch (err: unknown) {
      // Unique constraint violation = already recorded
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('Unique constraint')) {
        console.error(`[TradeHistory] Error recording trade #${order.ticket}:`, msg);
      }
    }
  }
};

interface TradeQueryParams {
  page?: number;
  limit?: number;
  symbol?: string;
  type?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

/**
 * Get trade history for a user, optionally filtered by account.
 */
export const getTradeHistory = async (
  userId: string,
  accountId?: string,
  params: TradeQueryParams = {},
) => {
  const { page = 1, limit = 25, symbol, type, sortBy = 'closeTime', sortDir = 'desc' } = params;

  const where: Record<string, unknown> = {
    account: { userId },
  };
  if (accountId) where.accountId = accountId;
  if (symbol) where.symbol = { contains: symbol };
  if (type) where.type = type;

  const [trades, total] = await Promise.all([
    prisma.closedTrade.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
      include: { account: { select: { name: true, broker: true } } },
    }),
    prisma.closedTrade.count({ where }),
  ]);

  return { trades, total, page, limit };
};

/**
 * Clean trades older than MAX_AGE_DAYS.
 */
export const cleanOldTrades = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.closedTrade.deleteMany({
    where: { closeTime: { lt: cutoff } },
  });
  if (result.count > 0) {
    console.log(`[TradeHistory] Cleaned ${result.count} old trades`);
  }
  return result.count;
};
