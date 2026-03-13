import { useState, useEffect, useRef } from 'react';
import type { Account, AccountGroup, Order } from '../../types';
import { formatLots, formatPercent, getDrawdownColor } from '../../utils/formatters';
import { FlashNumber } from '../ui/FlashNumber';
import { CloseAllDialog } from './CloseAllDialog';
import { ProtectionSettings } from '../settings/ProtectionSettings';
import { PositionPanel } from './PositionPanel';
import { NewTradeDialog } from './NewTradeDialog';
import { Wifi, WifiOff, XCircle, Shield, Folder, LayoutList, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../stores/uiStore';
import { fetchGroups, assignAccountGroup } from '../../services/api';

interface Props {
  account: Account;
  todayPnl?: number;
}

export const BotCard = ({ account, todayPnl = 0 }: Props) => {
  const [showCloseAll, setShowCloseAll] = useState(false);
  const [showProtection, setShowProtection] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const groupRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (!showGroupPicker) return;
    const handler = (e: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setShowGroupPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showGroupPicker]);

  const handleGroupPicker = async () => {
    if (!showGroupPicker) {
      try { setGroups(await fetchGroups()); } catch { /* ignore */ }
    }
    setShowGroupPicker(prev => !prev);
  };

  const handleAssignGroup = async (groupId: string | null) => {
    try {
      await assignAccountGroup(account.id, groupId);
      setShowGroupPicker(false);
      addToast({ type: 'success', title: groupId ? 'Group assigned' : 'Group removed' });
    } catch {
      addToast({ type: 'error', title: 'Failed to assign group' });
    }
  };

  const isOnline = account.status === 'online';
  const orderCount = typeof account.orders === 'number' ? account.orders : account.orders.length;
  const ordersArray: Order[] = Array.isArray(account.orders) ? account.orders : [];
  const isRealAccount = account.brokerTimeOffset != null;
  const rawCur = account.currency || 'USD';
  const cur = rawCur.toUpperCase() === 'USDC' ? 'USC' : rawCur;
  const fmtNum = (v: number) => {
    const abs = Math.abs(v);
    return abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['overview'] });
    queryClient.invalidateQueries({ queryKey: ['heatmap-orders'] });
  };

  const ddColor = getDrawdownColor(account.drawdown);

  return (
    <>
      <div className={`card transition-all duration-300 ${!isOnline ? 'opacity-60' : ''}`}>

        {/* ── Header: Name + Drawdown + Account# ── */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-success animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-sm font-semibold text-white truncate">{account.name}</span>
            {isOnline
              ? <Wifi size={12} className="text-success shrink-0" />
              : <WifiOff size={12} className="text-gray-500 shrink-0" />
            }
            {/* Drawdown — moved to header */}
            <span className={`shrink-0 text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-800 ${ddColor}`}>
              DD {formatPercent(account.drawdown)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 shrink-0 ml-3">
            {/* Group picker */}
            <div className="relative" ref={groupRef}>
              <button
                onClick={handleGroupPicker}
                className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded transition-colors ${
                  account.groupName
                    ? 'hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'
                }`}
                title={account.groupName || 'Assign group'}
              >
                {account.groupName ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: account.groupColor || '#6b7280' }} />
                    <span className="max-w-[60px] truncate">{account.groupName}</span>
                  </>
                ) : (
                  <Folder size={10} />
                )}
              </button>

              {showGroupPicker && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-bg-secondary border border-gray-700 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                  {account.groupId && (
                    <button onClick={() => handleAssignGroup(null)} className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                      ✕ Remove group
                    </button>
                  )}
                  {groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleAssignGroup(g.id)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                        account.groupId === g.id ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="truncate">{g.name}</span>
                      {account.groupId === g.id && <span className="ml-auto text-accent-blue">✓</span>}
                    </button>
                  ))}
                  {groups.length === 0 && <p className="px-3 py-2 text-[11px] text-gray-500">No groups yet</p>}
                </div>
              )}
            </div>
            <span>#{account.accountNumber}</span>
          </div>
        </div>

        {/* ── Main row: Balance+Equity | Today+P/L+Lots | Actions ── */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">

          {/* Left: Balance + Equity */}
          <div className="flex gap-5 shrink-0">
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">
                Balance <span className="text-accent-blue font-medium">{cur}</span>
              </div>
              <div className="font-mono text-sm text-white font-medium">{fmtNum(account.balance)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Equity</div>
              <div className="font-mono text-sm font-medium">
                <FlashNumber value={account.equity} format={fmtNum} positiveGreen={false} className="text-white" />
              </div>
            </div>
          </div>

          {/* Center: Today + P/L (prominent) + Lots below */}
          <div className="flex-1 flex justify-center min-w-[200px]">
            <div>
              {/* Today + P/L on same row */}
              <div className="flex items-baseline gap-5">
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5">Today</div>
                  <div className={`font-mono text-sm font-semibold ${
                    todayPnl > 0 ? 'text-success' : todayPnl < 0 ? 'text-danger' : 'text-gray-400'
                  }`}>
                    {todayPnl >= 0 ? '+' : '-'}{fmtNum(todayPnl)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5">P/L</div>
                  <FlashNumber
                    value={account.profit}
                    format={(v) => `${v >= 0 ? '+' : '-'}${fmtNum(Math.abs(v))}`}
                    positiveGreen
                    className="font-mono text-xl font-bold"
                  />
                </div>
              </div>
              {/* Lots — below P/L */}
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <span className="text-gray-500 font-mono">{orderCount} open</span>
                <span className="text-gray-700">|</span>
                <span className="text-success font-mono">B:{formatLots(account.buyLots)}</span>
                <span className="text-gray-700">/</span>
                <span className="text-danger font-mono">S:{formatLots(account.sellLots)}</span>
              </div>
            </div>
          </div>

          {/* Right: Shield + Trade buttons */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={() => setShowProtection(true)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                account.protectionEnabled
                  ? 'text-warning bg-warning/10 hover:bg-warning/20'
                  : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'
              }`}
              title="Drawdown Protection"
            >
              <Shield size={12} />
              {account.protectionEnabled && <span className="text-[10px]">ON</span>}
            </button>

            {isRealAccount && isOnline && (
              <>
                <button
                  onClick={() => setShowPositions(p => !p)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                    showPositions
                      ? 'border-accent-blue text-accent-blue bg-accent-blue/10'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                  }`}
                  title="Manage Positions"
                >
                  <LayoutList size={12} />
                  {showPositions ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
                <button
                  onClick={() => setShowNewTrade(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-success/50 text-success hover:bg-success hover:text-white hover:border-success transition-all duration-150"
                  title="Open New Trade"
                >
                  <PlusCircle size={12} />
                  NEW
                </button>
              </>
            )}

            <button
              onClick={() => isOnline && setShowCloseAll(true)}
              disabled={!isOnline}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                isOnline
                  ? 'border-danger/50 text-danger hover:bg-danger hover:text-white hover:border-danger cursor-pointer'
                  : 'border-gray-700 text-gray-600 cursor-not-allowed'
              }`}
              title="Close All Positions"
            >
              <XCircle size={12} />
            </button>
          </div>
        </div>

        {/* Broker */}
        <div className="mt-2 text-[10px] text-gray-600 truncate">{account.broker}</div>
      </div>

      {/* Position Panel — inline expandable */}
      {showPositions && (
        <div className="border border-gray-800 rounded-xl mt-2 bg-bg-primary overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
              <LayoutList size={12} className="text-accent-blue" />
              Open Positions — {account.name}
              <span className="text-gray-600 font-mono">({ordersArray.length})</span>
            </span>
            <button
              onClick={() => setShowPositions(false)}
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              <ChevronUp size={14} />
            </button>
          </div>
          <PositionPanel
            accountId={account.id}
            accountName={account.name}
            orders={ordersArray}
            currency={account.currency}
          />
        </div>
      )}

      {showCloseAll && (
        <CloseAllDialog accountId={account.id} accountName={account.name} onClose={() => setShowCloseAll(false)} onSuccess={onSuccess} />
      )}
      {showProtection && (
        <ProtectionSettings accountId={account.id} accountName={account.name} onClose={() => setShowProtection(false)} />
      )}
      {showNewTrade && (
        <NewTradeDialog
          accountId={account.id}
          accountName={account.name}
          currency={account.currency}
          onClose={() => setShowNewTrade(false)}
        />
      )}
    </>
  );
};
