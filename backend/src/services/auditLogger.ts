import prisma from '../lib/prisma';

/**
 * Log an audit event to the database.
 */
export const logAudit = async (
  userId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: string,
  ipAddress?: string,
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, resourceType, resourceId, details, ipAddress },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[Audit] Failed to log:', msg);
  }
};
