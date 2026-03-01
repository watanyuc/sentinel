# 09 — UI Design System

## 🎨 Color Palette

### Base Theme (Dark Mode — Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0F172A` | พื้นหลังหลัก (slate-900) |
| `--bg-secondary` | `#1E293B` | พื้นหลังการ์ด (slate-800) |
| `--bg-tertiary` | `#334155` | พื้นหลัง hover/active (slate-700) |
| `--border` | `#475569` | เส้นขอบ (slate-600) |
| `--text-primary` | `#F8FAFC` | ข้อความหลัก (slate-50) |
| `--text-secondary` | `#94A3B8` | ข้อความรอง (slate-400) |
| `--text-muted` | `#64748B` | ข้อความจาง (slate-500) |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#10B981` | กำไร, ออนไลน์, สภาพดี |
| `--danger` | `#EF4444` | ขาดทุน, อันตราย, ลบ |
| `--warning` | `#F59E0B` | เตือน, ต้องจับตาดู |
| `--info` | `#3B82F6` | ข้อมูล, Buy Limit |
| `--orange` | `#F97316` | Sell Limit |
| `--pink` | `#EC4899` | Sell Stop |
| `--purple` | `#A855F7` | Buy Stop Limit |

### Gradient for Cards

```css
/* Profit card */
.card-profit {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(16, 185, 129, 0.2);
}

/* Loss card */
.card-loss {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.2);
}
```

---

## 🔤 Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 (Section Title) | Inter | 24px (1.5rem) | 700 (Bold) | 1.3 |
| H2 (Card Title) | Inter | 18px (1.125rem) | 600 (Semi) | 1.4 |
| H3 (Sub-heading) | Inter | 14px (0.875rem) | 600 (Semi) | 1.4 |
| Body | Inter | 14px (0.875rem) | 400 (Regular) | 1.5 |
| Small | Inter | 12px (0.75rem) | 400 (Regular) | 1.5 |
| Numbers (financial) | JetBrains Mono | 16px (1rem) | 500 (Medium) | 1.3 |
| Numbers (large) | JetBrains Mono | 24px (1.5rem) | 700 (Bold) | 1.2 |
| Clock | JetBrains Mono | 32px (2rem) | 600 (Semi) | 1.2 |

---

## 📐 Spacing System

ใช้ 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | ระหว่าง icon กับ text |
| `sm` | 8px | padding ภายใน compact element |
| `md` | 12px | gap ระหว่าง elements |
| `lg` | 16px | padding ภายในการ์ด |
| `xl` | 24px | gap ระหว่าง sections |
| `2xl` | 32px | margin ระหว่าง major sections |
| `3xl` | 48px | top-level spacing |

---

## 🧩 Component Patterns

### Summary Card

```
┌─────────────────────────┐
│  [Icon] Label            │  ← text-secondary, 12px
│  $25,430.50              │  ← text-primary, 24px, mono, bold
│  ▲ +2.5% (+$621.50)     │  ← success/danger, 12px
└─────────────────────────┘

Specs:
  padding: 16px
  border-radius: 12px
  background: var(--bg-secondary)
  border: 1px solid var(--border)
  min-width: 200px
```

### Bot Card

```
┌─────────────────────────────────────┐
│  Header: [Status] Name — Broker     │  ← 14px semi-bold
│  ─────────────────────────────────  │  ← border, 1px
│  Grid: 4 columns of key-value       │  ← 12px label, 16px value
│  ─────────────────────────────────  │
│  Footer: P/L + Change + [CLOSE ALL] │  ← 14px
└─────────────────────────────────────┘

Specs:
  padding: 20px
  border-radius: 12px
  background: var(--bg-secondary)
  border: 1px solid var(--border)
  transition: border-color 0.2s
  hover: border-color var(--info)
```

### Tab Bar

```
┌──────────┬──────────┬──────────┬──────────┐
│  Active  │  Normal  │  Normal  │  Normal  │
└──────────┴──────────┴──────────┴──────────┘

Active:
  background: var(--bg-tertiary)
  border-bottom: 2px solid var(--info)
  color: var(--text-primary)
  font-weight: 600

Normal:
  background: transparent
  border-bottom: 2px solid transparent
  color: var(--text-secondary)
  font-weight: 400
  hover: color var(--text-primary)
```

### Button Variants

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | `#3B82F6` | White | None | สร้าง, ยืนยัน |
| Danger | `#EF4444` | White | None | ลบ, Close All |
| Secondary | Transparent | `#94A3B8` | `#475569` | ยกเลิก |
| Ghost | Transparent | `#94A3B8` | None | คัดลอก, icon buttons |

### Badge / Status Pill

```
Online:  [🟢 Online ]  → bg: rgba(16,185,129,0.15), text: #10B981, border-radius: 9999px
Offline: [🔴 Offline]  → bg: rgba(239,68,68,0.15), text: #EF4444
```

### Toast Notification

```
┌─ ✅ ──────────────────────────┐
│  คัดลอก API Key แล้ว           │
│  (auto-dismiss 3s)            │
└──────────────────────────────┘

Position: bottom-right
Animation: slide-in from right
Duration: 3-5 seconds
Types: success (green), error (red), warning (yellow), info (blue)
```

---

## 📱 Breakpoints

| Name | Min Width | Max Width | Layout |
|------|-----------|-----------|--------|
| Mobile | 0 | 767px | Single column, stacked |
| Tablet | 768px | 1023px | 2 columns, compact |
| Desktop | 1024px | 1279px | Full layout |
| Wide | 1280px+ | — | Full layout, larger gaps |

### Container

```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container { padding: 0 24px; }
}

@media (min-width: 1024px) {
  .container { padding: 0 32px; }
}
```

---

## ✨ Animations

| Element | Animation | Duration | Easing |
|---------|----------|----------|--------|
| Number change | Count up/down | 300ms | ease-out |
| Status flash | Background pulse | 500ms | ease-in-out |
| Card hover | Border glow | 200ms | ease |
| Toast enter | Slide from right | 300ms | ease-out |
| Toast exit | Fade out | 200ms | ease-in |
| Modal enter | Scale + fade | 200ms | ease-out |
| Tab switch | Content fade | 150ms | ease |

### Number Transition

```css
.number-transition {
  transition: color 0.3s ease;
}

.number-flash-green {
  animation: flashGreen 0.5s ease;
}

@keyframes flashGreen {
  0% { color: var(--text-primary); }
  50% { color: var(--success); background: rgba(16,185,129,0.1); }
  100% { color: var(--text-primary); }
}
```

---

## 🌐 Internationalization

| Element | ภาษาไทย | English |
|---------|---------|---------|
| Labels | Thai | — |
| Numbers | `$1,234.56` (US format) | — |
| Dates | `DD MMM BBBB` (พ.ศ.) | `DD MMM YYYY` |
| Relative time | "2 นาทีที่แล้ว" | "2 minutes ago" |
| Status | ออนไลน์/ออฟไลน์ | Online/Offline |
| Financial terms | ยอดคงเหลือ, กำไร/ขาดทุน | Keep English for: Equity, Margin Level, Drawdown |
