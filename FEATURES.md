# SENTINEL - Feature Summary & Development Roadmap

> Last updated: 2026-02-27

---

## 1. Current Features

### 1.1 Real-time Trading Dashboard
- Overview cards: Total Balance, Equity, Profit, Open Lots, Online/Offline accounts
- Account Health heatmap (color-coded by drawdown/margin)
- Open Orders heatmap (all positions with duration tracking)
- Pending Orders heatmap
- WebSocket real-time updates (every ~2 seconds)

### 1.2 MT5 Integration
- Expert Advisor (EA) file: `SENTINEL_Reporter.mq5`
- EA pushes account data every 2 seconds via `POST /api/mt5/push`
- Command queue: CLOSE ALL positions dispatched to EA
- Auto-detect offline (30-second timeout)
- Simulated accounts with random walk for demo/testing

### 1.3 Account Management
- Add/Delete trading accounts (name, broker, account number, API key)
- Account Groups: create, edit, delete, assign with color coding
- Group filtering on dashboard
- Inline group selector on each BotCard
- CLOSE ALL positions (real = queued to EA, simulated = immediate)

### 1.4 Analytics & History
- Equity Chart: line chart with timeframe selection (1D / 1W / 1M / 3M)
- Daily P&L: bar chart from closed trades (1M / 3M / 6M)
- Performance Metrics: win rate, profit factor, max drawdown, gross P&L
- Trade History: paginated, filterable (symbol, type, account), sortable
- CSV export for trade history and audit logs

### 1.5 Alert System & Drawdown Protection
- Per-account alert thresholds: drawdown %, equity below, margin level, offline
- Telegram bot notifications (HTML formatted)
- 5-minute cooldown per alert type to prevent spam
- Drawdown Protection: auto CLOSE ALL when drawdown exceeds threshold
- 30-minute cooldown on protection triggers
- Notification log: full history of all sent alerts

### 1.6 Scheduled Reports
- Telegram report: daily / weekly / monthly
- Report content: portfolio summary, today's P&L, performance metrics, account list
- Configurable report time and day-of-week
- "Send Now" button for on-demand reports

### 1.7 Multi-User & Admin
- JWT authentication (24h expiry)
- Role-based access: admin / user
- Admin: create/delete users, change roles
- Each user sees only their own accounts
- Per-user WebSocket broadcasts

### 1.8 Audit Log
- Tracks all user actions: login, create/delete account, close all, settings changes
- Admin actions: user management, role changes
- Filterable by user, action, date range
- CSV export

### 1.9 Multi-Language (i18n)
- English (en) / Thai (th)
- ~150 translation keys
- Language selector in header and profile settings

### 1.10 Theme System
- Dark mode (default) / Light mode
- CSS variable-based theming
- Persisted preference per user

### 1.11 User Settings
- Profile: name, email, change password
- Telegram: bot token, chat ID, test message
- Preferences: language, theme
- Report schedule configuration

---

## 2. Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v3, Zustand, TanStack Query, Recharts |
| Backend | Node.js, Express 5, TypeScript, ws (WebSocket), JWT |
| Database | Prisma 7 + SQLite (via better-sqlite3 adapter) |
| Realtime | WebSocket (per-user broadcast) |
| Notifications | Telegram Bot API |
| MT5 | MQL5 Expert Advisor |
| Icons | Lucide React |

### API Summary: 38 endpoints
- Auth: 7 | Accounts: 6 | Dashboard: 4 | Analytics: 4
- Groups: 5 | Settings: 6 | MT5: 1 | Admin: 5
- Notifications: 1 | Health: 1

### Database Models: 7 tables
- User, Account, AccountGroup, EquitySnapshot, ClosedTrade, NotificationLog, AuditLog

---

## 3. Development Roadmap (Planned Features)

### Priority A - High Impact

| Feature | Description |
|---------|-------------|
| PDPA Compliance | Encrypt sensitive data, privacy policy page, data export/deletion, consent banner |
| Docker Deployment | Dockerfile + docker-compose for easy VPS deployment |
| Symbol Analytics | P&L breakdown by trading symbol (XAUUSD, EURUSD, etc.) |
| Account Comparison | Side-by-side comparison of 2-3 accounts |
| Risk Score | Automated risk rating per account (based on DD, margin, lot size) |

### Priority B - Nice to Have

| Feature | Description |
|---------|-------------|
| Multi-Broker Dashboard | Aggregate view across all brokers |
| Email Notifications | Alternative to Telegram (SMTP integration) |
| Mobile PWA | Progressive Web App for mobile notifications |
| 2FA / TOTP | Two-factor authentication for login |
| API Rate Limiting | Prevent abuse of public endpoints |
| Webhook Integration | Discord / Line / Slack notifications |
| Custom Dashboard Layout | Drag & drop widget arrangement |
| Account Notes | Free-text notes per account |

### Priority C - Advanced

| Feature | Description |
|---------|-------------|
| Strategy Tagging | Tag accounts with strategy names, filter by strategy |
| Copy Trading Monitor | Track master/slave account sync |
| Backtesting Viewer | Import and visualize backtest results |
| Multi-Server Support | Connect to multiple SENTINEL backends |
| Data Backup & Restore | Scheduled SQLite backup with download |
| Real-time P&L Chart | Live updating profit chart (not just equity) |
| Trade Journal | Manual notes per trade with screenshots |

---

## 4. PDPA Compliance Status

### What is PDPA?
Thailand's Personal Data Protection Act (PDPA) requires organizations to:
- Collect only necessary personal data with user consent
- Protect data with appropriate security measures
- Allow users to access, correct, and delete their data
- Notify users of data breaches
- Appoint a Data Protection Officer (DPO) if applicable

### Current Status

| Area | Status | Action Needed |
|------|--------|---------------|
| Password Hashing | PASS | bcrypt with 10 salt rounds |
| API Key Masking | PARTIAL | Masked on frontend, plaintext in DB |
| Telegram Token Storage | FAIL | Stored in plaintext, needs encryption |
| JWT Security | PARTIAL | Default secret too weak for production |
| Data Retention | PARTIAL | 90-day for financials, no limit on audit logs |
| User Deletion | PASS | Full cascade delete implemented |
| HTTPS | NOT CONFIGURED | Must enforce in production |
| Privacy Policy Page | MISSING | Must create and display to users |
| Consent Banner | MISSING | Required for PDPA |
| Data Export (user request) | MISSING | Users must be able to request their data |
| Breach Notification | MISSING | No mechanism in place |
| Third-party Tracking | PASS | No external tracking detected |

### Planned PDPA Implementation

1. **Encrypt sensitive fields** - Telegram tokens, API keys (AES-256)
2. **Privacy Policy page** - Clear disclosure of what data is collected and why
3. **Consent on registration** - Users must agree to data processing terms
4. **Data export endpoint** - `GET /api/auth/my-data` returns all user data as JSON
5. **Self-service deletion** - Users can request account deletion
6. **Audit log retention** - Auto-cleanup after 1 year
7. **Strong JWT secret** - Enforce minimum 32-character random secret
8. **HTTPS enforcement** - Redirect HTTP to HTTPS, HSTS header
9. **Cookie/localStorage consent** - Banner on first visit

---

## 5. Deployment Checklist

Before deploying to production VPS:

- [ ] Set strong `JWT_SECRET` (run: `openssl rand -hex 32`)
- [ ] Encrypt Telegram tokens in database
- [ ] Enable HTTPS via Nginx + Certbot
- [ ] Update CORS to production domain
- [ ] Add privacy policy page
- [ ] Add consent banner
- [ ] Set up database backups
- [ ] Configure PM2 for auto-restart
- [ ] Set up log rotation
- [ ] Test user deletion flow
- [ ] Remove demo accounts from seed
- [ ] Change default admin password
