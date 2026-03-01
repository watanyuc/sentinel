import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { fetchEquityHistory } from '../../services/api';
import type { EquitySnapshot } from '../../types';

type Timeframe = '1D' | '1W' | '1M' | '3M';

interface Props {
  accountId: string;
}

const formatDate = (ts: string, tf: Timeframe) => {
  const d = new Date(ts);
  if (tf === '1D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const EquityChart = ({ accountId }: Props) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [data, setData] = useState<EquitySnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    fetchEquityHistory(accountId, timeframe)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [accountId, timeframe]);

  const TF_BUTTONS: Timeframe[] = ['1D', '1W', '1M', '3M'];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Equity History</h3>
        <div className="flex gap-1">
          {TF_BUTTONS.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-accent-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
          No data yet. Snapshots are recorded every hour.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(v) => formatDate(v, timeframe)}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              stroke="#374151"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              stroke="#374151"
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v) => new Date(v as string).toLocaleString()}
              formatter={((value: number | undefined, name: string | undefined) => [
                value != null ? `$${value.toFixed(2)}` : '—',
                name === 'equity' ? 'Equity' : 'Balance',
              ]) as never}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Equity"
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#6b7280"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
              name="Balance"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
