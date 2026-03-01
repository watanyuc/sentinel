import { useState } from 'react';
import { Download, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { exportMyData, deleteMyAccount } from '../../services/api';
import { useTranslation } from '../../i18n/useTranslation';

export const PrivacyPolicy = () => {
  const t = useTranslation();
  const { addToast } = useUIStore();
  const logout = useAuthStore(s => s.logout);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentinel-my-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Data exported successfully' });
    } catch {
      addToast({ type: 'error', title: 'Failed to export data' });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteMyAccount();
      addToast({ type: 'info', title: 'Account deleted' });
      logout();
    } catch {
      addToast({ type: 'error', title: 'Failed to delete account' });
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <Shield size={20} />
        Privacy Policy & Data Protection (PDPA)
      </h1>

      {/* Policy content */}
      <div className="card space-y-4 text-sm text-gray-300 leading-relaxed">
        <h2 className="text-base font-semibold text-white">1. Data We Collect</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li><strong className="text-gray-300">Account info:</strong> Email, name, password (hashed)</li>
          <li><strong className="text-gray-300">Trading accounts:</strong> Broker name, account number, server</li>
          <li><strong className="text-gray-300">Trading data:</strong> Equity snapshots, closed trades, alerts (retained for 90 days)</li>
          <li><strong className="text-gray-300">Telegram credentials:</strong> Bot token (encrypted), chat ID</li>
          <li><strong className="text-gray-300">Activity logs:</strong> Login history, action audit trail (retained for 1 year)</li>
        </ul>

        <h2 className="text-base font-semibold text-white">2. What We Do NOT Collect</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li>We do NOT store trading passwords or MT5 login credentials</li>
          <li>We do NOT share any data with third parties</li>
          <li>We do NOT use cookies for tracking or advertising</li>
          <li>We do NOT collect IP addresses or browser fingerprints</li>
        </ul>

        <h2 className="text-base font-semibold text-white">3. Data Security</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li>Passwords are hashed with bcrypt (irreversible)</li>
          <li>Telegram bot tokens are encrypted with AES-256-GCM</li>
          <li>API keys are masked in all responses (only last 6 characters visible)</li>
          <li>JWT authentication with 24-hour expiry</li>
          <li>All communications should use HTTPS in production</li>
        </ul>

        <h2 className="text-base font-semibold text-white">4. Data Retention</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li>Equity snapshots: automatically deleted after <strong className="text-gray-300">90 days</strong></li>
          <li>Closed trades: automatically deleted after <strong className="text-gray-300">90 days</strong></li>
          <li>Notification logs: automatically deleted after <strong className="text-gray-300">90 days</strong></li>
          <li>Audit logs: automatically deleted after <strong className="text-gray-300">1 year</strong></li>
          <li>User accounts: retained until manually deleted</li>
        </ul>

        <h2 className="text-base font-semibold text-white">5. Your Rights (PDPA)</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li><strong className="text-gray-300">Right to access:</strong> You can export all your data at any time</li>
          <li><strong className="text-gray-300">Right to erasure:</strong> You can permanently delete your account and all data</li>
          <li><strong className="text-gray-300">Right to rectification:</strong> You can update your profile at any time</li>
          <li><strong className="text-gray-300">Right to data portability:</strong> Data export is available in JSON format</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-white">Your Data Rights</h2>

        {/* Export data */}
        <div className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-gray-800">
          <div>
            <p className="text-sm font-medium text-white">Export My Data</p>
            <p className="text-xs text-gray-500">Download a copy of all your personal data as JSON</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Download size={13} />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>

        {/* Delete account */}
        <div className="p-3 bg-bg-primary rounded-lg border border-danger/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-danger">Delete My Account</p>
              <p className="text-xs text-gray-500">Permanently delete your account and all associated data. This cannot be undone.</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs px-4 py-2 border border-danger/50 text-danger rounded-lg hover:bg-danger hover:text-white transition-all flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-3 p-3 bg-danger/10 border border-danger/30 rounded-lg">
              <div className="flex items-center gap-2 text-danger text-sm mb-2">
                <AlertTriangle size={14} />
                <span className="font-medium">This action is permanent and irreversible</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                All your accounts, trading history, alerts, and settings will be permanently deleted.
                Type <strong className="text-white">DELETE</strong> to confirm.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={deleteText}
                  onChange={e => setDeleteText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="flex-1 bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-danger"
                />
                <button
                  onClick={handleDelete}
                  disabled={deleteText !== 'DELETE' || deleting}
                  className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all ${
                    deleteText === 'DELETE' && !deleting
                      ? 'bg-danger text-white hover:bg-red-700'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                  className="text-xs px-3 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
