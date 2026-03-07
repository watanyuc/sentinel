import { useState } from 'react';
import type { Order } from '../../types';
import { FlashNumber } from '../ui/FlashNumber';
import { closePosition, setPositionSLTP } from '../../services/api';
import { useUIStore } from '../../stores/uiStore';
import { X, Check, Edit2, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  accountId: string;
  accountName: string;
  orders: Order[];
  currency: string;
}

interface EditState {
  ticket: number;
  sl: string;
  tp: string;
}

export const PositionPanel = ({ accountId, orders, currency }: Props) => {
  const { addToast } = useUIStore();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [loadingTicket, setLoadingTicket] = useState<number | null>(null);

  const rawCur = currency || 'USD';
  const fmtNum = (v: number) =>
    Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPrice = (v: number) =>
    v === 0 ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 });

  const handleClose = async (ticket: number, symbol: string) => {
    setLoadingTicket(ticket);
    try {
      await closePosition(accountId, ticket);
      addToast({
        type: 'warning',
        title: 'Close queued',
        message: `Close #${ticket} (${symbol}) sent to EA (~2s)`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to close position';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setLoadingTicket(null);
    }
  };

  const startEdit = (order: Order) => {
    setEditing({
      ticket: order.ticket,
      sl: order.sl > 0 ? String(order.sl) : '',
      tp: order.tp > 0 ? String(order.tp) : '',
    });
  };

  const cancelEdit = () => setEditing(null);

  const commitEdit = async () => {
    if (!editing) return;
    const sl = parseFloat(editing.sl) || 0;
    const tp = parseFloat(editing.tp) || 0;
    setLoadingTicket(editing.ticket);
    try {
      await setPositionSLTP(accountId, editing.ticket, sl, tp);
      addToast({
        type: 'success',
        title: 'SL/TP queued',
        message: `SL/TP update for #${editing.ticket} sent to EA (~2s)`,
      });
      setEditing(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set SL/TP';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setLoadingTicket(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="px-4 py-3 text-center text-xs text-gray-500">
        No open positions
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 border-b border-gray-800">
            <th className="text-left py-2 px-3 font-medium">Symbol</th>
            <th className="text-left py-2 px-2 font-medium">Type</th>
            <th className="text-right py-2 px-2 font-medium">Lots</th>
            <th className="text-right py-2 px-2 font-medium">Open</th>
            <th className="text-right py-2 px-2 font-medium">Current</th>
            <th className="text-right py-2 px-2 font-medium">P/L&nbsp;{rawCur}</th>
            <th className="text-right py-2 px-2 font-medium">SL</th>
            <th className="text-right py-2 px-2 font-medium">TP</th>
            <th className="py-2 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const isEdit = editing?.ticket === order.ticket;
            const isLoading = loadingTicket === order.ticket;
            const isBuy = order.type === 'BUY';

            return (
              <tr
                key={order.ticket}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                {/* Symbol */}
                <td className="py-2 px-3 font-medium text-white">{order.symbol}</td>

                {/* Type badge */}
                <td className="py-2 px-2">
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isBuy ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                  }`}>
                    {isBuy ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {order.type}
                  </span>
                </td>

                {/* Lots */}
                <td className="py-2 px-2 text-right font-mono text-gray-300">
                  {order.lots.toFixed(2)}
                </td>

                {/* Open Price */}
                <td className="py-2 px-2 text-right font-mono text-gray-400">
                  {fmtPrice(order.openPrice)}
                </td>

                {/* Current Price */}
                <td className="py-2 px-2 text-right font-mono text-gray-300">
                  {fmtPrice(order.currentPrice)}
                </td>

                {/* P/L */}
                <td className="py-2 px-2 text-right font-mono">
                  <FlashNumber
                    value={order.profit}
                    format={(v) => `${v >= 0 ? '+' : '-'}${fmtNum(v)}`}
                    positiveGreen
                    className="font-semibold"
                  />
                </td>

                {/* SL */}
                <td className="py-2 px-2 text-right">
                  {isEdit ? (
                    <input
                      type="number"
                      step="0.00001"
                      value={editing.sl}
                      onChange={e => setEditing(prev => prev ? { ...prev, sl: e.target.value } : null)}
                      placeholder="0"
                      className="w-20 bg-gray-700 border border-gray-600 rounded px-1.5 py-0.5 text-xs text-white text-right focus:outline-none focus:border-accent-blue"
                      autoFocus
                    />
                  ) : (
                    <span className="font-mono text-gray-400">{fmtPrice(order.sl)}</span>
                  )}
                </td>

                {/* TP */}
                <td className="py-2 px-2 text-right">
                  {isEdit ? (
                    <input
                      type="number"
                      step="0.00001"
                      value={editing.tp}
                      onChange={e => setEditing(prev => prev ? { ...prev, tp: e.target.value } : null)}
                      placeholder="0"
                      className="w-20 bg-gray-700 border border-gray-600 rounded px-1.5 py-0.5 text-xs text-white text-right focus:outline-none focus:border-accent-blue"
                    />
                  ) : (
                    <span className="font-mono text-gray-400">{fmtPrice(order.tp)}</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1 justify-end">
                    {isEdit ? (
                      <>
                        <button
                          onClick={commitEdit}
                          disabled={isLoading}
                          className="p-1 rounded text-success hover:bg-success/20 transition-colors disabled:opacity-40"
                          title="Confirm SL/TP"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 rounded text-gray-400 hover:bg-gray-700 transition-colors"
                          title="Cancel"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(order)}
                          disabled={isLoading}
                          className="p-1 rounded text-gray-400 hover:text-accent-blue hover:bg-accent-blue/10 transition-colors disabled:opacity-40"
                          title="Edit SL/TP"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleClose(order.ticket, order.symbol)}
                          disabled={isLoading}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-danger border border-danger/40 hover:bg-danger hover:text-white transition-colors disabled:opacity-40"
                          title="Close position"
                        >
                          {isLoading ? '...' : 'Close'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary row */}
      <div className="flex items-center gap-4 px-3 py-2 border-t border-gray-800 text-xs text-gray-500">
        <span>{orders.length} position{orders.length !== 1 ? 's' : ''}</span>
        <span className="text-gray-600">|</span>
        <span>
          Total P/L:{' '}
          <span className={`font-mono font-semibold ${
            orders.reduce((s, o) => s + o.profit, 0) >= 0 ? 'text-success' : 'text-danger'
          }`}>
            {orders.reduce((s, o) => s + o.profit, 0) >= 0 ? '+' : '-'}
            {fmtNum(orders.reduce((s, o) => s + o.profit, 0))} {rawCur}
          </span>
        </span>
      </div>
    </div>
  );
};
