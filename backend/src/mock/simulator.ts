import type { Account } from './data';

// Track which accounts are receiving real MT5 data (skip simulation for them)
const realAccounts = new Set<string>();

export const markAsReal = (accountId: string): void => {
  realAccounts.add(accountId);
};
export const unmarkAsReal = (accountId: string): void => {
  realAccounts.delete(accountId);
};
export const isReal = (accountId: string): boolean => {
  return realAccounts.has(accountId);
};

// Random walk with bounds
const randomWalk = (current: number, maxChange: number, min: number, max: number): number => {
  const change = (Math.random() - 0.5) * 2 * maxChange;
  return Math.max(min, Math.min(max, current + change));
};

// Simulated market prices (used for mock accounts only)
const simulatePrices: Record<string, number> = {
  XAUUSD: 2318.2,
  EURUSD: 1.0832,
  GBPUSD: 1.2695,
  USDJPY: 154.55,
};

export const tickPrices = (): void => {
  simulatePrices.XAUUSD = randomWalk(simulatePrices.XAUUSD, 3.0, 2200, 2500);
  simulatePrices.EURUSD = randomWalk(simulatePrices.EURUSD, 0.0008, 1.05, 1.15);
  simulatePrices.GBPUSD = randomWalk(simulatePrices.GBPUSD, 0.0010, 1.20, 1.35);
  simulatePrices.USDJPY = randomWalk(simulatePrices.USDJPY, 0.15, 145, 160);
};

export const simulateAccounts = (accounts: Account[]): Account[] => {
  tickPrices();

  return accounts.map(account => {
    // Skip offline accounts and accounts with real MT5 data
    if (account.status === 'offline' || realAccounts.has(account.id)) return account;

    // Recalculate order profits based on simulated prices
    const updatedOrders = account.orders.map(order => {
      const currentPrice = simulatePrices[order.symbol] ?? order.currentPrice;
      const priceDiff = order.type === 'BUY'
        ? currentPrice - order.openPrice
        : order.openPrice - currentPrice;
      const contractSize = order.symbol === 'XAUUSD' ? 100 :
                           order.symbol === 'USDJPY' ? 1000 : 100000;
      const profit = priceDiff * order.lots * contractSize;
      return { ...order, currentPrice, profit: parseFloat(profit.toFixed(2)), swap: order.swap ?? 0, commission: order.commission ?? 0 };
    });

    const totalProfit = updatedOrders.reduce((sum, o) => sum + o.profit, 0);
    const equity = account.balance + totalProfit;
    const drawdown = equity < account.balance
      ? parseFloat(((account.balance - equity) / account.balance * 100).toFixed(2))
      : 0;
    const marginLevel = account.margin > 0
      ? parseFloat((equity / account.margin * 100).toFixed(2))
      : 9999.9;
    const freeMargin = equity - account.margin;

    return {
      ...account,
      orders: updatedOrders,
      equity: parseFloat(equity.toFixed(2)),
      profit: parseFloat(totalProfit.toFixed(2)),
      drawdown,
      marginLevel,
      freeMargin: parseFloat(freeMargin.toFixed(2)),
    };
  });
};
