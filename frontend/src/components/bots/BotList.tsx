import { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Folder, Settings2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccountStore } from '../../stores/accountStore';
import { useUIStore } from '../../stores/uiStore';
import { fetchGroups, fetchTodayPnl } from '../../services/api';
import type { Account, AccountGroup } from '../../types';
import { BotCard } from './BotCard';
import { GroupManager } from '../groups/GroupManager';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'profit', label: 'P/L (High→Low)' },
  { value: 'balance', label: 'Balance (High→Low)' },
  { value: 'drawdown', label: 'Drawdown (High→Low)' },
  { value: 'status', label: 'Status (Online first)' },
];

export const BotList = () => {
  const accounts = useAccountStore(s => s.accounts);
  const { botFilter, setBotFilter } = useUIStore();
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [showGroupManager, setShowGroupManager] = useState(false);

  const { data: todayPnlData } = useQuery({
    queryKey: ['today-pnl'],
    queryFn: fetchTodayPnl,
    refetchInterval: 10_000,
  });

  const loadGroups = useCallback(() => {
    fetchGroups().then(setGroups).catch(() => {});
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const brokers = useMemo(() => {
    const b = new Set(accounts.map(a => a.broker));
    return ['all', ...Array.from(b)];
  }, [accounts]);

  const filtered = useMemo(() => {
    let result = [...accounts];

    if (botFilter.status !== 'all') {
      result = result.filter(a => a.status === botFilter.status);
    }
    if (botFilter.broker !== 'all') {
      result = result.filter(a => a.broker === botFilter.broker);
    }
    if (botFilter.group !== 'all') {
      if (botFilter.group === 'ungrouped') {
        result = result.filter(a => !a.groupId);
      } else {
        result = result.filter(a => a.groupId === botFilter.group);
      }
    }
    if (botFilter.search.trim()) {
      const q = botFilter.search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.broker.toLowerCase().includes(q) ||
        a.accountNumber.includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (botFilter.sort) {
        case 'profit': return b.profit - a.profit;
        case 'balance': return b.balance - a.balance;
        case 'drawdown': return b.drawdown - a.drawdown;
        case 'status': return a.status === 'online' ? -1 : 1;
        default: return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [accounts, botFilter]);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-300">Bot Accounts</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            {filtered.length}/{accounts.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search bots..."
            value={botFilter.search}
            onChange={e => setBotFilter({ search: e.target.value })}
            className="pl-8 pr-3 py-1.5 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-blue w-44"
          />
        </div>

        {/* Status filter */}
        <select
          value={botFilter.status}
          onChange={e => setBotFilter({ status: e.target.value })}
          className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>

        {/* Broker filter */}
        <select
          value={botFilter.broker}
          onChange={e => setBotFilter({ broker: e.target.value })}
          className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
        >
          {brokers.map(b => (
            <option key={b} value={b}>{b === 'all' ? 'All Brokers' : b}</option>
          ))}
        </select>

        {/* Group filter */}
        {groups.length > 0 && (
          <select
            value={botFilter.group}
            onChange={e => setBotFilter({ group: e.target.value })}
            className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
          >
            <option value="all">All Groups</option>
            <option value="ungrouped">Ungrouped</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          value={botFilter.sort}
          onChange={e => setBotFilter({ sort: e.target.value })}
          className="bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Manage Groups */}
        <button
          onClick={() => setShowGroupManager(true)}
          className="flex items-center gap-1.5 bg-bg-secondary border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 hover:border-accent-blue transition-colors"
        >
          <Settings2 size={13} />
          <span>Groups</span>
        </button>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No bots match your filters</p>
          <button
            className="text-xs text-accent-blue hover:underline mt-2"
            onClick={() => setBotFilter({ status: 'all', broker: 'all', search: '', sort: 'name', group: 'all' })}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(account => (
            <BotCard key={account.id} account={account} todayPnl={todayPnlData?.[account.id] ?? 0} />
          ))}
        </div>
      )}

      {/* Group Manager Dialog */}
      <GroupManager
        open={showGroupManager}
        onClose={() => setShowGroupManager(false)}
        onGroupsChanged={loadGroups}
      />
    </div>
  );
};
