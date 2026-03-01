import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { runtimeStore } from '../services/runtimeStore';
import { logAudit } from '../services/auditLogger';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/users
router.get('/users', async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true, createdAt: true,
      _count: { select: { accounts: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

// POST /api/admin/users
router.post('/users', async (req: AuthRequest, res: Response) => {
  const { email, password, name, role } = req.body as {
    email: string; password: string; name?: string; role?: string;
  };
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name: name || null, role: role || 'user' },
  });

  logAudit(req.user!.id, 'create_user', 'user', user.id,
    JSON.stringify({ email, role: role || 'user' }));

  res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (id === req.user!.id) {
    res.status(400).json({ error: 'Cannot delete yourself' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await prisma.user.delete({ where: { id } });
  runtimeStore.removeUserAccounts(id);

  logAudit(req.user!.id, 'delete_user', 'user', id,
    JSON.stringify({ email: user.email }));

  res.json({ message: 'User deleted' });
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req: AuthRequest, res: Response) => {
  const { role } = req.body as { role: string };
  if (!role || !['admin', 'user'].includes(role)) {
    res.status(400).json({ error: 'Role must be "admin" or "user"' });
    return;
  }

  const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = await prisma.user.findUnique({ where: { id: paramId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: paramId },
    data: { role },
  });

  logAudit(req.user!.id, 'change_role', 'user', paramId,
    JSON.stringify({ email: user.email, oldRole: user.role, newRole: role }));

  res.json({ id: updated.id, email: updated.email, role: updated.role });
});

export default router;
