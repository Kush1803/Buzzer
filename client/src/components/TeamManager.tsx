import { useState } from 'react';
import type { Team } from '../types';

import { Plus, Pencil, Trash2, Check, X, User, Users } from 'lucide-react';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA',
  '#F1948A', '#85C1E9', '#FAD7A0', '#A9CCE3', '#A3E4D7',
  '#F9E79F', '#D2B4DE', '#A9DFBF', '#FADBD8', '#D5DBDB',
];

interface Props {
  teams: Team[];
  onAdd: (name: string, leader: string, color: string) => void;
  onUpdate: (id: string, name: string, leader: string, color: string) => void;
  onRemove: (id: string) => void;
}

interface EditState {
  name: string;
  leader: string;
  color: string;
}

export function TeamManager({ teams, onAdd, onUpdate, onRemove }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: '', leader: '', color: '' });
  const [adding, setAdding] = useState(false);
  const [newTeam, setNewTeam] = useState<EditState>({ name: '', leader: '', color: COLORS[teams.length % COLORS.length] });

  const startEdit = (team: Team) => {
    setEditingId(team.id);
    setEditState({ name: team.name, leader: team.leader, color: team.color });
  };

  const confirmEdit = () => {
    if (editingId && editState.name.trim()) {
      onUpdate(editingId, editState.name.trim(), editState.leader.trim(), editState.color);
      setEditingId(null);
    }
  };

  const confirmAdd = () => {
    if (newTeam.name.trim()) {
      onAdd(newTeam.name.trim(), newTeam.leader.trim(), newTeam.color);
      setAdding(false);
      setNewTeam({ name: '', leader: '', color: COLORS[(teams.length + 1) % COLORS.length] });
    }
  };

  return (
    <div className="space-y-2">
      {/* Team list */}
      {teams.map((team) => (
        <div
          key={team.id}
          className="rounded-xl p-3 transition-all"
          style={{
            background: `linear-gradient(135deg, ${team.color}12, ${team.color}06)`,
            border: `1px solid ${team.color}30`,
          }}
        >
          {editingId === team.id ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                  placeholder="Team name"
                  value={editState.name}
                  onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
                  autoFocus
                />
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                  placeholder="Team leader"
                  value={editState.leader}
                  onChange={(e) => setEditState({ ...editState, leader: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
                />
              </div>
              {/* Color picker */}
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditState({ ...editState, color: c })}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: editState.color === c ? `2px solid white` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors">
                  <X size={12} /> Cancel
                </button>
                <button onClick={confirmEdit} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors">
                  <Check size={12} /> Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color, boxShadow: `0 0 6px ${team.color}80` }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[var(--text-primary)] truncate">{team.name}</div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <User size={10} /> {team.leader || 'No leader set'}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => startEdit(team)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Edit team"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onRemove(team.id)}
                  className="p-1.5 rounded-lg hover:bg-red-400/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  title="Remove team"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add team form */}
      {adding ? (
        <div className="rounded-xl p-3 border border-dashed border-purple-500/40 bg-purple-500/5 space-y-2">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
              placeholder="Team name *"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
              autoFocus
            />
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
              placeholder="Team leader"
              value={newTeam.leader}
              onChange={(e) => setNewTeam({ ...newTeam, leader: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewTeam({ ...newTeam, color: c })}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: newTeam.color === c ? `2px solid white` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors">
              <X size={12} /> Cancel
            </button>
            <button
              onClick={confirmAdd}
              disabled={!newTeam.name.trim()}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={12} /> Add Team
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 hover:border-purple-500/50 text-[var(--text-muted)] hover:text-purple-400 transition-all text-sm font-medium group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          Add Team
        </button>
      )}

      {/* Team count */}
      {teams.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] pt-1">
          <Users size={12} />
          <span>{teams.length} team{teams.length !== 1 ? 's' : ''} • Max 20</span>
        </div>
      )}
    </div>
  );
}
