# 05 — ภาพรวมสถานะบัญชี (Account Overview Tabs)

## 📊 4 TABs Overview

```
┌──────────────────────────────────────────────────────────┐
│  ภาพรวมสถานะบัญชี                                         │
│                                                          │
│  ┌──────────┬──────────────┬──────────────┬────────────┐ │
│  │ Overview │ Heatmap บัญชี │ Heatmap ออเดอร์│ Heatmap   │ │
│  │ (active) │              │              │ Pending    │ │
│  └──────────┴──────────────┴──────────────┴────────────┘ │
│                                                          │
│  ┌─ Tab Content Area ──────────────────────────────────┐ │
│  │                                                     │ │
│  │              (content per tab below)                 │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## TAB 1: Overview

### Summary Cards (แถวบน)

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ บัญชีทั้งหมด │  │ 🟢 ออนไลน์ │  │ 🔴 ออฟไลน์ │
│    5     │  │    3     │  │    2     │
└──────────┘  └──────────┘  └──────────┘
```

### Financial Summary Cards (แถวกลาง)

```
┌─────────────────────────┐  ┌─────────────────────────┐
│  💰 ยอดคงเหลือ (Balance)  │  │  📊 Equity               │
│  $25,430.50              │  │  $24,890.75              │
│  ▲ +2.5% (+$621.50)     │  │  ▼ -1.2% (-$302.10)     │
└─────────────────────────┘  └─────────────────────────┘
```

### Order Summary Cards (แถวล่าง)

```
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ 💵 Profit   │  │ 🟢 Buy      │  │ 🔴 Sell     │  │ ⏳ Pending  │
│  +$1,250   │  │    12      │  │    8       │  │    5       │
│            │  │ 5.2 lots   │  │ 3.8 lots   │  │ 2.0 lots   │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
```

### Overview Data Fields

| Field | Description | Format | Calculation |
|-------|------------|--------|-------------|
| บัญชีทั้งหมด | จำนวนบัญชี MT5 ที่เชื่อมต่อ | Integer | `count(accounts)` |
| ออนไลน์ | บัญชีที่ online | Integer + สีเขียว | `count(accounts.where(online))` |
| ออฟไลน์ | บัญชีที่ offline | Integer + สีแดง | `count(accounts.where(offline))` |
| ยอดคงเหลือ | รวม Balance ทุกบัญชี | `$XX,XXX.XX` | `sum(accounts.balance)` |
| Balance Change % | เปลี่ยนแปลง (เทียบวันก่อน) | `±X.X%` | `(today - yesterday) / yesterday * 100` |
| Balance Change $ | เปลี่ยนแปลงเป็นเงิน | `±$X,XXX.XX` | `today - yesterday` |
| Equity | รวม Equity ทุกบัญชี | `$XX,XXX.XX` | `sum(accounts.equity)` |
| Equity Change % | เปลี่ยนแปลง (เทียบวันก่อน) | `±X.X%` | เหมือน Balance |
| Equity Change $ | เปลี่ยนแปลงเป็นเงิน | `±$X,XXX.XX` | เหมือน Balance |
| Profit | รวมกำไร/ขาดทุนปัจจุบัน | `±$X,XXX.XX` | `sum(accounts.profit)` |
| Buy | จำนวน Buy orders ที่เปิดอยู่ | Integer + total lots | `count + sum(lots)` |
| Sell | จำนวน Sell orders ที่เปิดอยู่ | Integer + total lots | `count + sum(lots)` |
| Pending | จำนวน Pending orders | Integer + total lots | `count + sum(lots)` |

### Color Coding for Changes

| Condition | สี | Icon |
|-----------|-----|------|
| Positive change | `#10B981` (green) | ▲ |
| Negative change | `#EF4444` (red) | ▼ |
| No change | `#6B7280` (gray) | — |

### Data Model

```typescript
interface AccountOverview {
  totalAccounts: number;
  onlineCount: number;
  offlineCount: number;
  
  totalBalance: number;
  balanceChangePercent: number;    // ±%
  balanceChangeAmount: number;     // ±$
  
  totalEquity: number;
  equityChangePercent: number;     // ±%
  equityChangeAmount: number;      // ±$
  
  totalProfit: number;
  
  buyOrders: {
    count: number;
    totalLots: number;
  };
  sellOrders: {
    count: number;
    totalLots: number;
  };
  pendingOrders: {
    count: number;
    totalLots: number;
  };
}
```

### Real-time Updates

- ข้อมูลทั้งหมดอัปเดตผ่าน WebSocket
- Update frequency: ทุก 1-3 วินาที
- แสดง animation เมื่อค่าเปลี่ยน (number transition)
- Flash สีเขียว/แดง เมื่อค่าเปลี่ยนแปลง

### Responsive Layout

| Breakpoint | Cards per row |
|-----------|--------------|
| Desktop (≥1280px) | 4 cards |
| Large Tablet (1024-1279px) | 3 cards |
| Tablet (768-1023px) | 2 cards |
| Mobile (<768px) | 1 card (stacked) |
