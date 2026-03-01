# 03 — TradingView Chart (XAUUSD)

## 📊 กราฟแสดงราคาทอง XAUUSD

ใช้ TradingView Embedded Widget แสดงกราฟราคาทองแบบ real-time

### Layout

```
┌──────────────────────────────────────────────────────┐
│  📊 XAUUSD — Gold Spot / U.S. Dollar                │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │          TradingView Advanced Chart            │  │
│  │               (Embedded Widget)                │  │
│  │                                                │  │
│  │  Height: 500px (desktop) / 350px (mobile)      │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Widget Configuration

```html
<!-- TradingView Widget BEGIN -->
<div class="tradingview-widget-container" style="height:500px;width:100%">
  <div id="tradingview_chart" style="height:100%;width:100%"></div>
</div>

<script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
<script type="text/javascript">
  new TradingView.widget({
    "autosize": true,
    "symbol": "OANDA:XAUUSD",
    "interval": "15",
    "timezone": "Asia/Bangkok",
    "theme": "dark",
    "style": "1",
    "locale": "th_TH",
    "toolbar_bg": "#1a1a2e",
    "enable_publishing": false,
    "hide_side_toolbar": false,
    "allow_symbol_change": false,
    "watchlist": ["OANDA:XAUUSD"],
    "details": true,
    "hotlist": false,
    "calendar": false,
    "studies": [
      "MASimple@tv-basicstudies",
      "RSI@tv-basicstudies",
      "Volume@tv-basicstudies"
    ],
    "container_id": "tradingview_chart",
    "show_popup_button": true,
    "popup_width": "1000",
    "popup_height": "650"
  });
</script>
<!-- TradingView Widget END -->
```

### Widget Parameters

| Parameter | Value | Description |
|-----------|-------|------------|
| `symbol` | `"OANDA:XAUUSD"` | ราคาทอง XAU/USD |
| `interval` | `"15"` | Default timeframe 15 นาที |
| `timezone` | `"Asia/Bangkok"` | แสดงเวลาไทย |
| `theme` | `"dark"` | ธีมมืด เข้ากับ dashboard |
| `style` | `"1"` | Candlestick chart |
| `locale` | `"th_TH"` | ภาษาไทย |
| `allow_symbol_change` | `false` | ล็อคที่ XAUUSD เท่านั้น |
| `enable_publishing` | `false` | ปิดการ publish ideas |
| `studies` | MA, RSI, Volume | Indicators เริ่มต้น |
| `show_popup_button` | `true` | ปุ่มเปิดกราฟในหน้าต่างใหม่ |

### Alternative: TradingView Advanced Real-Time Chart Widget

```html
<!-- Alternative: Simpler embed using iframe -->
<iframe
  src="https://www.tradingview.com/widgetembed/?
    frameElementId=tradingview_chart&
    symbol=OANDA:XAUUSD&
    interval=15&
    theme=dark&
    style=1&
    timezone=Asia/Bangkok&
    locale=th_TH"
  style="width: 100%; height: 500px; border: none;"
  allowtransparency="true"
  frameborder="0"
></iframe>
```

### Responsive Behavior

| Breakpoint | Height | Toolbar |
|-----------|--------|---------|
| Desktop (≥1024px) | 500px | Full toolbar + side toolbar |
| Tablet (768-1023px) | 400px | Full toolbar, hide side toolbar |
| Mobile (<768px) | 300px | Compact toolbar, hide side toolbar |

### React Component Example

```tsx
import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  height?: number;
}

export function TradingViewChart({ 
  symbol = 'OANDA:XAUUSD', 
  theme = 'dark',
  height = 500 
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof TradingView !== 'undefined') {
        new TradingView.widget({
          autosize: true,
          symbol,
          interval: '15',
          timezone: 'Asia/Bangkok',
          theme,
          style: '1',
          locale: 'th_TH',
          toolbar_bg: '#1a1a2e',
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: 'tradingview_chart',
          show_popup_button: true,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [symbol, theme]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-700">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">
          📊 XAUUSD — Gold Spot / U.S. Dollar
        </h3>
      </div>
      <div ref={containerRef} style={{ height }}>
        <div id="tradingview_chart" style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}
```

### Notes

- TradingView widget โหลดจาก CDN ของ TradingView โดยตรง
- ไม่ต้องมี API key สำหรับ widget แบบ embed
- Widget จะ auto-update ราคาแบบ real-time
- สามารถเพิ่ม indicators ได้จาก UI ของ widget เอง
- ควร lazy load widget เพื่อไม่ให้กระทบ page load time
