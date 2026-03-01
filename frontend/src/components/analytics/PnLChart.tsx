import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { fetchDailyPnL } from '../../services/api';
import type { DailyPnL } from '../../types';

type Period = '1M' | '3M' | '6M';

interface Props {
  accountId?: string;
}

export const PnLChart = ({ accountId }: Props) => {
  const [period, setPeriod] = useState<Period>('3M');
  const [data, setData] = useState<DailyPnL[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchDailyPnL(accountId, period)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [accountId, period]);

  const PERIOD_BUTTONS: Period[] = ['1M', '3M', '6M'];

  const totalProfit = data.reduce((s, d) => s + d.profit, 0);
  const totalTrades = data.reduce((s, d) => s + d.trades, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Daily P&L</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {totalTrades} trades | Net: <span className={totalProfit >= 0 ? 'text-success' : 'text-danger'}>
              {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
            </span>
          </p>
        </div>
        <div className="flex gap-1">
          {PERIOD_BUTTONS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-accent-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
          No closed trades yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                const d = new Date(v);
                return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
              }}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              stroke="#374151"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              stroke="#374151"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={((value: number | undefined) => [value != null ? `$${value.toFixed(2)}` : '—', 'P&L']) as never}
              labelFormatter={(v) => `Date: ${v}`}
            />
            <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
