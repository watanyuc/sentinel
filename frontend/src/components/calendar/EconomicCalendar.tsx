import { useEffect, useState } from 'react';
import { CalendarDays, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

// ─── MQL5 Widget global type ──────────────────────────────────────────────────
declare global {
  interface Window {
    MQL5?: {
      Widget?: {
        EconomicCalendar: new (config: {
          width: string | number;
          height: number;
          timeZone: number;
          currencies: string[];
          importance: number[];
          period: string;
        }) => void;
      };
    };
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SCRIPT_ID  = 'mql5EcoCalScript';
const WIDGET_URL = 'https://www.mql5.com/en/investing-economic-calendar/widget/script/v1/widget.js';

const WIDGET_CONFIG: {
  width: string | number;
  height: number;
  timeZone: number;
  currencies: string[];
  importance: number[];
  period: string;
} = {
  width: 'auto',
  height: 680,
  timeZone: 7,   // UTC+7 (Thailand)
  currencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'CNY'],
  importance: [3, 2, 1],
  period: 'today',
};

// ─── Component ────────────────────────────────────────────────────────────────
export const EconomicCalendar = () => {
  const [status,    setStatus]    = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // ── Cleanup previous instance ────────────────────────────────────────────
    const oldScript = document.getElementById(SCRIPT_ID);
    if (oldScript) oldScript.remove();

    const container = document.getElementById('economicCalendarWidget_container');
    if (container) container.innerHTML = '';

    setStatus('loading');

    // ── Poll until MQL5 global is available, then init ──────────────────────
    const tryInit = (attempts = 0) => {
      if (cancelled) return;

      if (window.MQL5?.Widget?.EconomicCalendar) {
        try {
          new window.MQL5.Widget.EconomicCalendar(WIDGET_CONFIG);
          if (!cancelled) setStatus('ready');
        } catch (err) {
          console.error('[MQL5 Calendar] init error:', err);
          if (!cancelled) setStatus('error');
        }
        return;
      }

      if (attempts < 40) {
        setTimeout(() => tryInit(attempts + 1), 250); // up to 10 seconds
      } else {
        if (!cancelled) setStatus('error');
      }
    };

    // ── Load widget script ───────────────────────────────────────────────────
    const script = document.createElement('script');
    script.id    = SCRIPT_ID;
    script.src   = WIDGET_URL;
    script.async = true;
    script.onload  = () => tryInit();
    script.onerror = () => { if (!cancelled) setStatus('error'); };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      const s = document.getElementById(SCRIPT_ID);
      if (s) s.remove();
    };
  }, [reloadKey]);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-accent-blue" />
          <h2 className="text-lg font-semibold text-white">Economic Calendar</h2>
          <span className="text-[10px] text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
            MQL5
          </span>
        </div>
        <button
          onClick={() => setReloadKey(k => k + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors"
          title="Reload widget"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* ── Loading state ── */}
      {status === 'loading' && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <div className="text-center">
            <Loader2 size={28} className="mx-auto mb-3 animate-spin text-accent-blue" />
            <p className="text-sm">Loading MQL5 calendar...</p>
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {status === 'error' && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle size={32} className="text-danger mx-auto mb-3" />
            <p className="text-sm text-danger mb-2">Failed to load MQL5 calendar widget</p>
            <p className="text-xs text-gray-500 mb-4">
              Check your network connection or try refreshing
            </p>
            <button
              onClick={() => setReloadKey(k => k + 1)}
              className="px-4 py-2 rounded-lg bg-accent-blue hover:bg-blue-600 text-white text-xs font-medium transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* ── MQL5 Widget container — always in DOM so widget can render into it ── */}
      <div
        id="economicCalendarWidget"
        className="economicCalendarWidget w-full rounded-xl overflow-hidden"
      >
        <div
          id="economicCalendarWidget_container"
          className="economicCalendarWidget_container"
        />
      </div>
    </div>
  );
};
