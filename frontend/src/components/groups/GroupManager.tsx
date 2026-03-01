import { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { useUIStore } from '../../stores/uiStore';
import { fetchGroups, createGroup, updateGroupApi, deleteGroupApi } from '../../services/api';
import { Folder, Plus, Pencil, Trash2 } from 'lucide-react';
import type { AccountGroup } from '../../types';

const PRESET_COLORS = [
  '#6b7280', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onGroupsChanged?: () => void;
}

export const GroupManager = ({ open, onClose, onGroupsChanged }: Props) => {
  const { addToast } = useUIStore();
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch {
      addToast({ type: 'error', title: 'Failed to load groups' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const resetForm = () => {
    setEditId(null);
    setName('');
    setColor('#3b82f6');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editId) {
        await updateGroupApi(editId, { name: name.trim(), color });
        addToast({ type: 'success', title: 'Group updated' });
      } else {
        await createGroup(name.trim(), color);
        addToast({ type: 'success', title: 'Group created' });
      }
      resetForm();
      load();
      onGroupsChanged?.();
    } catch {
      addToast({ type: 'error', title: 'Failed to save group' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGroupApi(id);
      addToast({ type: 'info', title: 'Group deleted' });
      load();
      onGroupsChanged?.();
    } catch {
      addToast({ type: 'error', title: 'Failed to delete group' });
    }
  };

  const startEdit = (g: AccountGroup) => {
    setEditId(g.id);
    setName(g.name);
    setColor(g.color);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Manage Account Groups">
      <div className="space-y-4">
        {/* Form */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Group name..."
            className="flex-1 bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className={`btn-primary text-xs px-3 py-2 ${!name.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {editId ? <Pencil size={14} /> : <Plus size={14} />}
            <span className="ml-1">{editId ? 'Update' : 'Add'}</span>
          </button>
          {editId && (
            <button onClick={resetForm} className="btn-ghost text-xs px-2 py-2">Cancel</button>
          )}
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 mr-1">Color:</span>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                color === c ? 'border-white scale-110' : 'border-transparent hover:border-gray-500'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Groups list */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {loading && <p className="text-xs text-gray-500 text-center py-4">Loading...</p>}
          {!loading && groups.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No groups yet. Create one above.</p>
          )}
          {groups.map(g => (
            <div
              key={g.id}
              className="flex items-center justify-between bg-bg-primary border border-gray-800 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                <Folder size={14} className="text-gray-500" />
                <span className="text-sm text-white">{g.name}</span>
                <span className="text-[10px] text-gray-500">
                  {g._count?.accounts ?? 0} accounts
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(g)}
                  className="p-1 text-gray-500 hover:text-accent-blue transition-colors"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="p-1 text-gray-500 hover:text-danger transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
};
