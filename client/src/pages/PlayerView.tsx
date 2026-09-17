import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { useGame } from '../hooks/useGame';
import { ConnectionStatus } from '../components/ConnectionStatus';
import type { Team } from '../types';
import { Users, AlertTriangle, Trophy } from 'lucide-react';

// ── Team selector ─────────────────────────────────────────────────────────────
interface TeamSelectorProps {
  teams: Team[];
  onSelect: (team: Team) => void;
  gameId: string;
}

function TeamSelector({ teams, onSelect, gameId }: TeamSelectorProps) {
  if (teams.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="text-5xl">⏳</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Waiting for teams…</h2>
        <p className="text-sm text-[var(--text-muted)]">The host hasn't added any teams yet.</p>
        <div className="text-xs bg-white/5 border border-white/10 px-3 py-2 rounded-lg font-mono text-[var(--text-muted)]">
          Game: {gameId}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">🏆</div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Select Your Team</h1>
          <p className="text-sm text-[var(--text-muted)]">Game · {gameId}</p>
        </div>
        <div className="space-y-2">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => onSelect(team)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${team.color}18, ${team.color}08)`,
                borderColor: `${team.color}40`,
              }}
            >
              <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: team.color, boxShadow: `0 0 16px ${team.color}80` }} />
              <div className="text-left">
                <div className="font-bold text-[var(--text-primary)]">{team.name}</div>
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <Users size={10} /> {team.leader || 'No leader set'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { sound } from '../utils/sound';

// ── Main PlayerView ────────────────────────────────────────────────────────────
export function PlayerView() {
  const { gameId } = useParams<{ gameId: string }>();
  
  // Persist selected team in localStorage so players stay locked to their assigned team
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(() => {
    if (!gameId) return null;
    const saved = localStorage.getItem(`buzzer_team_${gameId}`);
    return saved ? { id: saved } as Team : null;
  });

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    if (gameId) {
      localStorage.setItem(`buzzer_team_${gameId}`, team.id);
    }
  };

  const [pressed, setPressed] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [scoreFlash, setScoreFlash] = useState(false);
  const lastBuzzRef = useRef(0);
  const prevScoreRef = useRef<number | null>(null);

  const {
    game, status,
    lastBuzzResult,
    buzz,
  } = useGame({
    gameId,
    role: 'player',
    teamId: selectedTeam?.id,
  });

  // Sync selected team data from live game state
  const liveTeam = game?.teams.find((t) => t.id === selectedTeam?.id) ?? null;

  // Flash score when it changes
  useEffect(() => {
    if (!liveTeam) return;
    if (prevScoreRef.current !== null && liveTeam.score !== prevScoreRef.current) {
      setScoreFlash(true);
      setTimeout(() => setScoreFlash(false), 500);
    }
    prevScoreRef.current = liveTeam.score;
  }, [liveTeam?.score]);

  // Handle buzz result
  useEffect(() => {
    if (!lastBuzzResult) return;
    if (lastBuzzResult.accepted) {
      setPressed(true);
      setShowRipple(true);
      sound.playBuzz();
      setTimeout(() => setShowRipple(false), 800);
    }
  }, [lastBuzzResult]);

  // Reset pressed state on round changes
  useEffect(() => {
    if (!game) return;
    if (game.currentRound.status === 'active') {
      setPressed(false);
      setFeedbackMsg(null);
    }
  }, [game?.currentRound.number, game?.currentRound.status]);

  const handleBuzz = useCallback((e?: React.SyntheticEvent) => {
    if (e && e.type === 'touchstart') {
      // Prevent subsequent click event from double firing
      e.preventDefault();
    }
    const now = Date.now();
    if (now - lastBuzzRef.current < 300) return; // 300ms debounce
    lastBuzzRef.current = now;

    if (!game || !liveTeam) return;

    const round = game.currentRound;

    if (round.status !== 'active') {
      sound.playError();
      setFeedbackMsg('Round is not active yet!');
      setTimeout(() => setFeedbackMsg(null), 2000);
      return;
    }

    if (liveTeam.isLocked) {
      sound.playError();
      setFeedbackMsg(round.lockAfterFirst && round.buzzEvents.length > 0
        ? '🔒 Another team buzzed first!'
        : '🔒 You already buzzed!');
      setTimeout(() => setFeedbackMsg(null), 2000);
      return;
    }

    buzz();
  }, [game, liveTeam, buzz]);

  if (!game) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[var(--text-secondary)] text-sm">Connecting…</p>
          {status === 'disconnected' && (
            <p className="text-red-400 text-xs">Cannot connect. Is the server running?</p>
          )}
        </div>
      </div>
    );
  }

  if (!selectedTeam) {
    return (
      <div className="min-h-dvh flex flex-col justify-between relative">
        <div className="absolute top-3 right-4 z-10">
          <ConnectionStatus status={status} />
        </div>
        <TeamSelector teams={game.teams} onSelect={handleSelectTeam} gameId={game.id} />
      </div>
    );
  }

  if (!liveTeam) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 text-center space-y-3">
        <AlertTriangle size={28} className="text-yellow-400 mx-auto" />
        <p className="text-[var(--text-primary)]">Your team was removed or updated by the host.</p>
        <p className="text-xs text-[var(--text-muted)]">Ask your host to re-add your team.</p>
      </div>
    );
  }

  const round = game.currentRound;
  const isActive = round.status === 'active';
  const isLocked = liveTeam.isLocked;
  const buzzedFirst = round.buzzEvents[0]?.teamId === liveTeam.id;

  // Determine buzzer state
  const buzzerDisabled = !isActive || isLocked;

  const statusText = () => {
    if (!isActive) return round.status === 'idle' ? 'Waiting for round to start…' : 'Round stopped';
    if (isLocked) {
      if (buzzedFirst) return '✅ YOU BUZZED FIRST!';
      return '🔒 LOCKED OUT THIS ROUND';
    }
    return '⚡ TAP TO BUZZ!';
  };

  const statusColor = () => {
    if (!isActive) return 'var(--text-muted)';
    if (isLocked && buzzedFirst) return '#10b981';
    if (isLocked) return '#ef4444';
    return liveTeam.color;
  };

  return (
    <div
      className="h-dvh w-full max-w-md mx-auto flex flex-col justify-between select-none touch-none overflow-hidden"
      style={{ background: `radial-gradient(ellipse at center, ${liveTeam.color}15 0%, var(--bg-primary) 75%)` }}
    >
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
          <span>GAME</span>
          <span className="text-purple-400 font-bold">{game.id}</span>
        </div>

        <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: liveTeam.color, boxShadow: `0 0 8px ${liveTeam.color}` }} />
          <span className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[120px]">{liveTeam.name}</span>
        </div>

        <ConnectionStatus status={status} />
      </header>

      {/* Team Score Header */}
      <div className="text-center shrink-0 py-1">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
          <Trophy size={11} /> Team Score
        </div>
        <div
          className={`text-5xl font-black tracking-tight ${scoreFlash ? 'score-flash' : ''}`}
          style={{ color: liveTeam.color, textShadow: `0 0 24px ${liveTeam.color}70` }}
        >
          {liveTeam.score}
        </div>
      </div>

      {/* Main Interactive Center Section */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 my-auto min-h-0">

        {/* Status text pill */}
        <div
          className="text-center text-xs font-black px-4 py-1.5 rounded-full border transition-all uppercase tracking-wider shrink-0"
          style={{
            color: statusColor(),
            background: `${statusColor()}18`,
            borderColor: `${statusColor()}35`,
          }}
        >
          {statusText()}
        </div>

        {/* Instant Touch Buzzer Button */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Pulsing outer ring when round active */}
          {isActive && !isLocked && (
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-25 pointer-events-none"
              style={{ backgroundColor: liveTeam.color, transform: 'scale(1.12)' }}
            />
          )}

          {/* Touch Ripple visual feedback */}
          {showRipple && (
            <div
              className="buzzer-ripple"
              style={{ backgroundColor: liveTeam.color }}
            />
          )}

          <button
            id="buzz-btn"
            onTouchStart={handleBuzz}
            onClick={handleBuzz}
            disabled={buzzerDisabled}
            className={`buzzer-btn ${pressed ? 'pressed' : ''}`}
            style={{
              background: buzzerDisabled
                ? `radial-gradient(circle at 35% 35%, ${liveTeam.color}40, ${liveTeam.color}20)`
                : `radial-gradient(circle at 35% 35%, ${liveTeam.color}ff, ${liveTeam.color}bb)`,
              boxShadow: buzzerDisabled
                ? `0 6px 24px ${liveTeam.color}20, inset 0 2px 4px rgba(255,255,255,0.1)`
                : `0 8px 48px ${liveTeam.color}80, 0 0 80px ${liveTeam.color}30, inset 0 2px 8px rgba(255,255,255,0.25)`,
            }}
            aria-label="Buzz!"
          >
            {isLocked && buzzedFirst ? '✅' : isLocked ? '🔒' : '⚡'}
          </button>
        </div>

        {/* Feedback alert message */}
        {feedbackMsg && (
          <div className="text-xs font-bold text-yellow-300 bg-yellow-400/15 border border-yellow-400/30 px-4 py-1.5 rounded-xl fade-in shrink-0">
            {feedbackMsg}
          </div>
        )}

        {/* Round metadata pill */}
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] shrink-0 bg-white/5 px-3 py-1 rounded-full border border-white/5">
          <span>Round {round.number}</span>
          <span>·</span>
          <span className={`font-semibold ${isActive ? 'text-emerald-400' : ''}`}>
            {isActive ? '🟢 LIVE' : '⚪ Idle'}
          </span>
          {round.lockAfterFirst && <span>· 🔒 Lock-1st</span>}
        </div>
      </div>

      {/* Bottom Horizontal Scores Bar */}
      {game.teams.length > 1 && (
        <div className="px-3 pb-3 shrink-0">
          <div className="glass-card p-2.5">
            <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase font-bold tracking-wider flex items-center justify-between">
              <span>Leaderboard</span>
              <span className="text-[9px] font-normal text-[var(--text-muted)]">Live</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              {[...game.teams]
                .sort((a, b) => b.score - a.score)
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex-shrink-0 flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all"
                    style={{
                      background: `${t.color}15`,
                      border: `1px solid ${t.id === liveTeam.id ? t.color : t.color + '30'}`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <div className="text-[11px] font-medium text-[var(--text-primary)] truncate max-w-[4.5rem]">{t.name}</div>
                    <div className="text-xs font-black text-white ml-0.5">{t.score}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Offline banner */}
      {status === 'disconnected' && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-500/90 backdrop-blur-sm text-white text-xs text-center py-2 font-medium z-50">
          ⚠️ Disconnected — reconnecting…
        </div>
      )}
    </div>
  );
}
