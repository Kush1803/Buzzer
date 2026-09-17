// Shared types mirrored from server (keep in sync with server/src/types.ts)

export interface Team {
  id: string;
  name: string;
  leader: string;
  color: string;
  score: number;
  isLocked: boolean;
  lastBuzzTime: number;
}

export interface BuzzEvent {
  id: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  timestamp: number;
  roundNumber: number;
  responseTimeMs: number | null;
  isFirst: boolean;
}

export type RoundStatus = 'idle' | 'active' | 'locked';

export interface RoundState {
  number: number;
  status: RoundStatus;
  startedAt: number | null;
  lockAfterFirst: boolean;
  buzzEvents: BuzzEvent[];
}

export interface GameState {
  id: string;
  createdAt: number;
  teams: Team[];
  currentRound: RoundState;
  buzzHistory: BuzzEvent[];
  hostSocketId: string | null;
}

export interface BuzzResult {
  event?: BuzzEvent;
  accepted: boolean;
  reason?: string;
  game?: GameState;
}
