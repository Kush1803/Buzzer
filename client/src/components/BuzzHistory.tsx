import type { BuzzEvent } from '../types';
import { Clock, Zap } from 'lucide-react';

interface Props {
  events: BuzzEvent[];
  maxItems?: number;
  title?: string;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatResponseTime(ms: number | null) {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function BuzzHistory({ events, maxItems = 50 }: Props) {
  const display = events.slice(0, maxItems);

  if (display.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        <Zap size={28} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No buzzes yet this session</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-1.5">
        {display.map((event, i) => (
          <div
            key={event.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm slide-in"
            style={{
              background: event.isFirst
                ? `linear-gradient(135deg, ${event.teamColor}20, ${event.teamColor}08)`
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${event.isFirst ? event.teamColor + '40' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            {/* Position badge */}
            <div
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
              style={{
                backgroundColor: event.isFirst ? event.teamColor : 'rgba(255,255,255,0.08)',
                color: event.isFirst ? '#000' : 'var(--text-muted)',
              }}
            >
              {i + 1}
            </div>

            {/* Color dot */}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.teamColor }}
            />

            {/* Team name */}
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-[var(--text-primary)] truncate">
                {event.teamName}
              </span>
              {event.isFirst && (
                <span className="ml-2 text-xs font-bold text-yellow-400">🥇 FIRST!</span>
              )}
            </div>

            {/* Response time */}
            <div className="flex items-center gap-1 text-xs text-emerald-400 flex-shrink-0">
              <Zap size={11} />
              <span>{formatResponseTime(event.responseTimeMs)}</span>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] flex-shrink-0">
              <Clock size={11} />
              <span>{formatTime(event.timestamp)}</span>
            </div>

            {/* Round badge */}
            <div className="text-xs text-[var(--text-muted)] bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0">
              R{event.roundNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
