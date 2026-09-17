// Shared type definitions for the buzzer game

export interface Team {
  id: string;
  name: string;
  leader: string;
  color: string;
  score: number;
  isLocked: boolean; // locked out for current round
  lastBuzzTime: number; // epoch ms, for debounce
}

export interface BuzzEvent {
  id: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  timestamp: number; // server epoch ms
  roundNumber: number;
  responseTimeMs: number | null; // ms since round started
  isFirst: boolean;
}

export type RoundStatus = 'idle' | 'active' | 'locked';

export interface RoundState {
  number: number;
  status: RoundStatus;
  startedAt: number | null; // epoch ms
  lockAfterFirst: boolean;
  buzzEvents: BuzzEvent[];
}

export interface GameState {
  id: string;
  createdAt: number;
  teams: Team[];
  currentRound: RoundState;
  buzzHistory: BuzzEvent[]; // all-time history across rounds
  hostSocketId: string | null;
}

// Socket.io event payloads (Client → Server)
export interface JoinGamePayload {
  gameId: string;
  role: 'host' | 'player';
  teamId?: string; // for players
}

export interface BuzzPayload {
  gameId: string;
  teamId: string;
}

export interface StartRoundPayload {
  gameId: string;
  lockAfterFirst: boolean;
}

export interface StopRoundPayload {
  gameId: string;
}

export interface ResetRoundPayload {
  gameId: string;
}

export interface ResetGamePayload {
  gameId: string;
}

export interface ScoreUpdatePayload {
  gameId: string;
  teamId: string;
  delta: number; // +N or -N
}

export interface AddTeamPayload {
  gameId: string;
  name: string;
  leader: string;
  color: string;
}

export interface UpdateTeamPayload {
  gameId: string;
  teamId: string;
  name?: string;
  leader?: string;
  color?: string;
}

export interface RemoveTeamPayload {
  gameId: string;
  teamId: string;
}

export interface LockTeamPayload {
  gameId: string;
  teamId: string;
  locked: boolean;
}

// Socket.io event payloads (Server → Client)
export interface GameStateUpdatePayload {
  game: GameState;
}

export interface BuzzResultPayload {
  event: BuzzEvent;
  accepted: boolean;
  reason?: string;
  game: GameState;
}

export interface ErrorPayload {
  message: string;
}
