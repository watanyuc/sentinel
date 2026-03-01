# 07 — ภาพรวมบัญชี MT5 ทั้งหมด (Bot Accounts List)

## 📋 Bot Cards Section

ส่วนล่างสุดของ Dashboard แสดงข้อมูลรายละเอียดของบอทแต่ละตัว

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  📋 ภาพรวมบัญชี MT5 ทั้งหมด                                │
│                                                          │
│  ┌─ Filters ───────────────────────────────────────────┐ │
│  │ สถานะ: [ทั้งหมด ▼]  Broker: [ทั้งหมด ▼]  🔍 ค้นหา... │ │
│  │ เรียงตาม: [Balance ▼]  [↑↓]                         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  แสดง 5 จาก 5 บัญชี                                       │
│                                                          │
│  ┌─ Bot Card ──────────────────────────────────────────┐ │
│  │  🟢 Gold Scalper Bot — XM Global                    │ │
│  │  ─────────────────────────────────────────────────  │ │
│  │  ยอดคงเหลือ    Equity       Margin Level  Drawdown  │ │
│  │  $5,000.00    $4,875.50    1,250%       2.5%      │ │
│  │  ─────────────────────────────────────────────────  │ │
│  │  กำไร/ขาดทุน: -$124.50                              │ │
│  │  เปลี่ยนแปลง: ▼ -2.5% (-$124.50)                    │ │
│  │                                                     │ │
│  │                              [🔴 CLOSE ALL]         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ Bot Card ──────────────────────────────────────────┐ │
│  │  🔴 Grid Trader — Exness                            │ │
│  │  ─────────────────────────────────────────────────  │ │
│  │  ยอดคงเหลือ    Equity       Margin Level  Drawdown  │ │
│  │  $10,000.00   $9,200.00    850%         8.0%      │ │
│  │  ─────────────────────────────────────────────────  │ │
│  │  กำไร/ขาดทุน: -$800.00                              │ │
│  │  เปลี่ยนแปลง: ▼ -8.0% (-$800.00)                    │ │
│  │                                                     │ │
│  │                              [🔴 CLOSE ALL]         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ... more cards ...                                      │
└──────────────────────────────────────────────────────────┘
```

---

## 🔍 Filters (ตัวกรอง)

### Filter Options

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| สถานะ | Dropdown | ทั้งหมด, 🟢 ออนไลน์, 🔴 ออฟไลน์ | ทั้งหมด |
| Broker | Dropdown | ทั้งหมด, [dynamic list from accounts] | ทั้งหมด |
| ค้นหา | Text Input | ค้นหาชื่อบอท, เลขบัญชี | — |
| เรียงตาม | Dropdown | Balance, Equity, Drawdown, Profit, ชื่อ | Balance |
| ทิศทาง | Toggle | ↑ น้อยไปมาก / ↓ มากไปน้อย | ↓ มากไปน้อย |

### Filter Behavior
- Filters ทำงานแบบ real-time (ไม่ต้องกดปุ่ม apply)
- แสดงจำนวนผลลัพธ์: "แสดง X จาก Y บัญชี"
- Filters คงอยู่ข้าม page refresh (save to localStorage)

---

## 🤖 Bot Card — รายละเอียด

### Card Header

```
┌─────────────────────────────────────────────┐
│  🟢 Gold Scalper Bot — XM Global            │
│     Status: Online | Account: #12345678     │
└─────────────────────────────────────────────┘
```

| Element | Description | Format |
|---------|------------|--------|
| Status Icon | 🟢 Online / 🔴 Offline | สี indicator |
| Bot Name | ชื่อบอทที่ตั้งไว้ | String |
| Broker Name | ชื่อโบรกเกอร์ | String |
| Account Number | เลขบัญชี MT5 (optional show) | #XXXXXXXX |

### Card Body — ข้อมูลหลัก

| Field | Description | Format | Color Logic |
|-------|------------|--------|-------------|
| ยอดคงเหลือ (Balance) | ยอดเงินในบัญชี | `$XX,XXX.XX` | ขาว/ปกติ |
| Equity | มูลค่าปัจจุบันรวม open positions | `$XX,XXX.XX` | ขาว/ปกติ |
| Margin Level | `(Equity / Margin) * 100` | `X,XXX%` | ดูตารางด้านล่าง |
| Drawdown | `(Balance - Equity) / Balance * 100` | `X.X%` | ดูตารางด้านล่าง |
| กำไร/ขาดทุน (P/L) | Floating profit/loss | `±$X,XXX.XX` | เขียว/แดง |
| เปลี่ยนแปลง % | เทียบกับ balance เริ่มต้น | `±X.X%` | เขียว/แดง |
| เปลี่ยนแปลง $ | จำนวนเงินที่เปลี่ยนแปลง | `±$X,XXX.XX` | เขียว/แดง |

### Margin Level Color Coding

| Range | สี | Status |
|-------|-----|--------|
| > 1000% | 🟢 Green | ปลอดภัย |
| 500-1000% | 🟡 Yellow | ระวัง |
| 200-500% | 🟠 Orange | เตือน |
| < 200% | 🔴 Red | อันตราย (ใกล้ Margin Call) |

### Drawdown Color Coding

| Range | สี | Status |
|-------|-----|--------|
| < 5% | 🟢 Green | ปลอดภัย |
| 5-15% | 🟡 Yellow | ระวัง |
| 15-30% | 🟠 Orange | เตือน |
| > 30% | 🔴 Red | อันตราย |

---

## 🔴 CLOSE ALL Button

### Purpose
ปิด order ของบอทนั้นทั้งหมด (ทุก open positions + pending orders)

### Button Design

```
┌─────────────────────────┐
│  🔴 CLOSE ALL            │
│  (สีแดง, โดดเด่น)         │
└─────────────────────────┘
```

### Behavior

1. **Click** → แสดง Confirmation Dialog

```
┌──────────────────────────────────────────────┐
│  ⚠️ ยืนยันการปิดออเดอร์ทั้งหมด                  │
│                                              │
│  บอท: Gold Scalper Bot (XM Global)           │
│  บัญชี: #12345678                             │
│                                              │
│  จะปิดออเดอร์ทั้งหมด:                           │
│  • Open Orders: 5 (Buy: 3, Sell: 2)         │
│  • Pending Orders: 3                         │
│  • Estimated P/L: -$124.50                   │
│                                              │
│  ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้          │
│                                              │
│  พิมพ์ "CLOSE" เพื่อยืนยัน:                     │
│  ┌──────────────────────────────────┐        │
│  │                                  │        │
│  └──────────────────────────────────┘        │
│                                              │
│           [ยกเลิก]  [🔴 ปิดทั้งหมด]           │
└──────────────────────────────────────────────┘
```

2. **พิมพ์ "CLOSE"** → ปุ่ม "ปิดทั้งหมด" จะ enable
3. **ยืนยัน** → ส่งคำสั่งไปยัง MT5 ผ่าน API
4. **Processing** → แสดง loading spinner + "กำลังปิดออเดอร์..."
5. **สำเร็จ** → Toast: "✅ ปิดออเดอร์ทั้งหมดของ Gold Scalper Bot สำเร็จ"
6. **ล้มเหลว** → Toast: "❌ ไม่สามารถปิดออเดอร์บางรายการได้ กรุณาลองใหม่"

### API Endpoint

```
POST /api/accounts/:accountId/close-all
Headers: { Authorization: Bearer <token> }
Body: { confirmation: "CLOSE" }

Response:
{
  "success": true,
  "closedOrders": 8,
  "failedOrders": 0,
  "totalPL": -124.50,
  "details": [
    { "ticket": 12345, "type": "BUY", "symbol": "XAUUSD", "result": "closed", "pl": -50.00 },
    ...
  ]
}
```

---

## Data Model

```typescript
interface BotAccount {
  id: string;
  botName: string;
  brokerName: string;
  accountNumber: string;
  accountType: 'demo' | 'real';
  isOnline: boolean;
  lastSeen: Date;
  
  // Financial
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;       // percentage
  drawdown: number;          // percentage
  
  // P/L
  profit: number;            // floating P/L
  changePercent: number;     // % change from initial balance
  changeAmount: number;      // $ change
  
  // Orders summary
  openOrders: {
    buyCount: number;
    sellCount: number;
    buyLots: number;
    sellLots: number;
  };
  pendingOrders: {
    count: number;
    totalLots: number;
  };
}
```

### Offline Account Display

บัญชีที่ offline จะแสดงข้อมูลล่าสุดที่มี พร้อม label:

```
┌─────────────────────────────────────────────┐
│  🔴 Grid Trader — Exness        (ออฟไลน์)   │
│  ข้อมูลล่าสุด: 3 ชั่วโมงที่แล้ว                │
│  ─────────────────────────────────────────  │
│  ยอดคงเหลือ    Equity       ...             │
│  $10,000.00   $10,000.00   ...  (stale)    │
│                                             │
│                   [🔴 CLOSE ALL] (disabled)  │
└─────────────────────────────────────────────┘
```

- ข้อมูลแสดงเป็นสีจางลง (opacity: 0.6)
- แสดงเวลาที่ offline ล่าสุด
- ปุ่ม CLOSE ALL จะ disabled (ไม่สามารถส่งคำสั่งได้)

### Responsive

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Cards 2 columns |
| Tablet (768-1023px) | Cards 1 column, full width |
| Mobile (<768px) | Cards 1 column, compact view |
