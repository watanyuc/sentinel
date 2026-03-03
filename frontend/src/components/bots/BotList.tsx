import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Search, SlidersHorizontal, Settings2, X } from 'lucide-react';
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
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  // Close filter popup on outside click
  useEffect(() => {
    if (!showFilter) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilter]);

  const brokers = useMemo(() => {
    const b = new Set(accounts.map(a => a.broker));
    return ['all', ...Array.from(b)];
  }, [accounts]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (botFilter.status !== 'all') count++;
    if (botFilter.broker !== 'all') count++;
    if (botFilter.group !== 'all') count++;
    if (botFilter.sort !== 'name') count++;
    if (botFilter.search.trim()) count++;
    return count;
  }, [botFilter]);

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

  const clearFilters = () => {
    setBotFilter({ status: 'all', broker: 'all', search: '', sort: 'name', group: 'all' });
  };

  const selectClass = "w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-blue";

  return (
    <div>
      {/* Compact header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Bot Accounts</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            {filtered.length}/{accounts.length}
          </span>
        </div>

        <div className="flex items-center gap-2 relative" ref={filterRef}>
          {/* Filter button */}
          <button
            onClick={() => setShowFilter(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showFilter || activeFilterCount > 0
                ? 'border-accent-blue text-accent-blue bg-accent-blue/10'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="bg-accent-blue text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Groups button */}
          <button
            onClick={() => setShowGroupManager(true)}
            className="flex items-center gap-1.5 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
          >
            <Settings2 size={13} />
            <span>Groups</span>
          </button>

          {/* Filter popup */}
          {showFilter && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-gray-700 rounded-xl shadow-2xl z-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">Filter & Sort</h4>
                <button onClick={() => setShowFilter(false)} className="text-gray-500 hover:text-gray-300">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Search */}
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Search</label>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Bot name, broker, account #..."
                      value={botFilter.search}
                      onChange={e => setBotFilter({ search: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-bg-primary border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-blue"
                    />
                  </div>
                </div>

                {/* Status + Broker row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Status</label>
                    <select
                      value={botFilter.status}
                      onChange={e => setBotFilter({ status: e.target.value })}
                      className={selectClass}
                    >
                      <option value="all">All</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Broker</label>
                    <select
                      value={botFilter.broker}
                      onChange={e => setBotFilter({ broker: e.target.value })}
                      className={selectClass}
                    >
                      {brokers.map(b => (
                        <option key={b} value={b}>{b === 'all' ? 'All' : b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Group + Sort row */}
                <div className="grid grid-cols-2 gap-3">
                  {groups.length > 0 && (
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Group</label>
                      <select
                        value={botFilter.group}
                        onChange={e => setBotFilter({ group: e.target.value })}
                        className={selectClass}
                      >
                        <option value="all">All</option>
                        <option value="ungrouped">Ungrouped</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Sort by</label>
                    <select
                      value={botFilter.sort}
                      onChange={e => setBotFilter({ sort: e.target.value })}
                      className={selectClass}
                    >
                      {SORT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={clearFilters}
                    className="flex-1 py-2 rounded-lg text-xs text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setShowFilter(false)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-accent-blue hover:bg-blue-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No bots match your filters</p>
          <button
            className="text-xs text-accent-blue hover:underline mt-2"
            onClick={clearFilters}
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
