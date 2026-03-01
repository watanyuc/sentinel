# 10 — Security & Deployment

## 🔐 Security

### Authentication

| Feature | Implementation |
|---------|---------------|
| Login | Email + Password (bcrypt, cost 12) |
| Session | JWT (access: 15min, refresh: 7 days) |
| Token Storage | httpOnly cookie (refresh), memory (access) |
| CSRF | Double-submit cookie pattern |
| Rate Limit | 100 req/min per IP (login: 5 req/min) |

### API Key Security

| Concern | Solution |
|---------|---------|
| Storage | bcrypt hash (ไม่เก็บ plaintext) |
| Display | แสดงเฉพาะ 4 ตัวท้าย |
| Transmission | HTTPS only, never in URL params |
| Rotation | สร้างใหม่ได้ (revoke old immediately) |
| Scope | 1 key = 1 MT5 account |

### MT5 Password Security

```
Encryption: AES-256-GCM
Key Derivation: PBKDF2 from master key
Storage: encrypted in DB, master key in env var / secret manager
Decryption: only when establishing MT5 connection (server-side only)
```

### Data Protection

| Data | Protection |
|------|-----------|
| Passwords | bcrypt (cost 12) |
| MT5 Credentials | AES-256-GCM |
| API Keys | bcrypt hash + prefix index |
| WebSocket | WSS (TLS) + JWT auth |
| All Traffic | HTTPS (TLS 1.3) |
| Database | Encrypted at rest |

### Input Validation

- ทุก input ผ่าน validation (Zod / Joi)
- SQL injection: ใช้ parameterized queries เท่านั้น
- XSS: sanitize all outputs, CSP headers
- Account Number: numeric only, 6-12 digits
- Bot Name: alphanumeric + spaces, 1-50 chars

---

## 🚀 Deployment

### Docker Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:4000
      - VITE_WS_URL=ws://backend:4000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/sentinel_dashboard
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=sentinel_dashboard
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - frontend
      - backend

volumes:
  pgdata:
  redisdata:
```

### Environment Variables

```bash
# .env (NEVER commit to git)

# Database
DB_USER=sentinel_admin
DB_PASSWORD=<strong_password>
DATABASE_URL=postgresql://sentinel_admin:<password>@localhost:5432/sentinel_dashboard

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=<random_64_chars>
JWT_REFRESH_SECRET=<random_64_chars>

# Encryption
ENCRYPTION_KEY=<random_32_bytes_hex>

# MetaApi (if using)
META_API_TOKEN=<your_meta_api_token>

# App
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://dashboard.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name dashboard.yourdomain.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
    }

    # API
    location /api/ {
        proxy_pass http://backend:4000;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

---

## 📊 Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| Server uptime | Health check endpoint | < 99.9% |
| API response time | Logging middleware | > 2s |
| WebSocket connections | Counter | > 1000 concurrent |
| DB query time | pg_stat_statements | > 500ms |
| Error rate | Error logging | > 1% of requests |
| MT5 connection drops | Heartbeat monitor | > 3 consecutive misses |

### Health Check

```
GET /api/health

Response:
{
  "status": "ok",
  "uptime": 86400,
  "services": {
    "database": "connected",
    "redis": "connected",
    "mt5_bridge": "connected"
  },
  "timestamp": "2026-02-22T14:30:45.000Z"
}
```

---

## 📁 Project Structure

```
sentinel-dashboard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Header, Sidebar, Footer
│   │   │   ├── clocks/          # DualClock component
│   │   │   ├── chart/           # TradingView widget
│   │   │   ├── accounts/        # API Key management
│   │   │   ├── overview/        # Overview tab + cards
│   │   │   ├── heatmaps/        # 3 heatmap components
│   │   │   ├── bots/            # Bot cards + filters
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── hooks/               # Custom hooks (useWebSocket, etc.)
│   │   ├── stores/              # Zustand stores
│   │   ├── services/            # API client
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Helpers, formatters
│   ├── package.json
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── routes/              # Express/Fastify routes
│   │   ├── controllers/         # Request handlers
│   │   ├── services/            # Business logic
│   │   ├── models/              # DB models
│   │   ├── middleware/          # Auth, rate limit, validation
│   │   ├── websocket/           # WS event handlers
│   │   ├── mt5/                 # MT5 bridge / MetaApi client
│   │   └── utils/               # Crypto, helpers
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env.example
└── README.md
```
