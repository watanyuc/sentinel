import { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { openTrade } from '../../services/api';
import { useUIStore } from '../../stores/uiStore';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface Props {
  accountId: string;
  accountName: string;
  currency: string;
  onClose: () => void;
}

export const NewTradeDialog = ({ accountId, accountName, currency, onClose }: Props) => {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);

  const [symbol, setSymbol] = useState('');
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [volume, setVolume] = useState('0.01');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [price, setPrice] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [comment, setComment] = useState('SENTINEL');

  const handleSubmit = async () => {
    const vol = parseFloat(volume);
    if (!symbol.trim()) {
      addToast({ type: 'error', title: 'Symbol is required' });
      return;
    }
    if (!vol || vol <= 0) {
      addToast({ type: 'error', title: 'Volume must be > 0' });
      return;
    }
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      addToast({ type: 'error', title: 'Price is required for limit orders' });
      return;
    }

    setLoading(true);
    try {
      await openTrade(accountId, {
        symbol: symbol.trim().toUpperCase(),
        action,
        volume: vol,
        price: orderType === 'limit' ? parseFloat(price) : 0,
        sl: parseFloat(sl) || 0,
        tp: parseFloat(tp) || 0,
        comment: comment || 'SENTINEL',
      });
      addToast({
        type: 'warning',
        title: 'Trade queued',
        message: `${action} ${vol} ${symbol.toUpperCase()} sent to EA (~2s)`,
      });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Failed to queue trade';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue transition-colors";
  const labelCls = "block text-[11px] text-gray-500 mb-1";

  const rawCur = currency || 'USD';

  return (
    <Dialog open onClose={onClose} title={`New Trade — ${accountName}`}>
      <div className="space-y-4">

        {/* Warning */}
        <div className="flex items-start gap-2 p-2.5 bg-warning/10 border border-warning/30 rounded-lg">
          <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400">
            คำสั่งจะถูกส่งไปยัง EA และดำเนินการใน MT5 จริง ตรวจสอบพารามิเตอร์ก่อนกด Confirm
          </p>
        </div>

        {/* Symbol + Action */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={e => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. EURUSD, XAUUSD"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>Action</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              <button
                onClick={() => setAction('BUY')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors ${
                  action === 'BUY'
                    ? 'bg-success text-white'
                    : 'bg-bg-primary text-gray-400 hover:text-success'
                }`}
              >
                <TrendingUp size={14} /> BUY
              </button>
              <button
                onClick={() => setAction('SELL')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors ${
                  action === 'SELL'
                    ? 'bg-danger text-white'
                    : 'bg-bg-primary text-gray-400 hover:text-danger'
                }`}
              >
                <TrendingDown size={14} /> SELL
              </button>
            </div>
          </div>
        </div>

        {/* Volume + Order Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Volume (Lots)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={volume}
              onChange={e => setVolume(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Order Type</label>
            <select
              value={orderType}
              onChange={e => setOrderType(e.target.value as 'market' | 'limit')}
              className={inputCls}
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
            </select>
          </div>
        </div>

        {/* Price (limit only) */}
        {orderType === 'limit' && (
          <div>
            <label className={labelCls}>Limit Price</label>
            <input
              type="number"
              step="0.00001"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Entry price"
              className={inputCls}
            />
          </div>
        )}

        {/* SL + TP */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Stop Loss <span className="text-gray-600">(0 = none)</span></label>
            <input
              type="number"
              step="0.00001"
              value={sl}
              onChange={e => setSl(e.target.value)}
              placeholder="0.00000"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Take Profit <span className="text-gray-600">(0 = none)</span></label>
            <input
              type="number"
              step="0.00001"
              value={tp}
              onChange={e => setTp(e.target.value)}
              placeholder="0.00000"
              className={inputCls}
            />
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className={labelCls}>Comment</label>
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={31}
            className={inputCls}
          />
        </div>

        {/* Summary preview */}
        {symbol && parseFloat(volume) > 0 && (
          <div className={`p-3 rounded-lg border text-xs ${
            action === 'BUY'
              ? 'bg-success/10 border-success/30'
              : 'bg-danger/10 border-danger/30'
          }`}>
            <span className={`font-bold ${action === 'BUY' ? 'text-success' : 'text-danger'}`}>
              {action}
            </span>
            {' '}{parseFloat(volume).toFixed(2)} lots{' '}
            <span className="text-white font-medium">{symbol}</span>
            {orderType === 'limit' && price && ` @ ${price}`}
            {parseFloat(sl) > 0 && <span className="text-danger"> SL:{sl}</span>}
            {parseFloat(tp) > 0 && <span className="text-success"> TP:{tp}</span>}
            <span className="text-gray-500"> on {accountName} ({rawCur})</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-1">
          <button className="btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !symbol || !parseFloat(volume)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 ${
              action === 'BUY'
                ? 'bg-success hover:bg-green-600 text-white'
                : 'bg-danger hover:bg-red-600 text-white'
            }`}
          >
            {loading ? 'Sending...' : `Confirm ${action}`}
          </button>
        </div>
      </div>
    </Dialog>
  );
};
