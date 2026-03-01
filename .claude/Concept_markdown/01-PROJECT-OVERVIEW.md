# SENTINEL Dashboard — Project Overview

> **Project Codename:** MT5 EA MIKE  
> **Display Name:** SENTINEL Dashboard  
> **Tagline:** "ผู้เฝ้าระวังบัญชีเทรดของคุณ 24/7"

## 🎯 วัตถุประสงค์

แพลตฟอร์มแดชบอร์ดสำหรับติดตามผลการเทรดและส่งคำสั่งควบคุม EA (Expert Advisor) จากระยะไกล เป็นเครื่องมืออำนวยความสะดวกในการเทรดอัตโนมัติและติดตามผลเท่านั้น

> **Disclaimer:** ระบบนี้เป็นเครื่องมือช่วยบริหารจัดการ ไม่ใช่คำแนะนำในการลงทุน การเทรดมีความเสี่ยง

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  Dashboard UI / Charts / Account Management / Controls│
└────────────────────────┬────────────────────────────┘
                         │ REST API / WebSocket
┌────────────────────────▼────────────────────────────┐
│                Backend (Node.js / Python)             │
│  Auth / API Key Manager / MT5 Bridge / Command Queue  │
└────────────────────────┬────────────────────────────┘
                         │ MetaTrader 5 API
┌────────────────────────▼────────────────────────────┐
│              MT5 Terminal(s) + EA Bots                │
│  Multiple Accounts / Multiple Brokers                 │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack (แนะนำ)

| Layer | Technology | หมายเหตุ |
|-------|-----------|----------|
| Frontend | React + TypeScript + Tailwind CSS | SPA, responsive |
| UI Components | shadcn/ui | สวยงาม, accessible |
| Charts | TradingView Widget (Embed) | สำหรับกราฟ XAUUSD |
| State Management | Zustand หรือ React Query | เบา, เหมาะกับ real-time |
| Backend | Node.js (Express/Fastify) หรือ Python (FastAPI) | REST + WebSocket |
| Database | PostgreSQL + Redis | เก็บ API keys, session, cache |
| MT5 Connection | MetaApi หรือ custom MT5 bridge | เชื่อมต่อ MT5 accounts |
| Auth | JWT + bcrypt | ความปลอดภัย |
| Deployment | Docker + Nginx | production-ready |

---

## 📁 โครงสร้างไฟล์ Spec ทั้งหมด

| ไฟล์ | เนื้อหา |
|------|--------|
| `01-PROJECT-OVERVIEW.md` | ภาพรวมโปรเจค, architecture, tech stack |
| `02-HEADER-AND-CLOCKS.md` | ส่วนหัว, นาฬิกาเวลาไทย + New York |
| `03-TRADINGVIEW-CHART.md` | กราฟ XAUUSD จาก TradingView |
| `04-API-KEY-MANAGEMENT.md` | จัดการ API Keys และบัญชี MT5 |
| `05-ACCOUNT-OVERVIEW-TABS.md` | ภาพรวมสถานะบัญชี 4 TABs |
| `06-HEATMAPS.md` | Heatmap สภาพบัญชี, ออเดอร์, Pending |
| `07-BOT-ACCOUNTS-LIST.md` | รายการบอท/บัญชี MT5 ทั้งหมด + ตัวกรอง |
| `08-DATA-MODELS.md` | โครงสร้างข้อมูล, API endpoints, WebSocket events |
| `09-UI-DESIGN-SYSTEM.md` | สี, ฟอนต์, spacing, component patterns |
| `10-SECURITY-AND-DEPLOYMENT.md` | ความปลอดภัย, deployment, environment variables |

---

## 🖥️ Page Layout (Top to Bottom)

```
┌──────────────────────────────────────────────┐
│  Header: Logo + Navigation + User Menu       │
├──────────────────────────────────────────────┤
│  Clocks: 🇹🇭 เวลาไทย  |  🇺🇸 เวลา New York   │
├──────────────────────────────────────────────┤
│  TradingView Chart: XAUUSD (Embedded)        │
├──────────────────────────────────────────────┤
│  จัดการบัญชี MT5 ของฉัน                        │
│  ┌─ API Keys Management ──────────────────┐  │
│  │  [+ สร้าง API Key ใหม่]                  │  │
│  │  Account 1: ●●●●key1  [📋 Copy] [🗑 Del]│  │
│  │  Account 2: ●●●●key2  [📋 Copy] [🗑 Del]│  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  ภาพรวมสถานะบัญชี                              │
│  ┌─ [Overview] [Heatmap บัญชี] [Heatmap     ┐│
│  │   ออเดอร์] [Heatmap Pending]              ││
│  │                                           ││
│  │  (Content changes based on active tab)    ││
│  └───────────────────────────────────────────┘│
├──────────────────────────────────────────────┤
│  ภาพรวมบัญชี MT5 ทั้งหมด                       │
│  ┌─ Filters ─────────────────────────────┐   │
│  │  [Status ▼] [Broker ▼] [Search...]    │   │
│  └───────────────────────────────────────┘   │
│  ┌─ Bot Card 1 ──────────────────────────┐   │
│  │  Bot Name (🟢 Online) | Broker: XM    │   │
│  │  Balance | Equity | Margin | DD | P/L  │   │
│  │  Change: +2.5% (+$125)                 │   │
│  │                    [🔴 CLOSE ALL]      │   │
│  └───────────────────────────────────────┘   │
│  ┌─ Bot Card 2 ──────────────────────────┐   │
│  │  ...                                   │   │
│  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```
