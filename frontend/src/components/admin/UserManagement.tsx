import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Trash2, ShieldCheck, Shield, Loader2 } from 'lucide-react';
import { fetchUsers, createUser, deleteUser, changeUserRole } from '../../services/api';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { Dialog } from '../ui/Dialog';
import type { UserInfo } from '../../types';

export const UserManagement = () => {
  const { setCurrentPage, addToast } = useUIStore();
  const currentUserId = useAuthStore(s => s.user?.id);
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');

  const { data: users = [], isLoading } = useQuery<UserInfo[]>({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
    staleTime: 10000,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowAddDialog(false);
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewRole('user');
      addToast({ type: 'success', title: 'User created' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user';
      addToast({ type: 'error', title: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteId(null);
      addToast({ type: 'success', title: 'User deleted' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete';
      addToast({ type: 'error', title: msg });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => changeUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      addToast({ type: 'success', title: 'Role updated' });
    },
  });

  const deleteTarget = users.find(u => u.id === deleteId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => setCurrentPage('dashboard')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">User Management</h2>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors"
        >
          <UserPlus size={14} />
          Add User
        </button>
      </div>

      {/* User Table */}
      <div className="bg-bg-secondary border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-center p-4 font-medium">Accounts</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4 text-white">{user.email}</td>
                  <td className="p-4 text-gray-300">{user.name || '-'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        if (user.id === currentUserId) return;
                        roleMutation.mutate({ id: user.id, role: user.role === 'admin' ? 'user' : 'admin' });
                      }}
                      disabled={user.id === currentUserId}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                        user.role === 'admin'
                          ? 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } ${user.id === currentUserId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {user.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {user.role}
                    </button>
                  </td>
                  <td className="p-4 text-center text-gray-300">{user._count.accounts}</td>
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => setDeleteId(user.id)}
                        className="text-gray-500 hover:text-danger transition-colors p-1"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Add New User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email *</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Password * (min 6 chars)</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role</label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAddDialog(false)}
              className="flex-1 px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate({ email: newEmail, password: newPassword, name: newName || undefined, role: newRole })}
              disabled={!newEmail || !newPassword || newPassword.length < 6 || createMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Create User
            </button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to delete <span className="text-white font-medium">{deleteTarget?.email}</span>?
            This will also delete all their accounts ({deleteTarget?._count.accounts || 0} accounts).
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-danger text-white text-sm rounded-lg hover:bg-danger/80 disabled:opacity-50 transition-colors"
            >
              {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete User
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
