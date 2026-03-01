import { useState, useEffect } from 'react';
import { FileText, ChevronLeft, ChevronRight, Download, ArrowLeft } from 'lucide-react';
import { fetchAuditLogs, fetchAuditActions, fetchUsers } from '../../services/api';
import { exportToCSV } from '../../utils/export';
import { useUIStore } from '../../stores/uiStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { AuditLogEntry, UserInfo } from '../../types';

const actionColors: Record<string, string> = {
  login: 'text-accent-blue',
  create_account: 'text-success',
  delete_account: 'text-danger',
  create_user: 'text-success',
  delete_user: 'text-danger',
  close_all: 'text-warning',
  protection_triggered: 'text-danger',
  change_password: 'text-accent-purple',
  change_role: 'text-warning',
  update_profile: 'text-accent-blue',
  update_telegram: 'text-accent-blue',
  update_alerts: 'text-accent-blue',
  update_report_settings: 'text-accent-blue',
  update_protection: 'text-warning',
  create_group: 'text-success',
  update_group: 'text-accent-blue',
  delete_group: 'text-danger',
};

export const AuditLogViewer = () => {
  const setCurrentPage = useUIStore(s => s.setCurrentPage);
  const t = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const limit = 25;

  useEffect(() => {
    fetchAuditActions().then(setActions).catch(() => {});
    fetchUsers().then(setUsers).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    fetchAuditLogs({
      page,
      limit,
      userId: filterUser || undefined,
      action: filterAction || undefined,
    })
      .then(res => {
        setLogs(res.logs);
        setTotal(res.total);
      })
      .catch(() => {
        setLogs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, filterUser, filterAction]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleExport = () => {
    if (logs.length === 0) return;
    exportToCSV(
      logs.map(l => ({
        user: l.user?.email || l.userId,
        action: l.action,
        resourceType: l.resourceType || '',
        resourceId: l.resourceId || '',
        details: l.details || '',
        time: new Date(l.createdAt).toLocaleString(),
      })),
      `audit-log-${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'user', label: 'User' },
        { key: 'action', label: 'Action' },
        { key: 'resourceType', label: 'Resource Type' },
        { key: 'resourceId', label: 'Resource ID' },
        { key: 'details', label: 'Details' },
        { key: 'time', label: 'Time' },
      ],
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <button
        onClick={() => setCurrentPage('dashboard')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        {t('nav.back_dashboard')}
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-accent-blue" />
          <h2 className="text-lg font-semibold text-white">{t('audit.title')}</h2>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className="btn-ghost text-xs flex items-center gap-1.5"
        >
          <Download size={14} />
          {t('audit.export')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterUser}
          onChange={e => { setFilterUser(e.target.value); setPage(1); }}
          className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
        >
          <option value="">{t('audit.all_users')}</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>

        <select
          value={filterAction}
          onChange={e => { setFilterAction(e.target.value); setPage(1); }}
          className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
        >
          <option value="">{t('audit.all_actions')}</option>
          {actions.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left py-2 px-2">{t('audit.user')}</th>
              <th className="text-left py-2 px-2">{t('audit.action')}</th>
              <th className="text-left py-2 px-2">{t('audit.resource')}</th>
              <th className="text-left py-2 px-2">{t('audit.details')}</th>
              <th className="text-left py-2 px-2">{t('audit.time')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">{t('common.loading')}</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">{t('audit.no_logs')}</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 px-2 text-gray-300">
                    {log.user?.email || log.userId.slice(0, 8)}
                  </td>
                  <td className="py-2 px-2">
                    <span className={`font-mono font-medium ${actionColors[log.action] || 'text-gray-400'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-400">
                    {log.resourceType && (
                      <span className="text-gray-500">{log.resourceType}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-gray-500 max-w-[200px] truncate" title={log.details || ''}>
                    {log.details ? log.details.slice(0, 60) : '—'}
                  </td>
                  <td className="py-2 px-2 text-gray-400">
                    {new Date(log.createdAt).toLocaleString([], {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
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
            {t('common.page')} {page} {t('common.of')} {totalPages} ({total} {t('common.total')})
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
