import { useState, useCallback } from 'react';
import type { GameState, BuzzResult } from '../types';
import { useSocket } from './useSocket';
import type { ConnectionStatus } from './useSocket';

interface UseGameOptions {
  gameId: string | undefined;
  role: 'host' | 'player';
  teamId?: string;
}

export function useGame({ gameId, role, teamId }: UseGameOptions) {
  const [game, setGame] = useState<GameState | null>(null);
  const [lastBuzzResult, setLastBuzzResult] = useState<BuzzResult | null>(null);
  const [lastRoundStarted, setLastRoundStarted] = useState<number | null>(null);
  const [lastRoundReset, setLastRoundReset] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGameState = useCallback((g: GameState) => setGame(g), []);
  const handleBuzzResult = useCallback((r: BuzzResult) => setLastBuzzResult(r), []);
  const handleRoundStarted = useCallback((n: number) => setLastRoundStarted(n), []);
  const handleRoundReset = useCallback((n: number) => setLastRoundReset(n), []);
  const handleError = useCallback((msg: string) => setError(msg), []);

  const { emit, status } = useSocket({
    gameId,
    role,
    teamId,
    onGameState: handleGameState,
    onBuzzResult: handleBuzzResult,
    onRoundStarted: handleRoundStarted,
    onRoundReset: handleRoundReset,
    onError: handleError,
  });

  // ── Host actions ─────────────────────────────────────────────────────────────

  const startRound = useCallback((lockAfterFirst: boolean) => {
    emit('start_round', { gameId, lockAfterFirst });
  }, [emit, gameId]);

  const stopRound = useCallback(() => {
    emit('stop_round', { gameId });
  }, [emit, gameId]);

  const resetRound = useCallback(() => {
    emit('reset_round', { gameId });
  }, [emit, gameId]);

  const resetGame = useCallback(() => {
    emit('reset_game', { gameId });
  }, [emit, gameId]);

  const adjustScore = useCallback((tid: string, delta: number) => {
    emit('score_update', { gameId, teamId: tid, delta });
  }, [emit, gameId]);

  const addTeam = useCallback((name: string, leader: string, color: string) => {
    emit('add_team', { gameId, name, leader, color });
  }, [emit, gameId]);

  const updateTeam = useCallback((tid: string, name: string, leader: string, color: string) => {
    emit('update_team', { gameId, teamId: tid, name, leader, color });
  }, [emit, gameId]);

  const removeTeam = useCallback((tid: string) => {
    emit('remove_team', { gameId, teamId: tid });
  }, [emit, gameId]);

  const lockTeam = useCallback((tid: string, locked: boolean) => {
    emit('lock_team', { gameId, teamId: tid, locked });
  }, [emit, gameId]);

  // ── Player actions ────────────────────────────────────────────────────────────

  const buzz = useCallback(() => {
    if (teamId) emit('buzz', { gameId, teamId });
  }, [emit, gameId, teamId]);

  return {
    game,
    status: status as ConnectionStatus,
    lastBuzzResult,
    lastRoundStarted,
    lastRoundReset,
    error,
    // Host
    startRound,
    stopRound,
    resetRound,
    resetGame,
    adjustScore,
    addTeam,
    updateTeam,
    removeTeam,
    lockTeam,
    // Player
    buzz,
  };
}
