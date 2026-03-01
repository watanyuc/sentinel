import prisma from '../lib/prisma';

export const getGroups = (userId: string) =>
  prisma.accountGroup.findMany({
    where: { userId },
    include: { _count: { select: { accounts: true } } },
    orderBy: { name: 'asc' },
  });

export const createGroup = (userId: string, name: string, color: string) =>
  prisma.accountGroup.create({
    data: { userId, name, color },
  });

export const updateGroup = (groupId: string, data: { name?: string; color?: string }) =>
  prisma.accountGroup.update({
    where: { id: groupId },
    data,
  });

export const deleteGroup = (groupId: string) =>
  prisma.accountGroup.delete({
    where: { id: groupId },
  });

export const assignAccountToGroup = (accountId: string, groupId: string | null) =>
  prisma.account.update({
    where: { id: accountId },
    data: { groupId },
  });
