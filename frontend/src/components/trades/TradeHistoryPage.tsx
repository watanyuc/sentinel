import { useState, useEffect } from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { fetchTradeHistory } from '../../services/api';
import { exportToCSV } from '../../utils/export';
import { History, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ClosedTrade } from '../../types';

export const TradeHistoryPage = () => {
  const accounts = useAccountStore(s => s.accounts);
  const [accountId, setAccountId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sortBy, setSortBy] = useState('closeTime');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    fetchTradeHistory({
      accountId: accountId || undefined,
      page,
      limit,
      symbol: symbol || undefined,
      type: type || undefined,
      sortBy,
      sortDir,
    })
      .then(res => {
        setTrades(res.trades);
        setTotal(res.total);
      })
      .catch(() => {
        setTrades([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [accountId, symbol, type, page, sortBy, sortDir]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  const sortIcon = (col: string) => {
    if (sortBy !== col) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const handleExport = () => {
    if (trades.length === 0) return;
    exportToCSV(
      trades.map(t => ({
        ticket: t.ticket,
        symbol: t.symbol,
        type: t.type,
        lots: t.lots,
        openPrice: t.openPrice,
        closePrice: t.closePrice,
        profit: t.profit,
        openTime: t.openTime,
        closeTime: t.closeTime,
        sl: t.sl,
        tp: t.tp,
        account: t.account?.name || '',
      })),
      `trade-history-${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'ticket', label: 'Ticket' },
        { key: 'symbol', label: 'Symbol' },
        { key: 'type', label: 'Type' },
        { key: 'lots', label: 'Lots' },
        { key: 'openPrice', label: 'Open Price' },
        { key: 'closePrice', label: 'Close Price' },
        { key: 'profit', label: 'Profit' },
        { key: 'openTime', label: 'Open Time' },
        { key: 'closeTime', label: 'Close Time' },
        { key: 'sl', label: 'SL' },
        { key: 'tp', label: 'TP' },
        { key: 'account', label: 'Account' },
      ],
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <History size={20} className="text-accent-blue" />
          <h2 className="text-lg font-semibold text-white">Trade History</h2>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <button
          onClick={handleExport}
          disabled={trades.length === 0}
          className="btn-ghost text-xs flex items-center gap-1.5"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={accountId}
          onChange={e => { setAccountId(e.target.value); setPage(1); }}
          className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
        >
          <option value="">All Accounts</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Symbol filter..."
          value={symbol}
          onChange={e => { setSymbol(e.target.value); setPage(1); }}
          className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-blue w-32"
        />

        <select
          value={type}
          onChange={e => { setType(e.target.value); setPage(1); }}
          className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
        >
          <option value="">All Types</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left py-2 px-2 cursor-pointer hover:text-white" onClick={() => handleSort('ticket')}>
                Ticket{sortIcon('ticket')}
              </th>
              <th className="text-left py-2 px-2 cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>
                Symbol{sortIcon('symbol')}
              </th>
              <th className="text-left py-2 px-2">Type</th>
              <th className="text-right py-2 px-2">Lots</th>
              <th className="text-right py-2 px-2">Open</th>
              <th className="text-right py-2 px-2">Close</th>
              <th className="text-right py-2 px-2 cursor-pointer hover:text-white" onClick={() => handleSort('profit')}>
                Profit{sortIcon('profit')}
              </th>
              <th className="text-left py-2 px-2 cursor-pointer hover:text-white" onClick={() => handleSort('closeTime')}>
                Close Time{sortIcon('closeTime')}
              </th>
              <th className="text-left py-2 px-2">Account</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : trades.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">No closed trades found.</td></tr>
            ) : (
              trades.map(t => (
                <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 px-2 font-mono text-gray-400">#{t.ticket}</td>
                  <td className="py-2 px-2 font-semibold text-white">{t.symbol}</td>
                  <td className="py-2 px-2">
                    <span className={`font-medium ${t.type === 'BUY' ? 'text-success' : 'text-danger'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-300">{t.lots.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right font-mono text-gray-400">{t.openPrice.toFixed(5)}</td>
                  <td className="py-2 px-2 text-right font-mono text-gray-400">{t.closePrice.toFixed(5)}</td>
                  <td className={`py-2 px-2 text-right font-mono font-medium ${t.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {t.profit >= 0 ? '+' : ''}{t.profit.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-gray-400">
                    {new Date(t.closeTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2 px-2 text-gray-500">{t.account?.name || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages} ({total} trades)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
