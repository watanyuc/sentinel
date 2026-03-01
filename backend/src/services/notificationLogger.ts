import prisma from '../lib/prisma';

/**
 * Log a notification to the database.
 */
export const logNotification = async (
  userId: string,
  accountId: string | null,
  type: string,
  message: string,
  success: boolean,
): Promise<void> => {
  try {
    await prisma.notificationLog.create({
      data: { userId, accountId, type, message, success },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[NotifLog] Failed to log notification:', msg);
  }
};
