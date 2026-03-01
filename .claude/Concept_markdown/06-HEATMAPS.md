# 06 — Heatmaps (3 ประเภท)

## ภาพรวม

Heatmap ใช้แสดงข้อมูลในรูปแบบ visual blocks (คล้าย Treemap) เพื่อให้เห็นสถานะของบัญชี/ออเดอร์ทั้งหมดในมุมสูงได้อย่างรวดเร็ว

### Layout Pattern (ใช้ร่วมกันทั้ง 3 tabs)

```
┌──────────────────────────────────────────────────────┐
│  Title + Legend                                       │
│  ┌────┬──────────┬───┬────────────────┬──────┬─────┐ │
│  │    │          │   │                │      │     │ │
│  │ A1 │    A2    │A3 │      A4        │  A5  │ A6  │ │
│  │    │          │   │                │      │     │ │
│  ├────┴──────┬───┴───┼────────┬───────┴──┬───┴─────┤ │
│  │           │       │        │          │         │ │
│  │    A7     │  A8   │   A9   │   A10    │   A11   │ │
│  │           │       │        │          │         │ │
│  └───────────┴───────┴────────┴──────────┴─────────┘ │
│                                                      │
│  Each block size = proportional to value (lot/volume) │
│  Each block color = based on status/health           │
└──────────────────────────────────────────────────────┘
```

### Block Content (แต่ละ block แสดง)

```
┌─────────────────────┐
│  Bot Name / Symbol   │
│  $1,250 / 0.5 lot   │
│  +2.5%               │
└─────────────────────┘
```

---

## TAB 2: Heatmap สภาพบัญชีทั้งหมด

### Purpose
แสดงภาพรวมสุขภาพของบัญชีเทรดของท่าน โดยใช้สีแสดงระดับ Drawdown

### Color Scheme

| สถานะ | สี | Hex | เงื่อนไข | Description |
|-------|-----|-----|---------|-------------|
| สภาพดี | 🟢 เขียว | `#10B981` | Drawdown < 10% | ปลอดภัย |
| ต้องจับตาดู | 🟡 เหลือง | `#F59E0B` | Drawdown 10-30% | ระวัง |
| อันตราย | 🔴 แดง | `#EF4444` | Drawdown > 30% | ต้องจัดการ |

### Block Size
- ขนาด block = สัดส่วนตาม **Balance** ของบัญชีนั้น
- บัญชีที่มี Balance มากจะมี block ใหญ่กว่า

### Block Content

```
┌─────────────────────────────┐
│  Gold Scalper Bot             │
│  XM Global — #12345678       │
│  Balance: $5,000             │
│  Equity: $4,850              │
│  DD: 3.0%                    │
│  P/L: -$150                  │
└─────────────────────────────┘
```

### Data per Block

| Field | Description |
|-------|------------|
| Bot Name | ชื่อบอท |
| Broker + Account | ข้อมูลบัญชี |
| Balance | ยอดคงเหลือ |
| Equity | Equity ปัจจุบัน |
| Drawdown % | `(Balance - Equity) / Balance * 100` |
| P/L | Profit/Loss ปัจจุบัน |

### Legend

```
Legend: 🟢 สภาพดี (DD < 10%) | 🟡 จับตาดู (DD 10-30%) | 🔴 อันตราย (DD > 30%)
```

---

## TAB 3: Heatmap ออเดอร์ที่เปิดอยู่

### Purpose
แสดงภาพรวมของออเดอร์ที่เปิดอยู่ทั้งหมด โดยใช้สีแสดงสถานะกำไร/ขาดทุน

### Color Scheme

| สถานะ | สี | Hex | เงื่อนไข | Description |
|-------|-----|-----|---------|-------------|
| กำไร | 🟢 เขียว | `#10B981` | Profit > 0 | ออเดอร์กำไร |
| เท่าทุน | ⚪ เทา | `#6B7280` | Profit = 0 (±$1) | เท่าทุน |
| ขาดทุน | 🔴 แดง | `#EF4444` | Profit < 0 | ออเดอร์ขาดทุน |

### Gradient Intensity
- สีเข้ม = กำไร/ขาดทุน มาก
- สีอ่อน = กำไร/ขาดทุน น้อย

```
Profit Scale:
  Dark Green ← Light Green ← Gray → Light Red → Dark Red
  +$500        +$50          $0      -$50         -$500
```

### Block Size
- ขนาด block = สัดส่วนตาม **Lot Size** ของออเดอร์
- ออเดอร์ที่มี lot ใหญ่จะมี block ใหญ่กว่า

### Block Content

```
┌─────────────────────────────┐
│  🟢 BUY XAUUSD              │
│  Bot: Gold Scalper            │
│  0.50 lot @ 2,645.30        │
│  P/L: +$125.50              │
│  Duration: 2h 15m           │
└─────────────────────────────┘
```

### Data per Block

| Field | Description |
|-------|------------|
| Direction | 🟢 BUY / 🔴 SELL |
| Symbol | คู่เงิน e.g. XAUUSD |
| Bot Name | ชื่อบอทที่เปิดออเดอร์ |
| Lot Size | ขนาด lot |
| Open Price | ราคาที่เปิด |
| Current P/L | กำไร/ขาดทุนปัจจุบัน |
| Duration | ระยะเวลาที่เปิดออเดอร์ |

### Legend

```
Legend: 🟢 กำไร | ⚪ เท่าทุน | 🔴 ขาดทุน (ความเข้มสี = จำนวนเงิน)
```

---

## TAB 4: Heatmap คำสั่งซื้อขายที่รอดำเนินการ (Pending Orders)

### Purpose
แสดงภาพรวมของคำสั่งซื้อขายที่รอดำเนินการทั้งหมด โดยใช้สีแยกตามประเภท

### Color Scheme

| ประเภท | สี | Hex | Description |
|--------|-----|-----|------------|
| Buy Limit | 🔵 น้ำเงิน | `#3B82F6` | ซื้อเมื่อราคาลงมาถึง |
| Sell Limit | 🟠 ส้ม | `#F97316` | ขายเมื่อราคาขึ้นไปถึง |
| Buy Stop | 🟢 เขียว | `#22C55E` | ซื้อเมื่อราคาขึ้นไปถึง |
| Sell Stop | 🩷 ชมพู | `#EC4899` | ขายเมื่อราคาลงมาถึง |
| Buy Stop Limit | 🟣 ม่วง | `#A855F7` | Buy Stop + Limit |
| Sell Stop Limit | 🔴 แดง | `#EF4444` | Sell Stop + Limit |

### Block Size
- ขนาด block = สัดส่วนตาม **Lot Size** ของคำสั่ง

### Block Content

```
┌─────────────────────────────┐
│  🔵 BUY LIMIT XAUUSD        │
│  Bot: Grid Trader            │
│  0.10 lot @ 2,620.00        │
│  SL: 2,610.00 | TP: 2,650.00│
│  Expires: 24h               │
└─────────────────────────────┘
```

### Data per Block

| Field | Description |
|-------|------------|
| Order Type | ประเภทคำสั่ง (6 types) |
| Symbol | คู่เงิน |
| Bot Name | ชื่อบอท |
| Lot Size | ขนาด lot |
| Price | ราคาที่ตั้ง |
| Stop Loss | SL ถ้ามี |
| Take Profit | TP ถ้ามี |
| Expiration | เวลาหมดอายุ (ถ้ามี) |

### Legend

```
Legend: 🔵 Buy Limit | 🟠 Sell Limit | 🟢 Buy Stop | 🩷 Sell Stop | 🟣 Buy Stop Limit | 🔴 Sell Stop Limit
```

---

## Heatmap Implementation Notes

### Library Recommendation
- **react-d3-treemap** หรือ **recharts Treemap** component
- Custom CSS Grid-based solution ก็ได้ถ้าต้องการ control มากขึ้น

### Interaction

| Action | Result |
|--------|--------|
| Hover | แสดง tooltip ข้อมูลเต็ม |
| Click | เปิด detail panel ของบัญชี/ออเดอร์นั้น |
| Resize | Auto-adjust layout |

### Empty State
ถ้าไม่มีข้อมูล (เช่น ไม่มี pending orders):

```
┌──────────────────────────────────┐
│                                  │
│  📭 ไม่มีคำสั่งซื้อขายที่รอดำเนินการ  │
│                                  │
└──────────────────────────────────┘
```

### Responsive

| Breakpoint | Behavior |
|-----------|----------|
| Desktop | Full treemap layout |
| Tablet | Simplified grid (2 columns) |
| Mobile | Stacked list view แทน heatmap |
