import prisma from '../lib/prisma';

const AUDIT_LOG_MAX_DAYS = 365; // 1 year
const NOTIFICATION_LOG_MAX_DAYS = 90; // 3 months

/** Clean audit logs older than 1 year (PDPA data retention) */
export const cleanOldAuditLogs = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - AUDIT_LOG_MAX_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  if (result.count > 0) {
    console.log(`[Retention] Cleaned ${result.count} audit logs older than ${AUDIT_LOG_MAX_DAYS} days`);
  }
  return result.count;
};

/** Clean notification logs older than 90 days (PDPA data retention) */
export const cleanOldNotificationLogs = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - NOTIFICATION_LOG_MAX_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.notificationLog.deleteMany({
    where: { sentAt: { lt: cutoff } },
  });
  if (result.count > 0) {
    console.log(`[Retention] Cleaned ${result.count} notification logs older than ${NOTIFICATION_LOG_MAX_DAYS} days`);
  }
  return result.count;
};
