import { useClock } from '../../hooks/useClock';
import { Clock } from 'lucide-react';

const SESSION_COLORS: Record<string, string> = {
  'Sydney': 'text-blue-400',
  'Tokyo': 'text-purple-400',
  'London': 'text-yellow-400',
  'New York': 'text-green-400',
  'Market Closed': 'text-gray-500',
};

const getSessionColor = (session: string): string => {
  for (const [key, cls] of Object.entries(SESSION_COLORS)) {
    if (session.includes(key)) return cls;
  }
  return 'text-gray-400';
};

export const DualClock = () => {
  const { thai, ny, session } = useClock();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-accent-blue shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Bangkok</span>
          <span className="font-mono text-xs text-gray-200 whitespace-nowrap">{thai}</span>
        </div>
      </div>

      <div className="hidden sm:block h-8 w-px bg-gray-700" />

      <div className="flex items-center gap-2">
        <Clock size={14} className="text-accent-purple shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">New York</span>
          <span className="font-mono text-xs text-gray-200 whitespace-nowrap">{ny}</span>
        </div>
      </div>

      <div className="hidden sm:block h-8 w-px bg-gray-700" />

      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${getSessionColor(session)}`}>
          ● {session}
        </span>
      </div>
    </div>
  );
};
