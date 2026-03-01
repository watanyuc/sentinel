import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';
import accountsRouter from './routes/accounts';
import dashboardRouter from './routes/dashboard';
import mt5Router from './routes/mt5';
import adminRouter from './routes/admin';
import analyticsRouter from './routes/analytics';
import notificationsRouter from './routes/notifications';
import groupsRouter from './routes/groups';
import settingsRouter from './routes/settings';
import auditRouter from './routes/audit';
import { initWebSocket } from './websocket/broadcaster';
import { runtimeStore } from './services/runtimeStore';
import { cleanOldSnapshots } from './services/equityService';
import { cleanOldTrades } from './services/tradeHistoryService';
import { cleanOldAuditLogs, cleanOldNotificationLogs } from './services/retentionService';
import { reportScheduler } from './services/reportScheduler';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());

// CORS: production reads from CORS_ORIGIN env, dev allows localhost
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/mt5', mt5Router);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin/audit', auditRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — must be AFTER all routes
app.use(errorHandler);

const server = http.createServer(app);

// Initialize runtime store from DB, then start
runtimeStore.initialize().then(() => {
  initWebSocket(server);
  reportScheduler.start();
  server.listen(PORT, () => {
    console.log(`[SENTINEL] Backend running on http://localhost:${PORT}`);
  });

  // Daily cleanup of old data (run every 24h) — PDPA data retention
  setInterval(() => {
    cleanOldSnapshots().catch(err => console.error('[Cleanup] snapshots:', err.message));
    cleanOldTrades().catch(err => console.error('[Cleanup] trades:', err.message));
    cleanOldAuditLogs().catch(err => console.error('[Cleanup] audit:', err.message));
    cleanOldNotificationLogs().catch(err => console.error('[Cleanup] notifications:', err.message));
  }, 24 * 60 * 60 * 1000);
});
