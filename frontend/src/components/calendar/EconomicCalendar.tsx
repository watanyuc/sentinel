import { useEffect, useRef, useState } from 'react';
import { CalendarDays, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

// ─── TradingView Widget config ────────────────────────────────────────────────
// colorTheme:"dark" matches SENTINEL's dark UI
const TV_CONFIG = {
  height: 660,
  colorTheme: 'dark',
  isTransparent: false,
  locale: 'en',
  importanceFilter: '-1,0,1',        // low, medium, high
  countryFilter: 'us,eu,gb,jp,au,nz,ca,ch,cn',  // USD EUR GBP JPY AUD NZD CAD CHF CNY
};

const SCRIPT_URL = 'https://s3.tradingview.com/external-embedding/embed-widget-economic-calendar.js';

// ─── Component ────────────────────────────────────────────────────────────────
export const EconomicCalendar = () => {
  const outerRef                      = useRef<HTMLDivElement>(null);
  const [status,    setStatus]        = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey]     = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    // ── Clean up previous widget ─────────────────────────────────────────────
    outer.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;
    setStatus('loading');

    // ── Inject TradingView script ─────────────────────────────────────────────
    // TradingView's script reads its own textContent as JSON config
    const script = document.createElement('script');
    script.type    = 'text/javascript';
    script.src     = SCRIPT_URL;
    script.async   = true;
    // Config is placed as textContent — TradingView reads via document.currentScript
    script.textContent = JSON.stringify(TV_CONFIG);
    script.onload  = () => setStatus('ready');
    script.onerror = () => setStatus('error');

    outer.appendChild(script);

    return () => {
      if (outer) outer.innerHTML = '';
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
            TradingView
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

      {/* ── Loading ── */}
      {status === 'loading' && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <div className="text-center">
            <Loader2 size={28} className="mx-auto mb-3 animate-spin text-accent-blue" />
            <p className="text-sm">Loading TradingView calendar...</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle size={32} className="text-danger mx-auto mb-3" />
            <p className="text-sm text-danger mb-2">Failed to load calendar widget</p>
            <p className="text-xs text-gray-500 mb-4">
              Check network connection or try refreshing
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

      {/* ── TradingView Widget container ── */}
      <div
        ref={outerRef}
        className="tradingview-widget-container w-full rounded-xl overflow-hidden"
      >
        {/* Script + widget div injected via useEffect */}
      </div>
    </div>
  );
};
