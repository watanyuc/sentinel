import prisma from '../lib/prisma';

const SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const MAX_AGE_DAYS = 90;

// In-memory cache of last snapshot time per account
const lastSnapshot = new Map<string, number>();

/**
 * Record an equity snapshot if enough time has passed since last one.
 */
export const recordSnapshot = async (
  accountId: string,
  equity: number,
  balance: number,
  drawdown: number,
): Promise<void> => {
  const now = Date.now();
  const last = lastSnapshot.get(accountId) || 0;
  if (now - last < SNAPSHOT_INTERVAL_MS) return;

  lastSnapshot.set(accountId, now);
  await prisma.equitySnapshot.create({
    data: { accountId, equity, balance, drawdown },
  });
};

type Timeframe = '1D' | '1W' | '1M' | '3M';

const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  '3M': 90 * 24 * 60 * 60 * 1000,
};

/**
 * Get equity history for a specific account within a timeframe.
 */
export const getEquityHistory = async (
  accountId: string,
  timeframe: Timeframe = '1M',
) => {
  const cutoff = new Date(Date.now() - TIMEFRAME_MS[timeframe]);
  return prisma.equitySnapshot.findMany({
    where: { accountId, timestamp: { gte: cutoff } },
    orderBy: { timestamp: 'asc' },
    select: { id: true, equity: true, balance: true, drawdown: true, timestamp: true },
  });
};

/**
 * Clean snapshots older than MAX_AGE_DAYS.
 */
export const cleanOldSnapshots = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.equitySnapshot.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
  if (result.count > 0) {
    console.log(`[Equity] Cleaned ${result.count} old snapshots`);
  }
  return result.count;
};
