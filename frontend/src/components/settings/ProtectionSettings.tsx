import { useState, useEffect } from 'react';
import { Shield, Save, Loader2, X } from 'lucide-react';
import { fetchProtectionSettings, saveProtectionSettings } from '../../services/api';
import { useUIStore } from '../../stores/uiStore';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  accountId: string;
  accountName: string;
  onClose: () => void;
}

export const ProtectionSettings = ({ accountId, accountName, onClose }: Props) => {
  const addToast = useUIStore(s => s.addToast);
  const t = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProtectionSettings(accountId)
      .then(data => {
        setEnabled(data.protectionEnabled);
        setThreshold(data.protectionDrawdown?.toString() || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accountId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProtectionSettings(accountId, {
        protectionEnabled: enabled,
        protectionDrawdown: threshold ? parseFloat(threshold) : null,
      });
      addToast({ type: 'success', title: t('protection.saved') });
      onClose();
    } catch {
      addToast({ type: 'error', title: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Shield size={18} className="text-warning" />
            <h3 className="font-semibold">{t('protection.title')}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-500">{accountName}</p>

        <p className="text-xs text-warning/80 bg-warning/10 border border-warning/20 rounded-lg p-3">
          {t('protection.description')}
        </p>

        {loading ? (
          <div className="text-sm text-gray-500 text-center py-4">{t('common.loading')}</div>
        ) : (
          <>
            {/* Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-warning"
              />
              <span className="text-sm text-gray-300">{t('protection.enabled')}</span>
            </label>

            {enabled && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('protection.threshold')}</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                  placeholder="e.g. 10"
                  min={1}
                  max={100}
                  step={0.5}
                  className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-warning"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-warning text-black text-sm font-medium rounded-lg hover:bg-warning/80 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t('protection.save')}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
