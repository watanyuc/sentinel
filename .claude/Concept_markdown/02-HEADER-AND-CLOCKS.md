# 02 — Header & Clocks Section

## 🕐 Dual Clock Display

แสดงเวลาแบบ real-time (อัปเดตทุกวินาที) สำหรับ 2 timezone ที่สำคัญสำหรับเทรดเดอร์

### Layout

```
┌──────────────────────────────────────────────────────┐
│  🇹🇭 เวลาไทย (Local)          🇺🇸 เวลา New York       │
│  22 ก.พ. 2569 14:30:45       22 Feb 2026 02:30:45   │
│  ICT (UTC+7)                  EST (UTC-5)            │
└──────────────────────────────────────────────────────┘
```

### Specifications

| Property | เวลาไทย | เวลา New York |
|----------|---------|---------------|
| Timezone | `Asia/Bangkok` (UTC+7) | `America/New_York` (UTC-5/UTC-4 DST) |
| Format วันที่ | `DD MMM BBBB` (พ.ศ.) | `DD MMM YYYY` (ค.ศ.) |
| Format เวลา | `HH:mm:ss` (24hr) | `HH:mm:ss` (24hr) |
| Label | "เวลาไทย (Local)" | "เวลา New York" |
| Sub-label | "ICT (UTC+7)" | "EST (UTC-5)" หรือ "EDT (UTC-4)" อัตโนมัติ |
| Flag Icon | 🇹🇭 | 🇺🇸 |
| Update Interval | ทุก 1 วินาที | ทุก 1 วินาที |

### Implementation Notes

```typescript
// ใช้ Intl.DateTimeFormat สำหรับ timezone conversion
const thaiTime = new Intl.DateTimeFormat('th-TH', {
  timeZone: 'Asia/Bangkok',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false
});

const nyTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false
});

// ตรวจสอบ DST อัตโนมัติ
const isDST = () => {
  const jan = new Date(new Date().getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(new Date().getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(jan, jul) !== new Date().getTimezoneOffset();
};
```

### Market Session Indicator (Optional Enhancement)

แสดงสถานะตลาดปัจจุบัน:

| Session | เวลา (NY) | สี |
|---------|----------|-----|
| Sydney | 17:00–02:00 | 🔵 Blue |
| Tokyo | 19:00–04:00 | 🟡 Yellow |
| London | 03:00–12:00 | 🟢 Green |
| New York | 08:00–17:00 | 🔴 Red |
| Overlap (London+NY) | 08:00–12:00 | 🟣 Purple (highlight) |

### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | แนวนอน: เวลาไทย (ซ้าย) — เวลา NY (ขวา) |
| Tablet (768-1023px) | แนวนอน: เล็กลง |
| Mobile (<768px) | แนวตั้ง: stack 2 แถว |

---

## 🔝 Header Bar

```
┌──────────────────────────────────────────────────────┐
│  [Logo] SENTINEL Dashboard    [Dashboard] [Settings]  [👤] │
└──────────────────────────────────────────────────────┘
```

### Header Components

| Element | Description |
|---------|------------|
| Logo | โลโก้ระบบ + ชื่อ "SENTINEL Dashboard" |
| Navigation | Dashboard (active), Settings |
| User Menu | Avatar → Dropdown: Profile, Settings, Logout |
| Connection Status | 🟢 Connected / 🔴 Disconnected (WebSocket status) |
