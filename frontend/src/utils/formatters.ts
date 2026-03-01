const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', THB: '฿',
  AUD: 'A$', NZD: 'NZ$', CAD: 'C$', CHF: 'CHF ',
};

export const formatCurrency = (value: number, currency = 'USD'): string => {
  const abs = Math.abs(value);
  const formatted = abs >= 1000
    ? (abs / 1000).toFixed(2) + 'K'
    : abs.toFixed(2);
  const sign = value < 0 ? '-' : '';
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + ' ';
  return `${sign}${symbol}${formatted}`;
};

export const formatNumber = (value: number, decimals = 2): string => {
  return value.toFixed(decimals);
};

export const formatLots = (lots: number): string => {
  return lots.toFixed(2);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const formatMaskedKey = (key: string): string => {
  if (key.startsWith('●●●●')) return key;
  return '●●●●' + key.slice(-6);
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getProfitColor = (profit: number): string => {
  if (profit > 0) return 'text-success';
  if (profit < 0) return 'text-danger';
  return 'text-gray-400';
};

export const getDrawdownColor = (dd: number): string => {
  if (dd < 10) return 'text-success';
  if (dd < 30) return 'text-warning';
  return 'text-danger';
};

export const getMarginLevelColor = (level: number): string => {
  if (level > 500) return 'text-success';
  if (level > 200) return 'text-warning';
  return 'text-danger';
};
