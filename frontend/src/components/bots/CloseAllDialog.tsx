import { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { AlertTriangle } from 'lucide-react';
import { closeAllOrders } from '../../services/api';
import { useUIStore } from '../../stores/uiStore';

interface Props {
  accountId: string;
  accountName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CloseAllDialog = ({ accountId, accountName, onClose, onSuccess }: Props) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useUIStore();

  const canConfirm = confirmText === 'CLOSE';

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const result = await closeAllOrders(accountId);
      if (result.mode === 'immediate') {
        addToast({
          type: 'success',
          title: 'All positions closed',
          message: `Closed ${result.closed} orders, deleted ${result.deleted} pending on ${accountName}`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Close All queued',
          message: `Command will execute on ${accountName} when EA polls next (~2s)`,
        });
      }
      onSuccess();
      onClose();
    } catch {
      addToast({ type: 'error', title: 'Failed to close orders' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title="Confirm Close All Orders">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-danger/10 border border-danger/30 rounded-xl">
          <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger">Dangerous Action</p>
            <p className="text-xs text-gray-400 mt-0.5">
              This will close ALL open orders on <strong className="text-white">{accountName}</strong>.
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">
            Type <strong className="text-white font-mono">CLOSE</strong> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="Type CLOSE here"
            className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-danger font-mono tracking-wider"
            autoFocus
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className={`btn-danger ${!canConfirm ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
          >
            {loading ? 'Sending...' : 'Close All Orders'}
          </button>
        </div>
      </div>
    </Dialog>
  );
};
