# 08 — Data Models & API Specification

## 📦 Data Models

### User

```typescript
interface User {
  id: string;                 // UUID
  email: string;
  passwordHash: string;       // bcrypt
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
}

interface UserSettings {
  theme: 'dark' | 'light';
  language: 'th' | 'en';
  timezone: string;           // default: 'Asia/Bangkok'
  notifications: boolean;
  alertDrawdownThreshold: number;  // % to trigger alert
}
```

### MT5 Account

```typescript
interface MT5Account {
  id: string;                    // UUID
  userId: string;                // FK → User
  botName: string;               // ชื่อบอท
  brokerName: string;            // ชื่อโบรกเกอร์
  accountNumber: string;         // เลขบัญชี MT5
  server: string;                // MT5 server
  accountType: 'demo' | 'real';
  
  // API Key
  apiKey: string;                // hashed (bcrypt)
  apiKeyPrefix: string;          // first 8 chars for identification
  apiKeyLast4: string;           // last 4 chars for display
  
  // MT5 Credentials (encrypted)
  mt5Password: string;           // AES-256 encrypted
  
  // Status
  isOnline: boolean;
  lastSeenAt: Date | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Account Snapshot (Real-time data)

```typescript
interface AccountSnapshot {
  accountId: string;             // FK → MT5Account
  timestamp: Date;
  
  // Financial
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;           // (equity / margin) * 100
  
  // Calculated
  drawdown: number;              // (balance - equity) / balance * 100
  drawdownAmount: number;        // balance - equity
  profit: number;                // floating P/L
  
  // Change tracking (vs previous day close)
  balanceChangePercent: number;
  balanceChangeAmount: number;
  equityChangePercent: number;
  equityChangeAmount: number;
}
```

### Order

```typescript
interface Order {
  ticket: number;                // MT5 ticket number
  accountId: string;             // FK → MT5Account
  
  symbol: string;                // e.g. "XAUUSD"
  type: OrderType;
  direction: 'BUY' | 'SELL';
  
  lots: number;                  // lot size
  openPrice: number;
  currentPrice: number;
  
  stopLoss: number | null;
  takeProfit: number | null;
  
  profit: number;                // current P/L
  swap: number;
  commission: number;
  
  openTime: Date;
  expiration: Date | null;       // for pending orders
  
  comment: string;               // EA comment
  magicNumber: number;           // EA magic number
}

type OrderType = 
  | 'BUY'              // Market buy
  | 'SELL'             // Market sell
  | 'BUY_LIMIT'        // Pending
  | 'SELL_LIMIT'       // Pending
  | 'BUY_STOP'         // Pending
  | 'SELL_STOP'        // Pending
  | 'BUY_STOP_LIMIT'   // Pending
  | 'SELL_STOP_LIMIT'; // Pending
```

---

## 🌐 REST API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|---------|------------|------|
| `POST` | `/api/auth/login` | Login | ❌ |
| `POST` | `/api/auth/register` | Register | ❌ |
| `POST` | `/api/auth/refresh` | Refresh token | 🔑 Refresh Token |
| `POST` | `/api/auth/logout` | Logout | 🔑 JWT |

### Accounts

| Method | Endpoint | Description | Auth |
|--------|---------|------------|------|
| `GET` | `/api/accounts` | List all accounts | 🔑 JWT |
| `POST` | `/api/accounts` | Create account + API key | 🔑 JWT |
| `GET` | `/api/accounts/:id` | Get account detail | 🔑 JWT |
| `PUT` | `/api/accounts/:id` | Update account info | 🔑 JWT |
| `DELETE` | `/api/accounts/:id` | Delete account | 🔑 JWT |
| `POST` | `/api/accounts/:id/regenerate-key` | Regenerate API key | 🔑 JWT |

### Account Data (Real-time)

| Method | Endpoint | Description | Auth |
|--------|---------|------------|------|
| `GET` | `/api/accounts/:id/snapshot` | Current account data | 🔑 JWT |
| `GET` | `/api/accounts/:id/orders` | Open orders | 🔑 JWT |
| `GET` | `/api/accounts/:id/pending` | Pending orders | 🔑 JWT |
| `GET` | `/api/accounts/:id/history` | Trade history | 🔑 JWT |

### Dashboard Aggregate

| Method | Endpoint | Description | Auth |
|--------|---------|------------|------|
| `GET` | `/api/dashboard/overview` | Aggregated overview data | 🔑 JWT |
| `GET` | `/api/dashboard/heatmap/accounts` | Account health heatmap | 🔑 JWT |
| `GET` | `/api/dashboard/heatmap/orders` | Open orders heatmap | 🔑 JWT |
| `GET` | `/api/dashboard/heatmap/pending` | Pending orders heatmap | 🔑 JWT |

### Commands (EA Control)

| Method | Endpoint | Description | Auth |
|--------|---------|------------|------|
| `POST` | `/api/accounts/:id/close-all` | Close all orders | 🔑 JWT |
| `POST` | `/api/accounts/:id/close/:ticket` | Close specific order | 🔑 JWT |
| `POST` | `/api/accounts/:id/cancel/:ticket` | Cancel pending order | 🔑 JWT |

### EA Bot ↔ Server (API Key Auth)

| Method | Endpoint | Description | Auth |
|--------|---------|------------|------|
| `POST` | `/api/ea/heartbeat` | EA sends status update | 🔑 API Key |
| `POST` | `/api/ea/snapshot` | EA sends account data | 🔑 API Key |
| `POST` | `/api/ea/orders` | EA sends order updates | 🔑 API Key |
| `GET` | `/api/ea/commands` | EA polls for commands | 🔑 API Key |
| `POST` | `/api/ea/commands/:id/ack` | EA acknowledges command | 🔑 API Key |

---

## 🔌 WebSocket Events

### Connection

```javascript
// Client connects with JWT
const ws = new WebSocket('wss://sentinel.yourdomain.com/ws?token=<JWT>');
```

### Server → Client Events

| Event | Payload | Frequency | Description |
|-------|---------|-----------|-------------|
| `account:snapshot` | `AccountSnapshot` | 1-3s | Real-time account data |
| `account:status` | `{ id, isOnline }` | On change | Online/offline status |
| `order:update` | `Order` | Real-time | Order P/L update |
| `order:opened` | `Order` | On event | New order opened |
| `order:closed` | `Order + closePL` | On event | Order closed |
| `pending:placed` | `Order` | On event | New pending order |
| `pending:triggered` | `Order` | On event | Pending triggered |
| `pending:cancelled` | `Order` | On event | Pending cancelled |
| `command:result` | `CommandResult` | On event | Close all result |
| `alert:drawdown` | `{ id, dd% }` | On threshold | Drawdown alert |

### Event Payload Examples

```typescript
// account:snapshot
{
  "event": "account:snapshot",
  "data": {
    "accountId": "uuid-123",
    "balance": 5000.00,
    "equity": 4875.50,
    "margin": 390.00,
    "freeMargin": 4485.50,
    "marginLevel": 1250.00,
    "drawdown": 2.49,
    "profit": -124.50,
    "timestamp": "2026-02-22T14:30:45.000Z"
  }
}

// order:update
{
  "event": "order:update",
  "data": {
    "ticket": 12345,
    "accountId": "uuid-123",
    "symbol": "XAUUSD",
    "type": "BUY",
    "lots": 0.50,
    "openPrice": 2645.30,
    "currentPrice": 2647.80,
    "profit": 125.00,
    "swap": -2.50,
    "timestamp": "2026-02-22T14:30:45.000Z"
  }
}

// command:result
{
  "event": "command:result",
  "data": {
    "commandId": "cmd-456",
    "accountId": "uuid-123",
    "action": "close_all",
    "success": true,
    "closedCount": 5,
    "failedCount": 0,
    "totalPL": -124.50
  }
}
```

---

## 🗄️ Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MT5 Accounts
CREATE TABLE mt5_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bot_name VARCHAR(100) NOT NULL,
  broker_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  server VARCHAR(100) NOT NULL,
  account_type VARCHAR(10) DEFAULT 'demo',
  api_key_hash VARCHAR(255) NOT NULL,
  api_key_prefix VARCHAR(8) NOT NULL,
  api_key_last4 VARCHAR(4) NOT NULL,
  mt5_password_encrypted TEXT NOT NULL,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account Snapshots (time-series)
CREATE TABLE account_snapshots (
  id BIGSERIAL PRIMARY KEY,
  account_id UUID REFERENCES mt5_accounts(id) ON DELETE CASCADE,
  balance DECIMAL(15,2),
  equity DECIMAL(15,2),
  margin DECIMAL(15,2),
  free_margin DECIMAL(15,2),
  margin_level DECIMAL(10,2),
  drawdown DECIMAL(5,2),
  profit DECIMAL(15,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for time-series queries
CREATE INDEX idx_snapshots_account_time 
  ON account_snapshots(account_id, recorded_at DESC);

-- Commands Queue
CREATE TABLE commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES mt5_accounts(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending',
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);
```

---

## 🔐 API Key Format

```
Format: ak_{broker_prefix}_{random_32_chars}
Example: ak_xm12345_9f8e7d6c5b4a32109f8e7d6c5b4a3210

Storage:
  - Full key: shown once at creation, never stored
  - Hash: bcrypt hash stored in DB
  - Prefix: first 8 chars for lookup (indexed)
  - Last 4: for display in UI
```
