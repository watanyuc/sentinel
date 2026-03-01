import { useState, useEffect, useRef } from 'react';
import type { Account, AccountGroup } from '../../types';
import { formatCurrency, formatLots, formatPercent, getDrawdownColor, getMarginLevelColor, getProfitColor } from '../../utils/formatters';
import { FlashNumber } from '../ui/FlashNumber';
import { CloseAllDialog } from './CloseAllDialog';
import { ProtectionSettings } from '../settings/ProtectionSettings';
import { Wifi, WifiOff, XCircle, Shield, Folder } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../stores/uiStore';
import { fetchGroups, assignAccountGroup } from '../../services/api';

interface Props {
  account: Account;
}

export const BotCard = ({ account }: Props) => {
  const [showCloseAll, setShowCloseAll] = useState(false);
  const [showProtection, setShowProtection] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const groupRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  // Close dropdown when clicking outside
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

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['overview'] });
    queryClient.invalidateQueries({ queryKey: ['heatmap-orders'] });
  };

  return (
    <>
      <div
        className={`card transition-all duration-300 ${!isOnline ? 'opacity-60' : ''}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-success animate-pulse' : 'bg-gray-600'}`} />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{account.name}</h3>
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
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: account.groupColor || '#6b7280' }}
                        />
                        <span className="max-w-[60px] truncate">{account.groupName}</span>
                      </>
                    ) : (
                      <Folder size={10} />
                    )}
                  </button>

                  {/* Dropdown */}
                  {showGroupPicker && (
                    <div className="absolute left-0 top-full mt-1 w-40 bg-bg-secondary border border-gray-700 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                      {/* Remove from group */}
                      {account.groupId && (
                        <button
                          onClick={() => handleAssignGroup(null)}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          ✕ Remove group
                        </button>
                      )}
                      {groups.map(g => (
                        <button
                          key={g.id}
                          onClick={() => handleAssignGroup(g.id)}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                            account.groupId === g.id
                              ? 'text-white bg-gray-700'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                          <span className="truncate">{g.name}</span>
                          {account.groupId === g.id && <span className="ml-auto text-accent-blue">✓</span>}
                        </button>
                      ))}
                      {groups.length === 0 && (
                        <p className="px-3 py-2 text-[11px] text-gray-500">No groups yet</p>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-gray-600">•</span>
                <span className="truncate">{account.broker} • #{account.accountNumber}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isOnline
              ? <Wifi size={12} className="text-success" />
              : <WifiOff size={12} className="text-gray-500" />
            }
            <span className={`text-[11px] font-medium ${isOnline ? 'text-success' : 'text-gray-500'}`}>
              {account.status}
            </span>
          </div>
        </div>

        {/* Financial grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">Balance</div>
            <div className="font-mono text-sm text-white font-medium">{formatCurrency(account.balance)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">Equity</div>
            <div className="font-mono text-sm font-medium">
              <FlashNumber
                value={account.equity}
                format={formatCurrency}
                positiveGreen={false}
                className="text-white"
              />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">Margin</div>
            <div className="font-mono text-xs text-gray-300">{formatCurrency(account.margin)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">Free Margin</div>
            <div className="font-mono text-xs text-gray-300">{formatCurrency(account.freeMargin)}</div>
          </div>
        </div>

        {/* Margin Level + Drawdown bars */}
        <div className="space-y-2 mb-3">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-500">Margin Level</span>
              <span className={`font-mono font-medium ${getMarginLevelColor(account.marginLevel)}`}>
                <FlashNumber
                  value={account.marginLevel}
                  format={(v) => `${v.toFixed(1)}%`}
                />
              </span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  account.marginLevel > 500 ? 'bg-success' :
                  account.marginLevel > 200 ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${Math.min(100, account.marginLevel / 20)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-500">Drawdown</span>
              <span className={`font-mono font-medium ${getDrawdownColor(account.drawdown)}`}>
                {formatPercent(account.drawdown)}
              </span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  account.drawdown < 10 ? 'bg-success' :
                  account.drawdown < 30 ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${Math.min(100, account.drawdown)}%` }}
              />
            </div>
          </div>
        </div>

        {/* P/L + Lots row */}
        <div className="flex items-center justify-between text-xs mb-3 pb-3 border-b border-gray-800">
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">P/L</div>
            <FlashNumber
              value={account.profit}
              format={(v) => `${v >= 0 ? '+' : ''}${formatCurrency(v)}`}
              positiveGreen
              className="font-mono text-sm font-semibold"
            />
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 mb-0.5">Open / Pending</div>
            <span className="font-mono text-gray-300">
              {formatLots(account.openLots)} lots • {typeof account.pending === 'number' ? account.pending : account.pending.length}p
            </span>
          </div>
        </div>

        {/* Buy/Sell lots */}
        <div className="flex items-center gap-2 text-xs mb-3">
          <span className="text-success font-mono">B: {formatLots(account.buyLots)}</span>
          <span className="text-gray-600">|</span>
          <span className="text-danger font-mono">S: {formatLots(account.sellLots)}</span>
          <span className="text-gray-600 ml-auto">{orderCount} orders open</span>
        </div>

        {/* Server info + Protection */}
        <div className="flex items-center justify-between text-[10px] text-gray-600 mb-3">
          <span>{account.server} • {account.currency} • 1:{account.leverage}</span>
          <button
            onClick={() => setShowProtection(true)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
              account.protectionEnabled
                ? 'text-warning bg-warning/10 hover:bg-warning/20'
                : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'
            }`}
            title="Drawdown Protection"
          >
            <Shield size={10} />
            {account.protectionEnabled && <span className="text-[9px]">ON</span>}
          </button>
        </div>

        {/* CLOSE ALL button */}
        <button
          onClick={() => isOnline && setShowCloseAll(true)}
          disabled={!isOnline}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border ${
            isOnline
              ? 'border-danger/50 text-danger hover:bg-danger hover:text-white hover:border-danger cursor-pointer'
              : 'border-gray-700 text-gray-600 cursor-not-allowed'
          }`}
        >
          <XCircle size={13} />
          CLOSE ALL
        </button>
      </div>

      {showCloseAll && (
        <CloseAllDialog
          accountId={account.id}
          accountName={account.name}
          onClose={() => setShowCloseAll(false)}
          onSuccess={onSuccess}
        />
      )}

      {showProtection && (
        <ProtectionSettings
          accountId={account.id}
          accountName={account.name}
          onClose={() => setShowProtection(false)}
        />
      )}
    </>
  );
};
