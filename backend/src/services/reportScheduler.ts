import prisma from '../lib/prisma';
import { sendTelegramMessage, escapeHtml } from './telegramService';
import { logNotification } from './notificationLogger';
import { getDailyPnL, getPerformanceMetrics } from './analyticsService';
import { runtimeStore } from './runtimeStore';
import { decrypt } from '../lib/encryption';

// Track last sent date per user to prevent double-sending
const lastSent = new Map<string, string>();

let intervalId: NodeJS.Timeout | null = null;

// All scheduler time logic uses Thai timezone (GMT+7)
// VPS runs UTC — user configures report time in Thai time
const REPORT_TZ = 'Asia/Bangkok';

/** Returns date/time parts in Thai timezone */
const getThaiParts = (): Record<string, string> => {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: REPORT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'long',
  }).formatToParts(new Date()).forEach(p => { parts[p.type] = p.value; });
  return parts;
};

/** Current time as HH:MM in Thai timezone — matched against user's reportTime setting */
const getCurrentHHMM = (): string => {
  const p = getThaiParts();
  const hh = p.hour === '24' ? '00' : p.hour;
  return `${hh}:${p.minute}`;
};

/** Day of week 1=Mon..7=Sun in Thai timezone */
const getCurrentDayOfWeek = (): number => {
  const p = getThaiParts();
  const map: Record<string, number> = {
    Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
    Friday: 5, Saturday: 6, Sunday: 7,
  };
  return map[p.weekday] ?? 1;
};

/** Today's date key YYYY-MM-DD in Thai timezone (avoids UTC day-boundary mismatch) */
const getTodayKey = (): string => {
  const p = getThaiParts();
  return `${p.year}-${p.month}-${p.day}`;
};

const composeReport = async (userId: string): Promise<string> => {
  const accounts = runtimeStore.getAccountsByUser(userId);

  // Overall stats
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalEquity = accounts.reduce((s, a) => s + a.equity, 0);
  const totalProfit = accounts.reduce((s, a) => s + a.profit, 0);
  const online = accounts.filter(a => a.status === 'online').length;

  // Daily P&L (last 1 month)
  const pnl = await getDailyPnL(userId, undefined, '1M');
  const todayPnL = pnl.find(p => p.date === getTodayKey());

  // Performance metrics
  const metrics = await getPerformanceMetrics(userId);

  let msg = `[SENTINEL]\n📊 <b>DAILY REPORT</b>\n\n`;
  msg += `📅 ${new Date().toLocaleDateString('en-US', { timeZone: REPORT_TZ, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

  msg += `<b>Portfolio Summary</b>\n`;
  msg += `Balance: <b>$${totalBalance.toFixed(2)}</b>\n`;
  msg += `Equity: <b>$${totalEquity.toFixed(2)}</b>\n`;
  msg += `Open P/L: <b>${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}</b>\n`;
  msg += `Accounts: ${online}/${accounts.length} online\n\n`;

  if (todayPnL) {
    msg += `<b>Today's Closed Trades</b>\n`;
    msg += `P/L: <b>${todayPnL.profit >= 0 ? '+' : ''}$${todayPnL.profit.toFixed(2)}</b> (${todayPnL.trades} trades)\n\n`;
  }

  if (metrics.totalTrades > 0) {
    msg += `<b>Performance</b>\n`;
    msg += `Win Rate: ${metrics.winRate}% | PF: ${metrics.profitFactor}\n`;
    msg += `Total Trades: ${metrics.totalTrades}\n`;
  }

  // Per-account summary
  if (accounts.length > 0 && accounts.length <= 10) {
    msg += `\n<b>Accounts</b>\n`;
    for (const a of accounts) {
      const status = a.status === 'online' ? '🟢' : '⚫';
      const safeName = escapeHtml(a.name);
      msg += `${status} ${safeName}: $${a.equity.toFixed(2)} (DD: ${a.drawdown.toFixed(1)}%)\n`;
    }
  }

  return msg;
};

const checkAndSend = async (): Promise<void> => {
  const currentTime = getCurrentHHMM();
  const currentDay = getCurrentDayOfWeek();
  const todayKey = getTodayKey();

  // Find users with report enabled whose time matches
  const users = await prisma.user.findMany({
    where: {
      reportEnabled: true,
      reportTime: currentTime,
      telegramBotToken: { not: null },
      telegramChatId: { not: null },
    },
    select: {
      id: true,
      reportFrequency: true,
      reportDay: true,
      telegramBotToken: true,
      telegramChatId: true,
    },
  });

  for (const user of users) {
    // Skip if already sent today
    if (lastSent.get(user.id) === todayKey) continue;

    // Check frequency
    if (user.reportFrequency === 'weekly' && currentDay !== user.reportDay) continue;

    // Mark as sent for today
    lastSent.set(user.id, todayKey);

    try {
      const report = await composeReport(user.id);
      await sendTelegramMessage(decrypt(user.telegramBotToken!), user.telegramChatId!, report);
      await logNotification(user.id, null, 'report', report, true);
      console.log(`[Report] Sent ${user.reportFrequency} report to user ${user.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      console.error(`[Report] Failed to send to user ${user.id}:`, msg);
      await logNotification(user.id, null, 'report', 'Report send failed', false);
    }
  }
};

/**
 * Send a report immediately for a specific user (for testing).
 */
export const sendReportNow = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramBotToken: true, telegramChatId: true },
  });

  if (!user?.telegramBotToken || !user?.telegramChatId) {
    throw new Error('Telegram not configured');
  }

  const report = await composeReport(userId);
  await sendTelegramMessage(decrypt(user.telegramBotToken), user.telegramChatId, report);
  await logNotification(userId, null, 'report', report, true);
};

export const reportScheduler = {
  start(): void {
    if (intervalId) return;
    // Check every 60 seconds
    intervalId = setInterval(() => {
      checkAndSend().catch(err => console.error('[Report] Scheduler error:', err.message));
    }, 60_000);
    console.log('[Report] Scheduler started (checking every 60s)');
  },

  stop(): void {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },
};
