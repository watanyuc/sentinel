import type { OverviewStats } from '../../types';
import { formatCurrency, formatPercent, formatLots } from '../../utils/formatters';
import { FlashNumber } from '../ui/FlashNumber';
import { Users, Wifi, WifiOff, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface CardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  valueColor?: string;
  isFlash?: boolean;
  flashValue?: number;
}

const StatCard = ({ label, value, sub, icon, valueColor = 'text-white', isFlash, flashValue }: CardProps) => (
  <div className="card flex flex-col gap-2 min-w-0">
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400 font-medium truncate">{label}</span>
      {icon && <div className="text-gray-600 shrink-0">{icon}</div>}
    </div>
    <div className={`text-xl font-bold font-mono ${valueColor} truncate`}>
      {isFlash && flashValue !== undefined
        ? <FlashNumber value={flashValue} format={() => String(value)} positiveGreen={flashValue > 0} />
        : value
      }
    </div>
    {sub && <span className="text-xs text-gray-500">{sub}</span>}
  </div>
);

interface Props {
  stats: OverviewStats;
}

export const SummaryCards = ({ stats }: Props) => {
  const equityChange = ((stats.totalEquity - stats.totalBalance) / Math.max(stats.totalBalance, 1)) * 100;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
      <StatCard
        label="Total Accounts"
        value={stats.totalAccounts}
        icon={<Users size={16} />}
        sub={`${stats.onlineAccounts} online`}
      />
      <StatCard
        label="Online"
        value={stats.onlineAccounts}
        icon={<Wifi size={16} className="text-success" />}
        valueColor="text-success"
      />
      <StatCard
        label="Offline"
        value={stats.offlineAccounts}
        icon={<WifiOff size={16} className="text-gray-500" />}
        valueColor="text-gray-400"
      />
      <StatCard
        label="Total Balance"
        value={formatCurrency(stats.totalBalance)}
        icon={<DollarSign size={16} />}
        sub="USD"
      />
      <StatCard
        label="Total Equity"
        value={formatCurrency(stats.totalEquity)}
        icon={<Activity size={16} />}
        valueColor={equityChange >= 0 ? 'text-success' : 'text-danger'}
        sub={`${equityChange >= 0 ? '+' : ''}${formatPercent(equityChange)} vs balance`}
        isFlash
        flashValue={stats.totalEquity}
      />
      <StatCard
        label="Total P/L"
        value={formatCurrency(stats.totalProfit)}
        icon={stats.totalProfit >= 0 ? <TrendingUp size={16} className="text-success" /> : <TrendingDown size={16} className="text-danger" />}
        valueColor={stats.totalProfit >= 0 ? 'text-success' : 'text-danger'}
        isFlash
        flashValue={stats.totalProfit}
      />
      <StatCard
        label="Open Lots"
        value={formatLots(stats.totalOpenLots)}
        sub={`B:${formatLots(stats.totalBuyLots)} / S:${formatLots(stats.totalSellLots)}`}
      />
      <StatCard
        label="Pending Orders"
        value={stats.totalPendingOrders}
        sub="total pending"
      />
    </div>
  );
};
