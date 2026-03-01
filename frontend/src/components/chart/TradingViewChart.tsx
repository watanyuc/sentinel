import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const TradingViewChart = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  const buildWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    // Clear previous widget
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: w,
      height: h,
      symbol: 'OANDA:XAUUSD',
      interval: '15',
      timezone: 'Asia/Bangkok',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#111827',
      enable_publishing: false,
      allow_symbol_change: true,
      save_image: false,
      backgroundColor: '#0a0e1a',
      gridColor: 'rgba(255,255,255,0.04)',
      hide_top_toolbar: false,
      hide_legend: false,
      withdateranges: true,
      support_host: 'https://www.tradingview.com',
    });

    container.appendChild(script);
  }, []);

  useEffect(() => {
    if (collapsed) return;

    // Wait one frame for container layout to compute its pixel size
    const raf = requestAnimationFrame(() => {
      buildWidget();
    });

    return () => {
      cancelAnimationFrame(raf);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [collapsed, buildWidget]);

  return (
    <div className="card p-0 overflow-hidden">
      <div
        className="px-4 py-3 border-b border-gray-800 flex items-center justify-between cursor-pointer select-none hover:bg-gray-800/30 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">XAUUSD</span>
          <span className="text-xs text-gray-400">Gold / US Dollar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">15m • OANDA</span>
          {collapsed
            ? <ChevronDown size={16} className="text-gray-400" />
            : <ChevronUp size={16} className="text-gray-400" />
          }
        </div>
      </div>
      {!collapsed && (
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: 'calc(80vh)', minHeight: '600px' }}
        />
      )}
    </div>
  );
};
