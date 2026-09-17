import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, BuzzResult } from '../types';


const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseSocketOptions {
  gameId: string | undefined;
  role: 'host' | 'player';
  teamId?: string;
  onGameState?: (game: GameState) => void;
  onBuzzResult?: (result: BuzzResult) => void;
  onRoundStarted?: (roundNumber: number) => void;
  onRoundReset?: (roundNumber: number) => void;
  onError?: (message: string) => void;
}

export function useSocket({
  gameId,
  role,
  teamId,
  onGameState,
  onBuzzResult,
  onRoundStarted,
  onRoundReset,
  onError,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  // Store callbacks in refs so they don't cause reconnections
  const onGameStateRef = useRef(onGameState);
  const onBuzzResultRef = useRef(onBuzzResult);
  const onRoundStartedRef = useRef(onRoundStarted);
  const onRoundResetRef = useRef(onRoundReset);
  const onErrorRef = useRef(onError);

  useEffect(() => { onGameStateRef.current = onGameState; }, [onGameState]);
  useEffect(() => { onBuzzResultRef.current = onBuzzResult; }, [onBuzzResult]);
  useEffect(() => { onRoundStartedRef.current = onRoundStarted; }, [onRoundStarted]);
  useEffect(() => { onRoundResetRef.current = onRoundReset; }, [onRoundReset]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!gameId) return;

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      socket.emit('join_game', { gameId, role, teamId });
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setStatus('disconnected');
    });

    socket.on('reconnect', () => {
      setStatus('connected');
      socket.emit('join_game', { gameId, role, teamId });
    });

    socket.on('game_state', ({ game }: { game: GameState }) => {
      onGameStateRef.current?.(game);
    });

    socket.on('buzz_result', (result: BuzzResult) => {
      onBuzzResultRef.current?.(result);
    });

    socket.on('round_started', ({ roundNumber }: { roundNumber: number }) => {
      onRoundStartedRef.current?.(roundNumber);
    });

    socket.on('round_reset', ({ roundNumber }: { roundNumber: number }) => {
      onRoundResetRef.current?.(roundNumber);
    });

    socket.on('error', ({ message }: { message: string }) => {
      onErrorRef.current?.(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameId, role, teamId]);

  const emit = useCallback(<T>(event: string, payload: T) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return { emit, status, socket: socketRef };
}
