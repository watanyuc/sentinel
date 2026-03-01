import prisma from '../lib/prisma';

export interface DailyPnL {
  date: string;
  profit: number;
  trades: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  grossProfit: number;
  grossLoss: number;
}

type Period = '1M' | '3M' | '6M';

const PERIOD_DAYS: Record<Period, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
};

/**
 * Get daily P&L summary from closed trades.
 */
export const getDailyPnL = async (
  userId: string,
  accountId?: string,
  period: Period = '3M',
): Promise<DailyPnL[]> => {
  const cutoff = new Date(Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    account: { userId },
    closeTime: { gte: cutoff },
  };
  if (accountId) where.accountId = accountId;

  const trades = await prisma.closedTrade.findMany({
    where,
    select: { profit: true, closeTime: true },
    orderBy: { closeTime: 'asc' },
  });

  // Group by date
  const dailyMap = new Map<string, { profit: number; trades: number }>();
  for (const t of trades) {
    const date = t.closeTime.toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = dailyMap.get(date) || { profit: 0, trades: 0 };
    existing.profit += t.profit;
    existing.trades += 1;
    dailyMap.set(date, existing);
  }

  return Array.from(dailyMap.entries()).map(([date, v]) => ({
    date,
    profit: parseFloat(v.profit.toFixed(2)),
    trades: v.trades,
  }));
};

/**
 * Calculate performance metrics from closed trades.
 */
export const getPerformanceMetrics = async (
  userId: string,
  accountId?: string,
): Promise<PerformanceMetrics> => {
  const where: Record<string, unknown> = {
    account: { userId },
  };
  if (accountId) where.accountId = accountId;

  const trades = await prisma.closedTrade.findMany({
    where,
    select: { profit: true },
  });

  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      totalTrades: 0, winRate: 0, avgProfit: 0, avgLoss: 0,
      profitFactor: 0, maxDrawdown: 0, grossProfit: 0, grossLoss: 0,
    };
  }

  const wins = trades.filter(t => t.profit > 0);
  const losses = trades.filter(t => t.profit <= 0);
  const grossProfit = wins.reduce((s, t) => s + t.profit, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));

  const winRate = (wins.length / totalTrades) * 100;
  const avgProfit = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Max drawdown from equity snapshots
  let maxDrawdown = 0;
  const snapWhere: Record<string, unknown> = { account: { userId } };
  if (accountId) snapWhere.accountId = accountId;

  const snapshots = await prisma.equitySnapshot.findMany({
    where: snapWhere,
    select: { drawdown: true },
    orderBy: { timestamp: 'asc' },
  });

  for (const s of snapshots) {
    if (s.drawdown > maxDrawdown) maxDrawdown = s.drawdown;
  }

  return {
    totalTrades,
    winRate: parseFloat(winRate.toFixed(1)),
    avgProfit: parseFloat(avgProfit.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    profitFactor: profitFactor === Infinity ? 999 : parseFloat(profitFactor.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    grossLoss: parseFloat(grossLoss.toFixed(2)),
  };
};
