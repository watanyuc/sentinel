import { useQuery } from '@tanstack/react-query';
import { fetchHeatmapOrders } from '../../services/api';
import type { HeatmapOrder } from '../../types';
import { formatCurrency, formatLots } from '../../utils/formatters';
import { CardSkeleton } from '../ui/Skeleton';
import { useState } from 'react';

const getProfitColor = (profit: number): { bg: string; border: string; text: string } => {
  if (profit > 500) return { bg: 'rgba(21,128,61,0.25)', border: '#166534', text: '#4ade80' };
  if (profit > 100) return { bg: 'rgba(34,197,94,0.15)', border: '#16a34a', text: '#86efac' };
  if (profit > 0) return { bg: 'rgba(34,197,94,0.08)', border: '#166534', text: '#bbf7d0' };
  if (profit === 0) return { bg: 'rgba(107,114,128,0.15)', border: '#374151', text: '#9ca3af' };
  if (profit > -100) return { bg: 'rgba(239,68,68,0.08)', border: '#7f1d1d', text: '#fca5a5' };
  if (profit > -500) return { bg: 'rgba(239,68,68,0.18)', border: '#b91c1c', text: '#f87171' };
  return { bg: 'rgba(239,68,68,0.3)', border: '#dc2626', text: '#ef4444' };
};

const formatDuration = (min: number): string => {
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${Math.floor(min / 60)}h${min % 60}m`;
  return `${Math.floor(min / 1440)}d${Math.floor((min % 1440) / 60)}h`;
};

export const OrdersHeatmap = () => {
  const [tooltip, setTooltip] = useState<HeatmapOrder | null>(null);

  const { data: orders = [], isLoading } = useQuery<HeatmapOrder[]>({
    queryKey: ['heatmap-orders'],
    queryFn: fetchHeatmapOrders,
    refetchInterval: 5000,
  });

  if (isLoading) return <CardSkeleton />;
  if (orders.length === 0) return <p className="text-gray-500 text-sm text-center py-8">No open orders</p>;

  const maxLots = Math.max(...orders.map(o => o.lots));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Open Orders (by Lot Size)</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-700/50" />High Profit</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-700/50" />Neutral</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-700/50" />Loss</span>
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {orders.map(order => {
          const { bg, border, text } = getProfitColor(order.profit);
          const rel = order.lots / maxLots;
          const minH = 70 + rel * 60;

          return (
            <div
              key={order.ticket}
              className="rounded-xl p-3 cursor-pointer hover:scale-[1.02] transition-all"
              style={{ background: bg, borderWidth: 1, borderStyle: 'solid', borderColor: border, minHeight: `${minH}px` }}
              onMouseEnter={() => setTooltip(order)}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{order.symbol}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${order.type === 'BUY' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                  {order.type}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mb-1.5">{order.accountName}</div>
              <div className="text-xs font-mono font-semibold mb-1" style={{ color: text }}>
                {order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}
              </div>
              <div className="text-[10px] text-gray-500">
                {formatLots(order.lots)} lots • {formatDuration(order.durationMin)}
              </div>
            </div>
          );
        })}
      </div>

      {tooltip && (
        <div className="fixed bottom-20 right-4 z-50 bg-bg-tertiary border border-gray-700 rounded-xl p-4 text-xs shadow-2xl min-w-48">
          <div className="font-semibold text-white mb-2">{tooltip.symbol} #{tooltip.ticket}</div>
          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between gap-4"><span>Type</span><span className="font-medium">{tooltip.type}</span></div>
            <div className="flex justify-between gap-4"><span>Lots</span><span className="font-mono">{formatLots(tooltip.lots)}</span></div>
            <div className="flex justify-between gap-4"><span>Open</span><span className="font-mono">{tooltip.openPrice}</span></div>
            <div className="flex justify-between gap-4"><span>Current</span><span className="font-mono">{tooltip.currentPrice.toFixed(5)}</span></div>
            <div className="flex justify-between gap-4"><span>P/L</span>
              <span className={`font-mono font-semibold ${tooltip.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(tooltip.profit)}
              </span>
            </div>
            <div className="flex justify-between gap-4"><span>Duration</span><span>{formatDuration(tooltip.durationMin)}</span></div>
            <div className="flex justify-between gap-4"><span>Account</span><span className="truncate max-w-24">{tooltip.accountName}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
