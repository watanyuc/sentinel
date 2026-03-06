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
          commission: order.commission ?? 0,
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

/**
 * Record closed deals sent directly from EA's deal history.
 * These have exact P/L including commission — much more accurate than position diff.
 */
export interface ClosedDeal {
  positionId: number;
  ticket: number;
  symbol: string;
  type: number; // 0=BUY, 1=SELL
  lots: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  closeTime: string;
}

const TYPE_MAP: Record<number, string> = { 0: 'BUY', 1: 'SELL' };

/** Parse MT5 time string (broker server time) and convert to UTC.
 *  MT5 format: "YYYY.MM.DD HH:MM:SS" (dots in date, space separator)
 *  We treat this as broker time, then subtract the broker offset to get UTC.
 */
const mt5TimeToUtc = (timeStr: string, brokerOffsetSec: number): Date => {
  // "2024.03.15 14:30:45" → "2024-03-15T14:30:45Z"
  // Adding 'Z' forces JS to treat the string as UTC (not local time).
  // This gives us the broker time as a UTC timestamp, then we subtract the
  // broker offset (e.g. GMT+2 = 7200s) to get the real UTC time.
  const normalized = timeStr.replace(/\./g, '-').replace(' ', 'T') + 'Z';
  const brokerTimeAsUtc = new Date(normalized);
  return new Date(brokerTimeAsUtc.getTime() - brokerOffsetSec * 1000);
};

export const recordClosedDeals = async (
  accountId: string,
  deals: ClosedDeal[],
  brokerOffsetSec: number = 7200,
): Promise<void> => {
  for (const deal of deals) {
    try {
      // Use positionId as the ticket for unique constraint (position = trade in MT5)
      await prisma.closedTrade.upsert({
        where: {
          accountId_ticket: { accountId, ticket: deal.positionId },
        },
        update: {
          // Update with exact values from deal history
          profit: deal.profit,
          swap: deal.swap,
          commission: deal.commission,
          closePrice: deal.closePrice,
          closeTime: mt5TimeToUtc(deal.closeTime, brokerOffsetSec),
        },
        create: {
          accountId,
          ticket: deal.positionId,
          symbol: deal.symbol,
          type: TYPE_MAP[deal.type] ?? 'BUY',
          lots: deal.lots,
          openPrice: deal.openPrice,
          closePrice: deal.closePrice,
          profit: deal.profit,
          swap: deal.swap,
          commission: deal.commission,
          openTime: mt5TimeToUtc(deal.openTime, brokerOffsetSec),
          closeTime: mt5TimeToUtc(deal.closeTime, brokerOffsetSec),
          sl: 0,
          tp: 0,
        },
      });
      const net = deal.profit + deal.swap + deal.commission;
      console.log(`[TradeHistory] Deal #${deal.positionId} ${deal.symbol} net: ${net.toFixed(2)} (profit:${deal.profit} swap:${deal.swap} comm:${deal.commission})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      console.error(`[TradeHistory] Error recording deal #${deal.positionId}:`, msg);
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
