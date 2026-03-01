import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { simulateAccounts } from '../mock/simulator';
import { runtimeStore } from '../services/runtimeStore';
import { checkAlerts } from '../services/alertService';
import { recordSnapshot } from '../services/equityService';
import { JWT_SECRET } from '../middleware/auth';
import type { Account } from '../mock/data';

// Map each WebSocket to its userId
const clientUserMap = new Map<WebSocket, string>();

let wss: WebSocketServer;
let intervalId: NodeJS.Timeout | null = null;

const sendToClient = (ws: WebSocket, data: unknown): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

// Send update to a specific user's connections
export const broadcastToUser = (userId: string, accounts: Account[]): void => {
  const message = { type: 'UPDATE', data: accounts };
  clientUserMap.forEach((uid, ws) => {
    if (uid === userId) sendToClient(ws, message);
  });
};

// Broadcast to all connected users, each getting only their own accounts
const broadcastAll = (): void => {
  const userIds = new Set(clientUserMap.values());
  for (const userId of userIds) {
    const accounts = runtimeStore.getAccountsByUser(userId);
    const message = { type: 'UPDATE', data: accounts };
    clientUserMap.forEach((uid, ws) => {
      if (uid === userId) sendToClient(ws, message);
    });
  }
};

export const initWebSocket = (server: Server): void => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Extract token from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const userId = decoded.id;
      clientUserMap.set(ws, userId);

      console.log(`[WS] Client connected (user: ${userId})`);

      // Send initial snapshot of this user's accounts
      const accounts = runtimeStore.getAccountsByUser(userId);
      sendToClient(ws, { type: 'SNAPSHOT', data: accounts });

      ws.on('close', () => {
        clientUserMap.delete(ws);
        console.log('[WS] Client disconnected');
      });

      ws.on('error', (err) => {
        console.error('[WS] Error:', err.message);
      });
    } catch {
      ws.close(4001, 'Invalid token');
    }
  });

  // Simulation loop: run globally, broadcast per-user, check alerts
  intervalId = setInterval(() => {
    const allAccounts = runtimeStore.getAllAccounts();
    const updated = simulateAccounts(allAccounts);
    runtimeStore.updateAllAccounts(updated);
    broadcastAll();

    // Record equity snapshots for simulated accounts (sampled 1x/hour)
    for (const acc of updated) {
      recordSnapshot(acc.id, acc.equity, acc.balance, acc.drawdown)
        .catch(err => console.error('[Equity] recordSnapshot error:', err.message));
    }

    // Check alerts for each connected user
    const userIds = new Set(clientUserMap.values());
    for (const userId of userIds) {
      const userAccounts = runtimeStore.getAccountsByUser(userId);
      checkAlerts(userId, userAccounts).catch(err =>
        console.error('[Alert] checkAlerts error:', err.message)
      );
    }
  }, 2000);

  console.log('[WS] WebSocket server initialized on /ws');
};

export const stopBroadcaster = (): void => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

// Close all WebSocket connections for a specific user (e.g., when admin deletes user)
export const disconnectUser = (userId: string): void => {
  clientUserMap.forEach((uid, ws) => {
    if (uid === userId) {
      ws.close(4002, 'Account deleted');
      clientUserMap.delete(ws);
    }
  });
};
