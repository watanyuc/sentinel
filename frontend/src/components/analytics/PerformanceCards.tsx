import { useState, useEffect } from 'react';
import { fetchPerformanceMetrics } from '../../services/api';
import type { PerformanceMetrics } from '../../types';
import { TrendingUp, TrendingDown, Target, Activity, BarChart3, Shield } from 'lucide-react';

interface Props {
  accountId?: string;
}

export const PerformanceCards = ({ accountId }: Props) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPerformanceMetrics(accountId)
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, [accountId]);

  if (loading) {
    return <div className="text-sm text-gray-500 text-center py-8">Loading metrics...</div>;
  }

  if (!metrics || metrics.totalTrades === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        No closed trades to calculate metrics.
      </div>
    );
  }

  const cards = [
    {
      icon: BarChart3,
      label: 'Total Trades',
      value: metrics.totalTrades.toString(),
      color: 'text-accent-blue',
    },
    {
      icon: Target,
      label: 'Win Rate',
      value: `${metrics.winRate}%`,
      color: metrics.winRate >= 50 ? 'text-success' : 'text-danger',
    },
    {
      icon: Activity,
      label: 'Profit Factor',
      value: metrics.profitFactor >= 999 ? '∞' : metrics.profitFactor.toFixed(2),
      color: metrics.profitFactor >= 1 ? 'text-success' : 'text-danger',
    },
    {
      icon: TrendingUp,
      label: 'Avg Profit',
      value: `$${metrics.avgProfit.toFixed(2)}`,
      color: 'text-success',
    },
    {
      icon: TrendingDown,
      label: 'Avg Loss',
      value: `-$${metrics.avgLoss.toFixed(2)}`,
      color: 'text-danger',
    },
    {
      icon: Shield,
      label: 'Max Drawdown',
      value: `${metrics.maxDrawdown.toFixed(2)}%`,
      color: metrics.maxDrawdown > 20 ? 'text-danger' : 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <div key={c.label} className="card text-center">
          <c.icon size={18} className={`${c.color} mx-auto mb-1.5`} />
          <div className={`text-lg font-bold font-mono ${c.color}`}>{c.value}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{c.label}</div>
        </div>
      ))}
      {/* Extra row: Gross Profit / Gross Loss */}
      <div className="col-span-2 sm:col-span-3 lg:col-span-6 flex gap-3">
        <div className="card flex-1 flex items-center justify-between">
          <span className="text-xs text-gray-400">Gross Profit</span>
          <span className="font-mono text-sm font-semibold text-success">
            +${metrics.grossProfit.toFixed(2)}
          </span>
        </div>
        <div className="card flex-1 flex items-center justify-between">
          <span className="text-xs text-gray-400">Gross Loss</span>
          <span className="font-mono text-sm font-semibold text-danger">
            -${metrics.grossLoss.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
