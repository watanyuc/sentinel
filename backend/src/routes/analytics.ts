import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getEquityHistory } from '../services/equityService';
import { getTradeHistory } from '../services/tradeHistoryService';
import { getDailyPnL, getPerformanceMetrics } from '../services/analyticsService';

const router = Router();

router.use(authMiddleware);

// GET /api/analytics/equity/:accountId?timeframe=1D|1W|1M|3M
router.get('/equity/:accountId', async (req: AuthRequest, res: Response) => {
  const accountId = Array.isArray(req.params.accountId)
    ? req.params.accountId[0]
    : req.params.accountId;
  const timeframe = (req.query.timeframe as string) || '1M';

  if (!['1D', '1W', '1M', '3M'].includes(timeframe)) {
    res.status(400).json({ error: 'Invalid timeframe. Use 1D, 1W, 1M, or 3M.' });
    return;
  }

  const snapshots = await getEquityHistory(
    accountId,
    timeframe as '1D' | '1W' | '1M' | '3M',
  );
  res.json(snapshots);
});

// GET /api/analytics/trades?accountId=&page=&limit=&symbol=&type=&sortBy=&sortDir=
router.get('/trades', async (req: AuthRequest, res: Response) => {
  const { accountId, page, limit, symbol, type, sortBy, sortDir } = req.query as Record<string, string>;

  const result = await getTradeHistory(req.user!.id, accountId || undefined, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    symbol: symbol || undefined,
    type: type || undefined,
    sortBy: sortBy || undefined,
    sortDir: (sortDir as 'asc' | 'desc') || undefined,
  });

  res.json(result);
});

// GET /api/analytics/pnl?accountId=&period=1M|3M|6M
router.get('/pnl', async (req: AuthRequest, res: Response) => {
  const accountId = req.query.accountId as string | undefined;
  const period = (req.query.period as string) || '3M';

  if (!['1M', '3M', '6M'].includes(period)) {
    res.status(400).json({ error: 'Invalid period. Use 1M, 3M, or 6M.' });
    return;
  }

  const pnl = await getDailyPnL(
    req.user!.id,
    accountId || undefined,
    period as '1M' | '3M' | '6M',
  );
  res.json(pnl);
});

// GET /api/analytics/performance?accountId=
router.get('/performance', async (req: AuthRequest, res: Response) => {
  const accountId = req.query.accountId as string | undefined;
  const metrics = await getPerformanceMetrics(req.user!.id, accountId || undefined);
  res.json(metrics);
});

export default router;
