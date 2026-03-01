import prisma from '../lib/prisma';
import { sendTelegramMessage, escapeHtml } from './telegramService';
import { logNotification } from './notificationLogger';
import { decrypt } from '../lib/encryption';

/**
 * Send Telegram notification that CLOSE_ALL was dispatched to the EA.
 */
export const sendCloseAllNotification = async (
  userId: string,
  accountName: string,
  orderCount: number,
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramBotToken: true, telegramChatId: true },
  });

  if (!user?.telegramBotToken || !user?.telegramChatId) return;

  const botToken = decrypt(user.telegramBotToken);
  const safeName = escapeHtml(accountName);
  const message =
    `[SENTINEL]\n` +
    `🔴 <b>CLOSE ALL DISPATCHED</b>\n\n` +
    `Account: <b>${safeName}</b>\n` +
    `Orders to close: <b>${orderCount}</b>\n` +
    `Command sent to EA — awaiting execution.`;

  try {
    await sendTelegramMessage(botToken, user.telegramChatId, message);
    await logNotification(userId, null, 'close_all', message, true);
  } catch (err) {
    await logNotification(userId, null, 'close_all', message, false);
    throw err;
  }
};
