import prisma from '../lib/prisma';
import { commandQueue } from './commandQueue';
import { sendTelegramMessage, escapeHtml } from './telegramService';
import { logNotification } from './notificationLogger';
import { logAudit } from './auditLogger';
import { decrypt } from '../lib/encryption';
import type { Account } from '../mock/data';

// Cooldown: 30 minutes per account to avoid repeated triggers
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 30 * 60 * 1000;

const isOnCooldown = (accountId: string): boolean => {
  const last = cooldowns.get(accountId);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
};

/**
 * Check drawdown protection for a user's accounts.
 * If drawdown exceeds threshold → auto enqueue CLOSE_ALL.
 * Called from broadcaster.ts (simulation) and mt5Controller.ts (real push).
 */
export const checkDrawdownProtection = async (
  userId: string,
  accounts: Account[],
): Promise<void> => {
  if (accounts.length === 0) return;

  // Only check online accounts
  const onlineIds = accounts.filter(a => a.status === 'online').map(a => a.id);
  if (onlineIds.length === 0) return;

  // Fetch protection settings for these accounts
  const dbAccounts = await prisma.account.findMany({
    where: {
      userId,
      id: { in: onlineIds },
      protectionEnabled: true,
      protectionDrawdown: { not: null },
    },
    select: {
      id: true,
      apiKey: true,
      name: true,
      protectionDrawdown: true,
    },
  });

  if (dbAccounts.length === 0) return;

  // Fetch user Telegram credentials
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramBotToken: true, telegramChatId: true },
  });

  for (const dbAcc of dbAccounts) {
    const runtimeAcc = accounts.find(a => a.id === dbAcc.id);
    if (!runtimeAcc) continue;
    if (dbAcc.protectionDrawdown === null) continue;
    if (runtimeAcc.drawdown < dbAcc.protectionDrawdown) continue;
    if (isOnCooldown(dbAcc.id)) continue;

    // TRIGGER: Drawdown exceeded threshold
    cooldowns.set(dbAcc.id, Date.now());

    // Enqueue close all command
    commandQueue.enqueue(dbAcc.apiKey, {
      type: 'CLOSE_ALL',
      accountId: dbAcc.id,
      userId,
    });

    console.log(`[Protection] Triggered CLOSE_ALL for ${dbAcc.name} (DD: ${runtimeAcc.drawdown.toFixed(2)}% >= ${dbAcc.protectionDrawdown}%)`);

    // Audit log
    logAudit(userId, 'protection_triggered', 'account', dbAcc.id,
      JSON.stringify({ drawdown: runtimeAcc.drawdown, threshold: dbAcc.protectionDrawdown }));

    // Telegram notification
    if (user?.telegramBotToken && user?.telegramChatId) {
      const safeName = escapeHtml(dbAcc.name);
      const msg =
        `[SENTINEL]\n` +
        `⛔ <b>DRAWDOWN PROTECTION TRIGGERED</b>\n\n` +
        `Account: <b>${safeName}</b>\n` +
        `Drawdown: <b>${runtimeAcc.drawdown.toFixed(2)}%</b> (threshold: ${dbAcc.protectionDrawdown}%)\n` +
        `Equity: $${runtimeAcc.equity.toFixed(2)}\n\n` +
        `<b>CLOSE ALL command has been queued automatically.</b>`;

      sendTelegramMessage(decrypt(user.telegramBotToken), user.telegramChatId, msg)
        .then(() => logNotification(userId, dbAcc.id, 'protection', msg, true))
        .catch(err => {
          console.error('[Protection] Telegram send failed:', err.message);
          logNotification(userId, dbAcc.id, 'protection', msg, false);
        });
    }
  }
};
