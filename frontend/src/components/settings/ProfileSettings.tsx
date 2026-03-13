import { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, Save, Loader2, MessageSquare, Send, Bell, ChevronLeft, ChevronRight, Download, Globe, Sun, Moon, Cpu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { updateProfile, changePassword, getTelegramSettings, saveTelegramSettings, testTelegramMessage, fetchNotifications, savePreferences } from '../../services/api';
import { exportToCSV } from '../../utils/export';
import { useTranslation } from '../../i18n/useTranslation';
import { ReportSettings } from './ReportSettings';
import { AccountsSection } from '../accounts/AccountsSection';
import type { NotificationLogEntry } from '../../types';

export const ProfileSettings = () => {
  const user = useAuthStore(s => s.user);
  const setAuth = useAuthStore(s => s.setAuth);
  const token = useAuthStore(s => s.token);
  const setCurrentPage = useUIStore(s => s.setCurrentPage);
  const addToast = useUIStore(s => s.addToast);
  const theme = useUIStore(s => s.theme);
  const setTheme = useUIStore(s => s.setTheme);
  const language = useUIStore(s => s.language);
  const setLanguage = useUIStore(s => s.setLanguage);
  const t = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  // Telegram
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const { data: telegramData, refetch: refetchTelegram } = useQuery({
    queryKey: ['telegram-settings'],
    queryFn: getTelegramSettings,
  });

  useEffect(() => {
    if (telegramData?.telegramChatId) {
      setChatId(telegramData.telegramChatId);
    }
  }, [telegramData]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ name, email });
      if (token) setAuth(token, updated);
      addToast({ type: 'success', title: 'Profile updated' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update';
      addToast({ type: 'error', title: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      addToast({ type: 'error', title: 'Password must be at least 6 characters' });
      return;
    }
    setChangingPw(true);
    try {
      await changePassword({ currentPassword, newPassword });
      addToast({ type: 'success', title: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to change password';
      addToast({ type: 'error', title: msg });
    } finally {
      setChangingPw(false);
    }
  };

  const handleSaveTelegram = async () => {
    setSavingTelegram(true);
    try {
      const payload: { telegramBotToken?: string; telegramChatId?: string } = {
        telegramChatId: chatId || undefined,
      };
      if (botToken && !botToken.startsWith('●')) {
        payload.telegramBotToken = botToken;
      }
      await saveTelegramSettings(payload);
      refetchTelegram();
      setBotToken('');
      addToast({ type: 'success', title: 'Telegram settings saved' });
    } catch {
      addToast({ type: 'error', title: 'Failed to save Telegram settings' });
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const result = await testTelegramMessage();
      addToast({ type: 'success', title: result.message });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send test message';
      addToast({ type: 'error', title: msg });
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => setCurrentPage('dashboard')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        {t('nav.back_dashboard')}
      </button>

      <h2 className="text-xl font-bold text-white">{t('profile.title')}</h2>

      {/* Profile Info */}
      <div className="bg-bg-secondary border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white mb-2">
          <User size={18} />
          <h3 className="font-semibold">Profile Information</h3>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Role:</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            user?.role === 'admin' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-gray-700 text-gray-300'
          }`}>{user?.role}</span>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-bg-secondary border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white mb-2">
          <Lock size={18} />
          <h3 className="font-semibold">Change Password</h3>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={changingPw || !currentPassword || !newPassword || !confirmPassword}
          className="flex items-center gap-2 px-4 py-2 bg-warning text-black text-sm rounded-lg hover:bg-warning/80 disabled:opacity-50 transition-colors"
        >
          {changingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
          Change Password
        </button>
      </div>

      {/* API Key Management */}
      <AccountsSection />

      {/* Telegram Alerts */}
      <div className="bg-bg-secondary border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-white">
            <MessageSquare size={18} />
            <h3 className="font-semibold">Telegram Alerts</h3>
          </div>
          {telegramData?.configured && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
              Configured
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Enter your Telegram Bot Token and Chat ID to receive account alerts.
          Per-account alert thresholds are configured via the bell icon in API Key Management.
        </p>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Bot Token</label>
          <input
            type="password"
            value={botToken}
            onChange={e => setBotToken(e.target.value)}
            placeholder={telegramData?.telegramBotToken ?? 'Paste your bot token from @BotFather'}
            className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Chat ID</label>
          <input
            type="text"
            value={chatId}
            onChange={e => setChatId(e.target.value)}
            placeholder="Your Telegram chat ID (e.g. 123456789)"
            className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveTelegram}
            disabled={savingTelegram}
            className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 disabled:opacity-50 transition-colors"
          >
            {savingTelegram ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
          <button
            onClick={handleTestTelegram}
            disabled={testingTelegram || !telegramData?.configured}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {testingTelegram ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send Test
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-bg-secondary border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white mb-2">
          <Globe size={18} />
          <h3 className="font-semibold">{t('preferences.title')}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('preferences.language')}</label>
            <select
              value={language}
              onChange={e => {
                const val = e.target.value as 'en' | 'th';
                setLanguage(val);
                savePreferences({ language: val }).catch(() => {});
              }}
              className="bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            >
              <option value="en">English</option>
              <option value="th">ภาษาไทย</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('preferences.theme')}</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setTheme('dark'); savePreferences({ theme: 'dark' }).catch(() => {}); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  theme === 'dark' ? 'bg-accent-blue text-white' : 'bg-bg-primary border border-gray-700 text-gray-400'
                }`}
              >
                <Moon size={14} />
                {t('preferences.dark')}
              </button>
              <button
                onClick={() => { setTheme('light'); savePreferences({ theme: 'light' }).catch(() => {}); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  theme === 'light' ? 'bg-accent-blue text-white' : 'bg-bg-primary border border-gray-700 text-gray-400'
                }`}
              >
                <Sun size={14} />
                {t('preferences.light')}
              </button>
              <button
                onClick={() => { setTheme('hud'); savePreferences({ theme: 'hud' }).catch(() => {}); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  theme === 'hud'
                    ? 'bg-cyan-500 text-black font-semibold'
                    : 'bg-bg-primary border border-gray-700 text-gray-400'
                }`}
              >
                <Cpu size={14} />
                {t('preferences.hud')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Reports */}
      <ReportSettings />

      {/* Notification History */}
      <NotificationHistory />
    </div>
  );
};

// --- Notification History Sub-component ---
const NotificationHistory = () => {
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const load = () => {
    setLoading(true);
    fetchNotifications(page, limit)
      .then(res => { setLogs(res.logs); setTotal(res.total); })
      .catch(() => { setLogs([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleExport = () => {
    if (logs.length === 0) return;
    exportToCSV(
      logs.map(l => ({
        type: l.type,
        message: l.message.replace(/<[^>]+>/g, ''),
        success: l.success ? 'Yes' : 'No',
        sentAt: new Date(l.sentAt).toLocaleString(),
      })),
      `notifications-${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'type', label: 'Type' },
        { key: 'message', label: 'Message' },
        { key: 'success', label: 'Success' },
        { key: 'sentAt', label: 'Sent At' },
      ],
    );
  };

  const typeColors: Record<string, string> = {
    drawdown: 'text-warning',
    equity: 'text-accent-blue',
    margin: 'text-danger',
    offline: 'text-gray-400',
    close_all: 'text-danger',
    test: 'text-success',
  };

  return (
    <div className="bg-bg-secondary border border-gray-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white">
          <Bell size={18} />
          <h3 className="font-semibold">Notification History</h3>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <Download size={12} />
          Export
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 text-center py-6">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-6">No notifications sent yet.</div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div
              key={log.id}
              className="flex items-start gap-3 bg-bg-primary border border-gray-800 rounded-lg px-3 py-2"
            >
              <div className={`text-xs font-mono font-medium uppercase shrink-0 w-16 ${typeColors[log.type] || 'text-gray-400'}`}>
                {log.type}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">
                  {log.message.replace(/<[^>]+>/g, '').replace(/\[SENTINEL\]\n?/, '').slice(0, 120)}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {new Date(log.sentAt).toLocaleString()}
                </p>
              </div>
              <div className="shrink-0">
                {log.success ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success">Sent</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/20 text-danger">Failed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-gray-500">
            Page {page}/{totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 text-gray-500 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 text-gray-500 hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
