import { useQuery } from '@tanstack/react-query';
import { fetchHeatmapPending } from '../../services/api';
import type { HeatmapPending, PendingOrderType } from '../../types';
import { formatLots } from '../../utils/formatters';
import { CardSkeleton } from '../ui/Skeleton';
import { useState } from 'react';

const TYPE_COLORS: Record<PendingOrderType, { bg: string; border: string; text: string; label: string }> = {
  BUY_LIMIT:       { bg: 'rgba(34,197,94,0.12)',  border: '#166534', text: '#4ade80', label: 'BL' },
  SELL_LIMIT:      { bg: 'rgba(239,68,68,0.12)',  border: '#7f1d1d', text: '#f87171', label: 'SL' },
  BUY_STOP:        { bg: 'rgba(59,130,246,0.12)', border: '#1e3a5f', text: '#60a5fa', label: 'BS' },
  SELL_STOP:       { bg: 'rgba(168,85,247,0.12)', border: '#581c87', text: '#c084fc', label: 'SS' },
  BUY_STOP_LIMIT:  { bg: 'rgba(20,184,166,0.12)', border: '#115e59', text: '#2dd4bf', label: 'BSL' },
  SELL_STOP_LIMIT: { bg: 'rgba(245,158,11,0.12)', border: '#78350f', text: '#fbbf24', label: 'SSL' },
};

export const PendingHeatmap = () => {
  const [tooltip, setTooltip] = useState<HeatmapPending | null>(null);

  const { data: pending = [], isLoading } = useQuery<HeatmapPending[]>({
    queryKey: ['heatmap-pending'],
    queryFn: fetchHeatmapPending,
    refetchInterval: 5000,
  });

  if (isLoading) return <CardSkeleton />;
  if (pending.length === 0) return <p className="text-gray-500 text-sm text-center py-8">No pending orders</p>;

  const maxLots = Math.max(...pending.map(o => o.lots));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Pending Orders (by Type & Lot Size)</h3>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
          {(Object.entries(TYPE_COLORS) as [PendingOrderType, typeof TYPE_COLORS[PendingOrderType]][]).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: v.bg, borderWidth: 1, borderStyle: 'solid', borderColor: v.border }} />
              {k.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {pending.map(order => {
          const style = TYPE_COLORS[order.type];
          const rel = order.lots / maxLots;
          const minH = 65 + rel * 50;

          return (
            <div
              key={order.ticket}
              className="rounded-xl p-3 cursor-pointer hover:scale-[1.02] transition-all"
              style={{ background: style.bg, borderWidth: 1, borderStyle: 'solid', borderColor: style.border, minHeight: `${minH}px` }}
              onMouseEnter={() => setTooltip(order)}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{order.symbol}</span>
                <span className="text-[10px] px-1 py-0.5 rounded font-mono font-semibold" style={{ color: style.text, background: `${style.border}55` }}>
                  {style.label}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mb-1.5">{order.accountName}</div>
              <div className="text-xs font-mono" style={{ color: style.text }}>
                @ {order.openPrice}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {formatLots(order.lots)} lots
              </div>
            </div>
          );
        })}
      </div>

      {tooltip && (
        <div className="fixed bottom-20 right-4 z-50 bg-bg-tertiary border border-gray-700 rounded-xl p-4 text-xs shadow-2xl min-w-48">
          <div className="font-semibold text-white mb-2">{tooltip.symbol} #{tooltip.ticket}</div>
          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between gap-4"><span>Type</span><span className="font-medium">{tooltip.type.replace('_', ' ')}</span></div>
            <div className="flex justify-between gap-4"><span>Lots</span><span className="font-mono">{formatLots(tooltip.lots)}</span></div>
            <div className="flex justify-between gap-4"><span>Price</span><span className="font-mono">{tooltip.openPrice}</span></div>
            <div className="flex justify-between gap-4"><span>SL</span><span className="font-mono">{tooltip.sl || '—'}</span></div>
            <div className="flex justify-between gap-4"><span>TP</span><span className="font-mono">{tooltip.tp || '—'}</span></div>
            <div className="flex justify-between gap-4"><span>Account</span><span className="truncate max-w-24">{tooltip.accountName}</span></div>
            <div className="flex justify-between gap-4"><span>Broker</span><span>{tooltip.broker}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
