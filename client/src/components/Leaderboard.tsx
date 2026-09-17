import { useMemo } from 'react';
import type { Team } from '../types';

import { Trophy, Medal, Star } from 'lucide-react';

interface Props {
  teams: Team[];
  onAdjust?: (teamId: string, delta: number) => void;
  showControls?: boolean;
}

const RANK_ICONS = [
  <Trophy size={18} className="text-yellow-400" />,
  <Medal size={18} className="text-slate-300" />,
  <Star size={18} className="text-amber-600" />,
];

export function Leaderboard({ teams, onAdjust, showControls = false }: Props) {
  const sorted = useMemo(
    () => [...teams].sort((a, b) => b.score - a.score),
    [teams]
  );

  if (teams.length === 0) {
    return (
      <div className="text-center py-10 text-[var(--text-muted)]">
        <Trophy size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No teams yet. Add teams to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((team, idx) => (
        <div
          key={team.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 slide-in"
          style={{
            background: `linear-gradient(135deg, ${team.color}15, ${team.color}08)`,
            borderLeft: `3px solid ${team.color}`,
            border: `1px solid ${team.color}25`,
          }}
        >
          {/* Rank */}
          <div className="w-7 flex items-center justify-center flex-shrink-0">
            {idx < 3 ? RANK_ICONS[idx] : (
              <span className="text-sm font-bold text-[var(--text-muted)]">#{idx + 1}</span>
            )}
          </div>

          {/* Color dot */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: team.color, boxShadow: `0 0 8px ${team.color}80` }}
          />

          {/* Team info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[var(--text-primary)] truncate">{team.name}</div>
            <div className="text-xs text-[var(--text-muted)] truncate">{team.leader}</div>
          </div>

          {/* Lock indicator */}
          {team.isLocked && (
            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
              Locked
            </span>
          )}

          {/* Score + controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {showControls && onAdjust && (
              <button
                onClick={() => onAdjust(team.id, -1)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-400/20 border border-white/10 text-[var(--text-secondary)] hover:text-red-400 transition-colors text-sm font-bold flex items-center justify-center"
                title="Remove 1 point"
              >
                −
              </button>
            )}
            <span
              className="text-xl font-black min-w-[2.5rem] text-center"
              style={{ color: team.color, textShadow: `0 0 12px ${team.color}60` }}
            >
              {team.score}
            </span>
            {showControls && onAdjust && (
              <button
                onClick={() => onAdjust(team.id, 1)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-emerald-400/20 border border-white/10 text-[var(--text-secondary)] hover:text-emerald-400 transition-colors text-sm font-bold flex items-center justify-center"
                title="Add 1 point"
              >
                +
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
