import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getGroups, createGroup, updateGroup, deleteGroup, assignAccountToGroup } from '../services/groupService';
import { logAudit } from '../services/auditLogger';
import { runtimeStore } from '../services/runtimeStore';
import { broadcastToUser } from '../websocket/broadcaster';
import prisma from '../lib/prisma';

const router = Router();

router.use(authMiddleware);

// GET /api/groups
router.get('/', async (req: AuthRequest, res: Response) => {
  const groups = await getGroups(req.user!.id);
  res.json(groups);
});

// POST /api/groups
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, color } = req.body as { name: string; color?: string };
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const group = await createGroup(req.user!.id, name, color || '#6b7280');
  logAudit(req.user!.id, 'create_group', 'group', group.id, JSON.stringify({ name }));
  res.status(201).json(group);
});

// PATCH /api/groups/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, color } = req.body as { name?: string; color?: string };

  // Verify group belongs to this user
  const existing = await prisma.accountGroup.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!existing) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const updated = await updateGroup(id, { name, color });
  logAudit(req.user!.id, 'update_group', 'group', id, JSON.stringify({ name, color }));
  res.json(updated);
});

// DELETE /api/groups/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const existing = await prisma.accountGroup.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!existing) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  await deleteGroup(id);
  logAudit(req.user!.id, 'delete_group', 'group', id, JSON.stringify({ name: existing.name }));
  res.json({ message: 'Group deleted' });
});

// PATCH /api/groups/assign/:accountId — assign account to a group
router.patch('/assign/:accountId', async (req: AuthRequest, res: Response) => {
  const accountId = Array.isArray(req.params.accountId)
    ? req.params.accountId[0]
    : req.params.accountId;
  const { groupId } = req.body as { groupId: string | null };

  // Verify account belongs to this user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: req.user!.id },
  });
  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  // If groupId provided, verify group belongs to user
  if (groupId) {
    const group = await prisma.accountGroup.findFirst({
      where: { id: groupId, userId: req.user!.id },
    });
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
  }

  await assignAccountToGroup(accountId, groupId);

  // Look up group name/color for runtime update
  let groupName: string | undefined;
  let groupColor: string | undefined;
  if (groupId) {
    const grp = await prisma.accountGroup.findUnique({ where: { id: groupId } });
    groupName = grp?.name;
    groupColor = grp?.color;
  }

  // Sync runtime store so WebSocket broadcasts include the group info immediately
  runtimeStore.setAccountGroup(req.user!.id, accountId, groupId, groupName, groupColor);
  broadcastToUser(req.user!.id, runtimeStore.getAccountsByUser(req.user!.id));

  logAudit(req.user!.id, 'assign_group', 'account', accountId,
    JSON.stringify({ groupId, groupName: groupName ?? null }));

  res.json({ accountId, groupId, groupName, groupColor });
});

export default router;
