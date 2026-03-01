import prisma from '../lib/prisma';
import { sendTelegramMessage, escapeHtml } from './telegramService';
import { logNotification } from './notificationLogger';
import { checkDrawdownProtection } from './drawdownProtection';
import { decrypt } from '../lib/encryption';
import type { Account } from '../mock/data';

// Cooldown: Map key = `${accountId}:${alertType}`, value = timestamp of last fire
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

type AlertType = 'drawdown' | 'equity' | 'margin' | 'offline';

const isOnCooldown = (accountId: string, type: AlertType): boolean => {
  const key = `${accountId}:${type}`;
  const last = cooldowns.get(key);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
};

const markFired = (accountId: string, type: AlertType): void => {
  cooldowns.set(`${accountId}:${type}`, Date.now());
};

/**
 * Check alert conditions for a user's accounts.
 * Called from both the simulation loop (broadcaster) and MT5 real push (mt5Controller).
 */
export const checkAlerts = async (
  userId: string,
  accounts: Account[],
): Promise<void> => {
  // Skip if no accounts have any activity worth alerting
  if (accounts.length === 0) return;

  // Fetch user Telegram credentials + account thresholds
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      telegramBotToken: true,
      telegramChatId: true,
      accounts: {
        select: {
          id: true,
          alertDrawdown: true,
          alertEquityBelow: true,
          alertMarginLevel: true,
          alertOffline: true,
        },
      },
    },
  });

  if (!user?.telegramBotToken || !user?.telegramChatId) return;

  const telegramBotToken = decrypt(user.telegramBotToken);
  const { telegramChatId } = user;

  // Build threshold lookup by account id
  const thresholds = new Map(user.accounts.map(a => [a.id, a]));

  for (const account of accounts) {
    // Skip offline accounts for drawdown/equity/margin checks
    if (account.status !== 'online') continue;

    const t = thresholds.get(account.id);
    if (!t) continue;

    const fires: Array<{ type: AlertType; message: string }> = [];

    const safeName = escapeHtml(account.name);

    // 1. Drawdown alert
    if (t.alertDrawdown !== null && account.drawdown >= t.alertDrawdown) {
      fires.push({
        type: 'drawdown',
        message: `⚠️ <b>DRAWDOWN ALERT</b>\n\nAccount: <b>${safeName}</b>\nDrawdown: <b>${account.drawdown.toFixed(2)}%</b> (threshold: ${t.alertDrawdown}%)\nEquity: $${account.equity.toFixed(2)}`,
      });
    }

    // 2. Equity below alert
    if (t.alertEquityBelow !== null && account.equity < t.alertEquityBelow) {
      fires.push({
        type: 'equity',
        message: `💰 <b>EQUITY ALERT</b>\n\nAccount: <b>${safeName}</b>\nEquity: <b>$${account.equity.toFixed(2)}</b> (threshold: $${t.alertEquityBelow})\nBalance: $${account.balance.toFixed(2)}`,
      });
    }

    // 3. Margin level alert
    if (t.alertMarginLevel !== null && account.marginLevel <= t.alertMarginLevel && account.marginLevel > 0) {
      fires.push({
        type: 'margin',
        message: `🔴 <b>MARGIN LEVEL ALERT</b>\n\nAccount: <b>${safeName}</b>\nMargin Level: <b>${account.marginLevel.toFixed(1)}%</b> (threshold: ${t.alertMarginLevel}%)\nFree Margin: $${account.freeMargin.toFixed(2)}`,
      });
    }

    for (const fire of fires) {
      if (isOnCooldown(account.id, fire.type)) continue;
      markFired(account.id, fire.type);
      const fullMsg = `[SENTINEL]\n${fire.message}`;
      sendTelegramMessage(telegramBotToken, telegramChatId, fullMsg)
        .then(() => logNotification(userId, account.id, fire.type, fullMsg, true))
        .catch(err => {
          console.error(`[Alert] Telegram send failed:`, err.message);
          logNotification(userId, account.id, fire.type, fullMsg, false);
        });
    }
  }

  // Also check drawdown protection (auto CLOSE ALL)
  checkDrawdownProtection(userId, accounts)
    .catch(err => console.error('[Alert] drawdownProtection error:', err.message));
};

/**
 * Check offline alert for a specific account.
 * Called from mt5Controller when heartbeat times out.
 */
export const checkOfflineAlert = async (
  userId: string,
  account: Account,
): Promise<void> => {
  if (isOnCooldown(account.id, 'offline')) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      telegramBotToken: true,
      telegramChatId: true,
      accounts: {
        where: { id: account.id },
        select: { alertOffline: true },
      },
    },
  });

  if (!user?.telegramBotToken || !user?.telegramChatId) return;
  if (!user.accounts[0]?.alertOffline) return;

  markFired(account.id, 'offline');
  const botToken = decrypt(user.telegramBotToken);
  const offlineMsg = `[SENTINEL]\n📡 <b>OFFLINE ALERT</b>\n\nAccount: <b>${escapeHtml(account.name)}</b>\nNo data received for 30 seconds.`;
  sendTelegramMessage(botToken, user.telegramChatId, offlineMsg)
    .then(() => logNotification(userId, account.id, 'offline', offlineMsg, true))
    .catch(err => {
      console.error(`[Alert] Telegram send failed:`, err.message);
      logNotification(userId, account.id, 'offline', offlineMsg, false);
    });
};
