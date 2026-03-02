import { useState, useEffect, useRef } from 'react';
import type { Account, AccountGroup } from '../../types';
import { formatCurrency, formatLots, formatPercent, getDrawdownColor } from '../../utils/formatters';
import { FlashNumber } from '../ui/FlashNumber';
import { CloseAllDialog } from './CloseAllDialog';
import { ProtectionSettings } from '../settings/ProtectionSettings';
import { Wifi, WifiOff, XCircle, Shield, Folder } from 'lucide-react';
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
  const rawCur = account.currency || 'USD';
  // Display USDC as "USC" for readability
  const cur = rawCur.toUpperCase() === 'USDC' ? 'USC' : rawCur;
  const fmt = (v: number) => formatCurrency(v, rawCur);
  // Number-only formatter (no currency prefix) for aligned columns
  const fmtNum = (v: number) => {
    const abs = Math.abs(v);
    return abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['overview'] });
    queryClient.invalidateQueries({ queryKey: ['heatmap-orders'] });
  };

  return (
    <>
      <div className={`card transition-all duration-300 ${!isOnline ? 'opacity-60' : ''}`}>
        {/* Row 1: Name + Financial Data + P/L */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* Name & Status */}
          <div className="flex items-center gap-2 min-w-[180px]">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-success animate-pulse' : 'bg-gray-600'}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white truncate">{account.name}</h3>
                {isOnline
                  ? <Wifi size={12} className="text-success shrink-0" />
                  : <WifiOff size={12} className="text-gray-500 shrink-0" />
                }
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
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
                    <div className="absolute left-0 top-full mt-1 w-40 bg-bg-secondary border border-gray-700 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
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
                <span className="text-gray-600">•</span>
                <span className="truncate">{account.broker} • #{account.accountNumber}</span>
              </div>
            </div>
          </div>

          {/* Financial Data — inline (no Margin / Free Margin) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 flex-1">
            <div className="min-w-[90px]">
              <div className="text-[10px] text-gray-500">Balance <span className="text-accent-blue font-medium">{cur}</span></div>
              <div className="font-mono text-sm text-white font-medium">{fmtNum(account.balance)}</div>
            </div>
            <div className="min-w-[90px]">
              <div className="text-[10px] text-gray-500">Equity</div>
              <div className="font-mono text-sm font-medium">
                <FlashNumber value={account.equity} format={fmtNum} positiveGreen={false} className="text-white" />
              </div>
            </div>
            <div className="min-w-[70px]">
              <div className="text-[10px] text-gray-500">Drawdown</div>
              <span className={`font-mono text-sm font-medium ${getDrawdownColor(account.drawdown)}`}>
                {formatPercent(account.drawdown)}
              </span>
            </div>
            <div className="min-w-[80px]">
              <div className="text-[10px] text-gray-500">Orders</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-gray-300">{orderCount} open</span>
                <span className="text-gray-600">|</span>
                <span className="text-[10px] text-gray-500">Lot</span>
                <span className="text-success font-mono">B:{formatLots(account.buyLots)}</span>
                <span className="text-gray-600">/</span>
                <span className="text-danger font-mono">S:{formatLots(account.sellLots)}</span>
              </div>
            </div>
          </div>

          {/* Today + P/L — prominent, right side */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-gray-500">Today</div>
              <div className={`font-mono text-sm font-semibold ${todayPnl > 0 ? 'text-success' : todayPnl < 0 ? 'text-danger' : 'text-gray-400'}`}>
                {todayPnl >= 0 ? '+' : '-'}{fmtNum(todayPnl)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500">P/L</div>
              <FlashNumber
                value={account.profit}
                format={(v) => `${v >= 0 ? '+' : '-'}${fmtNum(v)}`}
                positiveGreen
                className="font-mono text-lg font-bold"
              />
            </div>
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
            <button
              onClick={() => isOnline && setShowCloseAll(true)}
              disabled={!isOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                isOnline
                  ? 'border-danger/50 text-danger hover:bg-danger hover:text-white hover:border-danger cursor-pointer'
                  : 'border-gray-700 text-gray-600 cursor-not-allowed'
              }`}
            >
              <XCircle size={12} />
              CLOSE ALL
            </button>
          </div>
        </div>
      </div>

      {showCloseAll && (
        <CloseAllDialog accountId={account.id} accountName={account.name} onClose={() => setShowCloseAll(false)} onSuccess={onSuccess} />
      )}
      {showProtection && (
        <ProtectionSettings accountId={account.id} accountName={account.name} onClose={() => setShowProtection(false)} />
      )}
    </>
  );
};
