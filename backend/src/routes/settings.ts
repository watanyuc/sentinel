import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditLogger';
import { sendReportNow } from '../services/reportScheduler';
import prisma from '../lib/prisma';

const router = Router();

router.use(authMiddleware);

// --- Report Settings ---

// GET /api/settings/report
router.get('/report', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      reportEnabled: true,
      reportFrequency: true,
      reportTime: true,
      reportDay: true,
    },
  });
  res.json(user);
});

// PATCH /api/settings/report
router.patch('/report', async (req: AuthRequest, res: Response) => {
  const { reportEnabled, reportFrequency, reportTime, reportDay } = req.body as {
    reportEnabled?: boolean;
    reportFrequency?: string;
    reportTime?: string;
    reportDay?: number;
  };

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(reportEnabled !== undefined && { reportEnabled }),
      ...(reportFrequency && { reportFrequency }),
      ...(reportTime && { reportTime }),
      ...(reportDay !== undefined && { reportDay }),
    },
    select: {
      reportEnabled: true,
      reportFrequency: true,
      reportTime: true,
      reportDay: true,
    },
  });

  logAudit(req.user!.id, 'update_report_settings', 'settings', undefined,
    JSON.stringify(updated));

  res.json(updated);
});

// POST /api/settings/report/send-now
router.post('/report/send-now', async (req: AuthRequest, res: Response) => {
  try {
    await sendReportNow(req.user!.id);
    res.json({ ok: true, message: 'Report sent' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    res.status(400).json({ error: msg });
  }
});

// --- Preferences ---

// GET /api/settings/preferences
router.get('/preferences', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { language: true, theme: true },
  });
  res.json(user);
});

// PATCH /api/settings/preferences
router.patch('/preferences', async (req: AuthRequest, res: Response) => {
  const { language, theme } = req.body as { language?: string; theme?: string };

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(language && { language }),
      ...(theme && { theme }),
    },
    select: { language: true, theme: true },
  });

  res.json(updated);
});

// --- Drawdown Protection (per account) ---

// GET /api/settings/protection/:accountId
router.get('/protection/:accountId', async (req: AuthRequest, res: Response) => {
  const accountId = Array.isArray(req.params.accountId)
    ? req.params.accountId[0]
    : req.params.accountId;

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: req.user!.id },
    select: { id: true, protectionEnabled: true, protectionDrawdown: true },
  });

  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  res.json(account);
});

// PATCH /api/settings/protection/:accountId
router.patch('/protection/:accountId', async (req: AuthRequest, res: Response) => {
  const accountId = Array.isArray(req.params.accountId)
    ? req.params.accountId[0]
    : req.params.accountId;

  const { protectionEnabled, protectionDrawdown } = req.body as {
    protectionEnabled?: boolean;
    protectionDrawdown?: number | null;
  };

  const existing = await prisma.account.findFirst({
    where: { id: accountId, userId: req.user!.id },
  });

  if (!existing) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  const updated = await prisma.account.update({
    where: { id: accountId },
    data: {
      ...(protectionEnabled !== undefined && { protectionEnabled }),
      ...(protectionDrawdown !== undefined && { protectionDrawdown }),
    },
    select: { id: true, protectionEnabled: true, protectionDrawdown: true },
  });

  logAudit(req.user!.id, 'update_protection', 'account', accountId,
    JSON.stringify(updated));

  res.json(updated);
});

export default router;
