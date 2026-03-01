import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOverview } from '../../services/api';
import type { OverviewStats } from '../../types';
import { SummaryCards } from './SummaryCards';
import { AccountHeatmap } from '../heatmaps/AccountHeatmap';
import { OrdersHeatmap } from '../heatmaps/OrdersHeatmap';
import { PendingHeatmap } from '../heatmaps/PendingHeatmap';
import { CardSkeleton } from '../ui/Skeleton';
import { BarChart2, Grid, List, Clock } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <BarChart2 size={14} /> },
  { id: 'accounts', label: 'Account Health', icon: <Grid size={14} /> },
  { id: 'orders', label: 'Open Orders', icon: <List size={14} /> },
  { id: 'pending', label: 'Pending', icon: <Clock size={14} /> },
];

export const OverviewTabs = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading } = useQuery<OverviewStats>({
    queryKey: ['overview'],
    queryFn: fetchOverview,
    refetchInterval: 5000,
  });

  return (
    <div className="card p-0 overflow-hidden">
      {/* Tab nav */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-accent-blue text-accent-blue'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div>
            {isLoading || !stats ? (
              <div className="grid grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : (
              <SummaryCards stats={stats} />
            )}
          </div>
        )}
        {activeTab === 'accounts' && <AccountHeatmap />}
        {activeTab === 'orders' && <OrdersHeatmap />}
        {activeTab === 'pending' && <PendingHeatmap />}
      </div>
    </div>
  );
};
