import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sentinel_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  res => res,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sentinel_token');
      localStorage.removeItem('sentinel_auth');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data as { token: string; user: { id: string; email: string; role: string; name: string | null } };
};

export const getProfile = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const updateProfile = async (data: { name?: string; email?: string }) => {
  const res = await api.patch('/auth/profile', data);
  return res.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  const res = await api.post('/auth/change-password', data);
  return res.data;
};

// Accounts
export const fetchAccounts = async () => {
  const res = await api.get('/accounts');
  return res.data;
};

export const createAccount = async (data: {
  name: string; broker: string; accountNumber: string;
  apiKey: string; server: string; currency: string; leverage: number;
}) => {
  const res = await api.post('/accounts', data);
  return res.data;
};

export const deleteAccount = async (id: string) => {
  const res = await api.delete(`/accounts/${id}`);
  return res.data;
};

export const revealApiKey = async (id: string): Promise<string> => {
  const res = await api.get(`/accounts/${id}/apikey`);
  return res.data.apiKey;
};

export const closeAllOrders = async (id: string) => {
  const res = await api.post(`/accounts/${id}/close-all`);
  return res.data;
};

// Dashboard
export const fetchOverview = async () => {
  const res = await api.get('/dashboard/overview');
  return res.data;
};

export const fetchTodayPnl = async (): Promise<Record<string, number>> => {
  const res = await api.get('/dashboard/today-pnl');
  return res.data;
};

export const fetchHeatmapAccounts = async () => {
  const res = await api.get('/dashboard/heatmap/accounts');
  return res.data;
};

export const fetchHeatmapOrders = async () => {
  const res = await api.get('/dashboard/heatmap/orders');
  return res.data;
};

export const fetchHeatmapPending = async () => {
  const res = await api.get('/dashboard/heatmap/pending');
  return res.data;
};

// Admin - User Management
export const fetchUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

export const createUser = async (data: { email: string; password: string; name?: string; role?: string }) => {
  const res = await api.post('/admin/users', data);
  return res.data;
};

export const deleteUser = async (id: string) => {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data;
};

export const changeUserRole = async (id: string, role: string) => {
  const res = await api.patch(`/admin/users/${id}/role`, { role });
  return res.data;
};

// Telegram Settings
import type {
  TelegramSettings,
  AccountAlerts,
  EquitySnapshot,
  TradeHistoryResponse,
  DailyPnL,
  PerformanceMetrics,
  NotificationResponse,
  AccountGroup,
  ReportSettings,
  ProtectionSettings,
  AuditLogResponse,
  UserPreferences,
} from '../types';

export const getTelegramSettings = async (): Promise<TelegramSettings> => {
  const res = await api.get('/auth/telegram');
  return res.data;
};

export const saveTelegramSettings = async (data: {
  telegramBotToken?: string;
  telegramChatId?: string;
}) => {
  const res = await api.patch('/auth/telegram', data);
  return res.data as TelegramSettings;
};

export const testTelegramMessage = async () => {
  const res = await api.post('/auth/telegram/test');
  return res.data as { ok: boolean; message: string };
};

// Account Alerts
export const getAccountAlerts = async (accountId: string): Promise<AccountAlerts> => {
  const res = await api.get(`/accounts/${accountId}/alerts`);
  return res.data;
};

export const saveAccountAlerts = async (
  accountId: string,
  data: Omit<AccountAlerts, 'id'>,
): Promise<AccountAlerts> => {
  const res = await api.patch(`/accounts/${accountId}/alerts`, data);
  return res.data;
};

// --- Analytics ---

export const fetchEquityHistory = async (
  accountId: string,
  timeframe: '1D' | '1W' | '1M' | '3M' = '1M',
): Promise<EquitySnapshot[]> => {
  const res = await api.get(`/analytics/equity/${accountId}`, { params: { timeframe } });
  return res.data;
};

export const fetchTradeHistory = async (params: {
  accountId?: string;
  page?: number;
  limit?: number;
  symbol?: string;
  type?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}): Promise<TradeHistoryResponse> => {
  const res = await api.get('/analytics/trades', { params });
  return res.data;
};

export const fetchDailyPnL = async (
  accountId?: string,
  period: '1M' | '3M' | '6M' = '3M',
): Promise<DailyPnL[]> => {
  const res = await api.get('/analytics/pnl', { params: { accountId, period } });
  return res.data;
};

export const fetchPerformanceMetrics = async (
  accountId?: string,
): Promise<PerformanceMetrics> => {
  const res = await api.get('/analytics/performance', { params: { accountId } });
  return res.data;
};

// --- Notifications ---

export const fetchNotifications = async (
  page = 1,
  limit = 25,
): Promise<NotificationResponse> => {
  const res = await api.get('/notifications', { params: { page, limit } });
  return res.data;
};

// --- Groups ---

export const fetchGroups = async (): Promise<AccountGroup[]> => {
  const res = await api.get('/groups');
  return res.data;
};

export const createGroup = async (name: string, color: string): Promise<AccountGroup> => {
  const res = await api.post('/groups', { name, color });
  return res.data;
};

export const updateGroupApi = async (
  id: string,
  data: { name?: string; color?: string },
): Promise<AccountGroup> => {
  const res = await api.patch(`/groups/${id}`, data);
  return res.data;
};

export const deleteGroupApi = async (id: string) => {
  const res = await api.delete(`/groups/${id}`);
  return res.data;
};

export const assignAccountGroup = async (
  accountId: string,
  groupId: string | null,
) => {
  const res = await api.patch(`/groups/assign/${accountId}`, { groupId });
  return res.data;
};

// --- Report Settings ---

export const fetchReportSettings = async (): Promise<ReportSettings> => {
  const res = await api.get('/settings/report');
  return res.data;
};

export const saveReportSettings = async (data: Partial<ReportSettings>): Promise<ReportSettings> => {
  const res = await api.patch('/settings/report', data);
  return res.data;
};

export const sendReportNow = async () => {
  const res = await api.post('/settings/report/send-now');
  return res.data;
};

// --- Drawdown Protection ---

export const fetchProtectionSettings = async (accountId: string): Promise<ProtectionSettings> => {
  const res = await api.get(`/settings/protection/${accountId}`);
  return res.data;
};

export const saveProtectionSettings = async (
  accountId: string,
  data: { protectionEnabled?: boolean; protectionDrawdown?: number | null },
): Promise<ProtectionSettings> => {
  const res = await api.patch(`/settings/protection/${accountId}`, data);
  return res.data;
};

// --- Audit Logs ---

export const fetchAuditLogs = async (params: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
}): Promise<AuditLogResponse> => {
  const res = await api.get('/admin/audit', { params });
  return res.data;
};

export const fetchAuditActions = async (): Promise<string[]> => {
  const res = await api.get('/admin/audit/actions');
  return res.data;
};

// --- Preferences ---

export const fetchPreferences = async (): Promise<UserPreferences> => {
  const res = await api.get('/settings/preferences');
  return res.data;
};

export const savePreferences = async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
  const res = await api.patch('/settings/preferences', data);
  return res.data;
};

// --- PDPA ---

export const exportMyData = async () => {
  const res = await api.get('/auth/my-data');
  return res.data;
};

export const deleteMyAccount = async () => {
  const res = await api.delete('/auth/my-account');
  return res.data;
};

export default api;
