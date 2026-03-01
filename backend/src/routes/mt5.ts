import { Router, Request, Response } from 'express';
import { receiveMT5Push } from '../controllers/mt5Controller';

const router = Router();

// No JWT auth here — EA uses API key in body instead
router.post('/push', (req: Request, res: Response) => {
  receiveMT5Push(req, res);
});

export default router;
