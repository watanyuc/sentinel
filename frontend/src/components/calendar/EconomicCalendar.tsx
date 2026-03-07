import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EconomicEvent } from '../../types';
import { fetchEconomicCalendar } from '../../services/api';
import { RefreshCw, AlertCircle, CalendarDays } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  NZD: '🇳🇿',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  CNY: '🇨🇳',
  CNH: '🇨🇳',
};

const IMPACT_CFG = {
  High:           { label: 'High', cls: 'bg-danger/20 text-danger border-danger/30',     dot: 'bg-danger' },
  Medium:         { label: 'Med',  cls: 'bg-warning/20 text-warning border-warning/30', dot: 'bg-warning' },
  Low:            { label: 'Low',  cls: 'bg-gray-700 text-gray-400 border-gray-600',    dot: 'bg-gray-500' },
  'Non-Economic': { label: 'N/E',  cls: 'bg-gray-800 text-gray-600 border-gray-700',    dot: 'bg-gray-700' },
} as const;

const ALL_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'CNY'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

const fmtDateLabel = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const impactCfg = (impact: string) =>
  IMPACT_CFG[impact as keyof typeof IMPACT_CFG] ?? IMPACT_CFG['Low'];

// ─── EventTable ──────────────────────────────────────────────────────────────

interface EventTableProps {
  events: EconomicEvent[];
  now: Date;
}

const EventTable = ({ events, now }: EventTableProps) => (
  <div className="bg-bg-secondary border border-gray-800 rounded-xl overflow-hidden">
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500 border-b border-gray-800 bg-gray-900/40">
          <th className="text-left py-2 px-3 font-medium w-14">Time</th>
          <th className="text-left py-2 px-2 font-medium w-16">Cur</th>
          <th className="text-left py-2 px-2 font-medium">Event</th>
          <th className="text-center py-2 px-2 font-medium w-16">Impact</th>
          <th className="text-right py-2 px-2 font-medium w-16">Actual</th>
          <th className="text-right py-2 px-2 font-medium w-16">Forecast</th>
          <th className="text-right py-2 px-3 font-medium w-16">Previous</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event, i) => {
          const past    = new Date(event.date) < now;
          const cfg     = impactCfg(event.impact);
          const isHigh  = event.impact === 'High';

          return (
            <tr
              key={`${event.date}-${event.title}-${i}`}
              className={`border-b border-gray-800/40 transition-colors
                ${isHigh && !past ? 'hover:bg-danger/5' : 'hover:bg-gray-800/30'}
                ${past ? 'opacity-55' : ''}`}
            >
              {/* Time */}
              <td className="py-2 px-3 font-mono text-gray-300 whitespace-nowrap">
                {fmtTime(event.date)}
              </td>

              {/* Currency */}
              <td className="py-2 px-2">
                <span className="flex items-center gap-1">
                  <span className="text-sm leading-none">
                    {CURRENCY_FLAGS[event.country] ?? '🏳️'}
                  </span>
                  <span className="text-gray-300 font-medium">{event.country}</span>
                </span>
              </td>

              {/* Event title */}
              <td className="py-2 px-2 text-gray-200">
                <span className={isHigh && !past ? 'font-medium text-white' : ''}>
                  {event.title}
                </span>
              </td>

              {/* Impact badge */}
              <td className="py-2 px-2 text-center">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${cfg.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </td>

              {/* Actual */}
              <td className={`py-2 px-2 text-right font-mono ${event.actual ? 'text-white font-semibold' : 'text-gray-600'}`}>
                {event.actual || '—'}
              </td>

              {/* Forecast */}
              <td className="py-2 px-2 text-right font-mono text-gray-400">
                {event.forecast || '—'}
              </td>

              {/* Previous */}
              <td className="py-2 px-3 text-right font-mono text-gray-500">
                {event.previous || '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const EconomicCalendar = () => {
  const { data, isLoading, error, refetch, isFetching } = useQuery<EconomicEvent[]>({
    queryKey: ['economic-calendar'],
    queryFn: fetchEconomicCalendar,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });

  const [viewMode, setViewMode]           = useState<'today' | 'week'>('today');
  const [selectedCurrencies, setSelected] = useState<string[]>([]);
  const [minImpact, setMinImpact]         = useState<'all' | 'medium' | 'high'>('all');

  const now = new Date();

  const filtered = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 86_400_000);

    // Week: Monday–Sunday
    const dow       = now.getDay();
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - (dow === 0 ? 6 : dow - 1));
    const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);

    return data
      .filter(event => {
        const d = new Date(event.date);

        // Date range filter
        if (viewMode === 'today') {
          if (d < todayStart || d >= todayEnd) return false;
        } else {
          if (d < weekStart || d >= weekEnd) return false;
        }

        // Currency filter
        if (selectedCurrencies.length > 0 && !selectedCurrencies.includes(event.country)) return false;

        // Impact filter
        if (minImpact === 'high'   && event.impact !== 'High')   return false;
        if (minImpact === 'medium' && event.impact === 'Low')     return false;
        if (minImpact === 'medium' && event.impact === 'Non-Economic') return false;

        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, viewMode, selectedCurrencies, minImpact]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCurrency = (cur: string) => {
    setSelected(prev =>
      prev.includes(cur) ? prev.filter(c => c !== cur) : [...prev, cur]
    );
  };

  // Count high-impact events today
  const todayHighCount = useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 86_400_000);
    return data.filter(e => {
      const d = new Date(e.date);
      return d >= todayStart && d < todayEnd && e.impact === 'High';
    }).length;
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading economic calendar...</p>
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle size={36} className="text-danger mx-auto mb-3" />
          <p className="text-sm text-danger mb-2">Failed to load calendar data</p>
          <p className="text-xs text-gray-500 mb-4">
            Could not reach ForexFactory. Check network connectivity.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-accent-blue hover:bg-blue-600 text-white text-xs font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ─── Group by date for week view ─────────────────────────────────────────
  const grouped = viewMode === 'week'
    ? filtered.reduce<Record<string, EconomicEvent[]>>((acc, event) => {
        const label = fmtDateLabel(event.date);
        if (!acc[label]) acc[label] = [];
        acc[label].push(event);
        return acc;
      }, {})
    : null;

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-accent-blue" />
            <h2 className="text-lg font-semibold text-white">Economic Calendar</h2>
            {todayHighCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/15 border border-danger/30 text-[10px] font-semibold text-danger">
                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                {todayHighCount} High today
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5 ml-7">
            Source: ForexFactory · Cached 30 min · Times shown in local browser timezone
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-start mb-5 p-3 bg-bg-secondary border border-gray-800 rounded-xl">

        {/* View mode */}
        <div className="flex gap-1.5 bg-gray-900 rounded-lg p-1">
          {(['today', 'week'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-accent-blue text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode === 'today' ? 'Today' : 'This Week'}
            </button>
          ))}
        </div>

        {/* Currency chips */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-[10px] text-gray-500 mr-0.5">Currency:</span>
          {ALL_CURRENCIES.map(cur => (
            <button
              key={cur}
              onClick={() => toggleCurrency(cur)}
              className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                selectedCurrencies.includes(cur)
                  ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              <span className="text-xs leading-none">{CURRENCY_FLAGS[cur] ?? ''}</span>
              <span>{cur}</span>
            </button>
          ))}
          {selectedCurrencies.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="text-[10px] text-gray-500 hover:text-gray-300 underline ml-0.5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Impact filter */}
        <div className="flex gap-1.5 items-center">
          <span className="text-[10px] text-gray-500">Impact:</span>
          {([
            { key: 'all',    label: 'All' },
            { key: 'medium', label: 'Med+' },
            { key: 'high',   label: 'High only' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMinImpact(key)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                minImpact === key
                  ? 'bg-accent-blue text-white'
                  : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="ml-auto text-[10px] text-gray-500 self-center">
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No events match your filters</p>
        </div>
      ) : viewMode === 'today' ? (
        <EventTable events={filtered} now={now} />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped!).map(([dateLabel, events]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-300">{dateLabel}</span>
                <span className="text-[10px] text-gray-600">
                  {events.filter(e => e.impact === 'High').length} high
                </span>
              </div>
              <EventTable events={events} now={now} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
