import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Users, Crown, ArrowRight, Hash } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinError, setJoinError] = useState('');

  const createGame = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/games', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create game');
      const { gameId } = await res.json();
      navigate(`/host/${gameId}`);
    } catch {
      setCreating(false);
      alert('Could not connect to server. Is it running?');
    }
  };

  const joinGame = async () => {
    const id = joinId.trim().toUpperCase();
    if (!id) { setJoinError('Enter a Game ID'); return; }
    // Check game exists
    try {
      const res = await fetch(`/api/games/${id}`);
      if (!res.ok) { setJoinError('Game not found'); return; }
      navigate(`/play/${id}`);
    } catch {
      setJoinError('Could not reach server');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="orb w-96 h-96 top-[-8rem] left-[-8rem] opacity-30" style={{ background: '#7c3aed' }} />
      <div className="orb w-80 h-80 bottom-[-6rem] right-[-6rem] opacity-25" style={{ background: '#2563eb' }} />
      <div className="orb w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" style={{ background: '#10b981' }} />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-2 relative"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}>
            <Zap size={40} className="text-white" fill="white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            BuzzerZ
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Real-time multiplayer quiz buzzer · Up to 20 teams
          </p>
        </div>

        {/* Create Game */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={16} className="text-yellow-400" />
            <h2 className="font-semibold text-sm text-[var(--text-primary)]">Host a Game</h2>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Create a new game, add your teams, and share the join link with players.
          </p>
          <button
            onClick={createGame}
            disabled={creating}
            id="create-game-btn"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
            }}
          >
            {creating ? (
              <><span className="animate-spin">⚡</span> Creating…</>
            ) : (
              <><Crown size={18} /> Create New Game <ArrowRight size={16} /></>
            )}
          </button>
        </div>

        {/* Join Game */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-teal-400" />
            <h2 className="font-semibold text-sm text-[var(--text-primary)]">Join a Game</h2>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Enter the Game ID given by your host (or scan their QR code).
          </p>
          <div className="relative">
            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="join-game-id"
              type="text"
              placeholder="e.g. A3F9B2C1"
              value={joinId}
              onChange={(e) => { setJoinId(e.target.value.toUpperCase()); setJoinError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && joinGame()}
              maxLength={8}
              className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] font-mono text-lg tracking-widest focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          {joinError && <p className="text-xs text-red-400">{joinError}</p>}
          <button
            onClick={joinGame}
            id="join-game-btn"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #0d9488, #0891b2)',
              boxShadow: '0 4px 24px rgba(13,148,136,0.35)',
              color: 'white',
            }}
          >
            <Users size={18} /> Join Game <ArrowRight size={16} />
          </button>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)]">
          BuzzerZ · Server-validated accuracy · &lt;100ms latency
        </p>
      </div>
    </div>
  );
}
