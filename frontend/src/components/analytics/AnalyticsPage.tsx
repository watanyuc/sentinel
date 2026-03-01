import { useState } from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { EquityChart } from './EquityChart';
import { PnLChart } from './PnLChart';
import { PerformanceCards } from './PerformanceCards';
import { BarChart3 } from 'lucide-react';

type Tab = 'equity' | 'pnl' | 'performance';

export const AnalyticsPage = () => {
  const accounts = useAccountStore(s => s.accounts);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [tab, setTab] = useState<Tab>('equity');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'equity', label: 'Equity Chart' },
    { key: 'pnl', label: 'Daily P&L' },
    { key: 'performance', label: 'Performance' },
  ];

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-accent-blue" />
          <h2 className="text-lg font-semibold text-white">Analytics</h2>
        </div>

        {/* Account selector */}
        <select
          value={selectedAccount}
          onChange={e => setSelectedAccount(e.target.value)}
          className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue max-w-xs"
        >
          <option value="">All Accounts</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              tab === t.key
                ? 'text-accent-blue border-accent-blue'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'equity' && (
        selectedAccount ? (
          <EquityChart accountId={selectedAccount} />
        ) : (
          <div className="card text-center py-12 text-gray-500">
            <p className="text-sm">Select an account to view equity history.</p>
          </div>
        )
      )}
      {tab === 'pnl' && <PnLChart accountId={selectedAccount || undefined} />}
      {tab === 'performance' && <PerformanceCards accountId={selectedAccount || undefined} />}
    </div>
  );
};
