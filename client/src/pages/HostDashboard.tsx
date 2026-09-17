import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Leaderboard } from '../components/Leaderboard';
import { BuzzHistory } from '../components/BuzzHistory';
import { TeamManager } from '../components/TeamManager';
import { QRCodePanel } from '../components/QRCodePanel';
import {
  Play, Square, RotateCcw, AlertTriangle, Lock, Unlock,
  LayoutDashboard, Users, History, QrCode, Trophy, RefreshCw
} from 'lucide-react';

import { sound } from '../utils/sound';

type Tab = 'dashboard' | 'teams' | 'history' | 'share';

export function HostDashboard() {
  const { gameId } = useParams<{ gameId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [lockAfterFirst, setLockAfterFirst] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const prevBuzzCount = useRef(0);

  const {
    game, status,
    startRound, stopRound, resetRound, resetGame,
    adjustScore, addTeam, updateTeam, removeTeam,
  } = useGame({ gameId, role: 'host' });

  // Play host alert sound on new buzzes
  useEffect(() => {
    if (!game) return;
    const currentCount = game.currentRound.buzzEvents.length;
    if (currentCount > prevBuzzCount.current) {
      sound.playHostAlert();
    }
    prevBuzzCount.current = currentCount;
  }, [game?.currentRound.buzzEvents.length]);

  if (!game) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[var(--text-secondary)] text-sm">Connecting to game…</p>
          {status === 'disconnected' && (
            <p className="text-red-400 text-xs">Connection failed. Is the server running?</p>
          )}
        </div>
      </div>
    );
  }

  const round = game.currentRound;
  const isActive = round.status === 'active';
  const firstBuzz = round.buzzEvents[0];

  const tabs: { id: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { id: 'teams', icon: <Users size={16} />, label: 'Teams', badge: game.teams.length },
    { id: 'history', icon: <History size={16} />, label: 'History', badge: game.buzzHistory.length || undefined },
    { id: 'share', icon: <QrCode size={16} />, label: 'Share' },
  ];

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] backdrop-blur-xl"
        style={{ background: 'rgba(10,10,15,0.85)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-teal-300">
              ⚡ BuzzerZ
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-[var(--text-muted)]">
              <span>GAME</span>
              <span className="text-purple-400 font-bold">{game.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Round status pill */}
            <div className={`flex items-center gap-2 text-xs font-medium px-3.5 py-1.5 rounded-full border ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 glow-ring-green'
                : 'bg-white/5 text-[var(--text-muted)] border-white/10'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 pulse-dot' : 'bg-gray-500'}`} />
              Round {round.number} · {isActive ? 'LIVE' : 'Idle'}
            </div>
            <ConnectionStatus status={status} />
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded-full">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* ── Dashboard Tab ── */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left col: Controls + Current buzz (5 columns) */}
            <div className="lg:col-span-5 space-y-5">

              {/* Round controls */}
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                    <Play size={16} className="text-purple-400" /> Round Control
                  </h2>
                  <span className="text-xs font-mono text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    Round #{round.number}
                  </span>
                </div>

                {/* Lock after first toggle */}
                <div 
                  onClick={() => setLockAfterFirst(!lockAfterFirst)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] cursor-pointer transition-all select-none gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${lockAfterFirst ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-[var(--text-muted)]'}`}>
                      {lockAfterFirst ? <Lock size={15} /> : <Unlock size={15} />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        Lock after first buzz
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {lockAfterFirst ? 'Only first team can answer' : 'All teams can buzz'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={lockAfterFirst}
                    onClick={(e) => { e.stopPropagation(); setLockAfterFirst(!lockAfterFirst); }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      lockAfterFirst ? 'bg-purple-600' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        lockAfterFirst ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  {!isActive ? (
                    <button
                      onClick={() => {
                        sound.playRoundStart();
                        startRound(lockAfterFirst);
                      }}
                      id="start-round-btn"
                      className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-98 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}
                    >
                      <Play size={18} fill="white" /> Start Round {round.number}
                    </button>
                  ) : (
                    <button
                      onClick={stopRound}
                      id="stop-round-btn"
                      className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-98 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.35)' }}
                    >
                      <Square size={18} fill="white" /> Stop Round
                    </button>
                  )}

                  <button
                    onClick={resetRound}
                    id="reset-round-btn"
                    className="w-full py-2.5 rounded-xl font-semibold text-[var(--text-secondary)] border border-white/10 hover:bg-white/5 hover:text-[var(--text-primary)] flex items-center justify-center gap-2 transition-all text-xs"
                  >
                    <RotateCcw size={14} /> Next Round
                  </button>
                </div>
              </div>

              {/* First buzz alert */}
              {firstBuzz ? (
                <div
                  className="glass-card p-5 slide-in border-2"
                  style={{ borderColor: `${firstBuzz.teamColor}60`, background: `linear-gradient(135deg, ${firstBuzz.teamColor}22, ${firstBuzz.teamColor}08)` }}
                >
                  <div className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🥇 First Buzz</span>
                    <span>·</span>
                    <span>Round {round.number}</span>
                  </div>
                  <div className="text-2xl font-black tracking-tight" style={{ color: firstBuzz.teamColor }}>
                    {firstBuzz.teamName}
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-[var(--text-secondary)]">
                    <span className="font-mono">⚡ {firstBuzz.responseTimeMs !== null ? `${firstBuzz.responseTimeMs}ms` : '—'}</span>
                    <span>🕐 {new Date(firstBuzz.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-5 text-center text-[var(--text-muted)] text-xs space-y-1">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="font-medium text-[var(--text-secondary)]">
                    {isActive ? 'Waiting for first buzz…' : 'Buzzer Ready'}
                  </div>
                  <div className="text-[11px]">
                    {isActive ? 'Connected players can buzz now!' : 'Start a round to enable player buzzers'}
                  </div>
                </div>
              )}

              {/* Reset game */}
              <div className="glass-card p-4">
                {showResetConfirm ? (
                  <div className="space-y-3">
                    <p className="text-xs text-yellow-400 font-medium flex items-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" /> Reset all scores and game history?
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => { resetGame(); setShowResetConfirm(false); }}
                        id="confirm-reset-btn"
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors">
                        Reset Everything
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    id="reset-game-btn"
                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    <RefreshCw size={13} /> Reset Entire Game
                  </button>
                )}
              </div>
            </div>

            {/* Right col: Leaderboard + current round buzzes (7 columns) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Leaderboard */}
              <div className="glass-card p-6 min-h-[340px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                      <Trophy size={18} className="text-yellow-400" /> Leaderboard
                    </h2>
                    <span className="text-xs text-[var(--text-muted)] font-normal">Click ± to adjust scores</span>
                  </div>
                  <Leaderboard
                    teams={game.teams}
                    onAdjust={adjustScore}
                    showControls
                  />
                </div>

                {game.teams.length === 0 && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => setActiveTab('teams')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all inline-flex items-center gap-2"
                    >
                      <Users size={14} /> Add Teams Now
                    </button>
                  </div>
                )}
              </div>

              {/* Current round buzzes */}
              {round.buzzEvents.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 mb-4">
                    <History size={16} className="text-teal-400" /> Round {round.number} Buzzes
                  </h2>
                  <BuzzHistory events={round.buzzEvents} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Teams Tab ── */}
        {activeTab === 'teams' && (
          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-6">
              <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2 mb-5">
                <Users size={18} className="text-purple-400" /> Manage Teams
              </h2>
              <TeamManager
                teams={game.teams}
                onAdd={addTeam}
                onUpdate={updateTeam}
                onRemove={removeTeam}
              />
            </div>
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto">
            <div className="glass-card p-6">
              <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2 mb-5">
                <History size={18} className="text-teal-400" /> Full Buzz History
                <span className="ml-auto text-xs text-[var(--text-muted)] font-normal">
                  {game.buzzHistory.length} total press{game.buzzHistory.length !== 1 ? 'es' : ''}
                </span>
              </h2>
              <BuzzHistory events={game.buzzHistory} maxItems={100} />
            </div>
          </div>
        )}

        {/* ── Share Tab ── */}
        {activeTab === 'share' && (
          <div className="max-w-md mx-auto">
            <div className="glass-card p-6">
              <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2 mb-5">
                <QrCode size={18} className="text-purple-400" /> Share with Players
              </h2>
              <QRCodePanel gameId={game.id} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
