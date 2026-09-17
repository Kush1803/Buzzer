import { v4 as uuidv4 } from 'uuid';
import * as fse from 'fs-extra';
import * as path from 'path';
import {
  GameState,
  Team,
  BuzzEvent,
  RoundState,
  AddTeamPayload,
  UpdateTeamPayload,
} from './types';

const DATA_FILE = path.join(__dirname, '../../data/games.json');
const DEBOUNCE_MS = 500;

// Predefined team color palette
export const TEAM_COLORS = [
  '#FF6B6B', // coral red
  '#4ECDC4', // teal
  '#45B7D1', // sky blue
  '#96CEB4', // mint
  '#FFEAA7', // yellow
  '#DDA0DD', // plum
  '#98D8C8', // sea foam
  '#F7DC6F', // gold
  '#BB8FCE', // lavender
  '#82E0AA', // light green
  '#F1948A', // salmon
  '#85C1E9', // light blue
  '#FAD7A0', // peach
  '#A9CCE3', // pale blue
  '#A3E4D7', // aqua
  '#F9E79F', // pale yellow
  '#D2B4DE', // mauve
  '#A9DFBF', // pale green
  '#FADBD8', // blush
  '#D5DBDB', // silver
];

class GameManager {
  private games: Map<string, GameState> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  // ─── Persistence ────────────────────────────────────────────────────────────

  private async saveToDisk(): Promise<void> {
    try {
      await fse.ensureDir(path.dirname(DATA_FILE));
      const data = Object.fromEntries(this.games);
      await fse.writeJson(DATA_FILE, data, { spaces: 2 });
    } catch (err) {
      console.error('[GameManager] Failed to save to disk:', err);
    }
  }

  private loadFromDisk(): void {
    try {
      if (fse.existsSync(DATA_FILE)) {
        const data = fse.readJsonSync(DATA_FILE) as Record<string, GameState>;
        for (const [id, state] of Object.entries(data)) {
          // Reset socket state on restart
          state.hostSocketId = null;
          this.games.set(id, state);
        }
        console.log(`[GameManager] Loaded ${this.games.size} game(s) from disk`);
      }
    } catch (err) {
      console.error('[GameManager] Failed to load from disk:', err);
    }
  }

  // ─── Game CRUD ───────────────────────────────────────────────────────────────

  createGame(): GameState {
    const id = uuidv4().slice(0, 8).toUpperCase();
    const round: RoundState = {
      number: 1,
      status: 'idle',
      startedAt: null,
      lockAfterFirst: true,
      buzzEvents: [],
    };
    const game: GameState = {
      id,
      createdAt: Date.now(),
      teams: [],
      currentRound: round,
      buzzHistory: [],
      hostSocketId: null,
    };
    this.games.set(id, game);
    this.saveToDisk();
    console.log(`[GameManager] Created game ${id}`);
    return game;
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  setHostSocket(gameId: string, socketId: string | null): void {
    const game = this.games.get(gameId);
    if (game) {
      game.hostSocketId = socketId;
    }
  }

  // ─── Team Management ─────────────────────────────────────────────────────────

  addTeam(payload: AddTeamPayload): { game: GameState; team: Team } | null {
    const game = this.games.get(payload.gameId);
    if (!game) return null;

    const colorIndex = game.teams.length % TEAM_COLORS.length;
    const team: Team = {
      id: uuidv4(),
      name: payload.name.trim(),
      leader: payload.leader.trim(),
      color: payload.color || TEAM_COLORS[colorIndex],
      score: 0,
      isLocked: false,
      lastBuzzTime: 0,
    };
    game.teams.push(team);
    this.saveToDisk();
    return { game, team };
  }

  updateTeam(payload: UpdateTeamPayload): GameState | null {
    const game = this.games.get(payload.gameId);
    if (!game) return null;

    const team = game.teams.find((t) => t.id === payload.teamId);
    if (!team) return null;

    if (payload.name !== undefined) team.name = payload.name.trim();
    if (payload.leader !== undefined) team.leader = payload.leader.trim();
    if (payload.color !== undefined) team.color = payload.color;

    this.saveToDisk();
    return game;
  }

  removeTeam(gameId: string, teamId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.teams = game.teams.filter((t) => t.id !== teamId);
    // Also remove buzz events from this team in current round
    game.currentRound.buzzEvents = game.currentRound.buzzEvents.filter(
      (e) => e.teamId !== teamId
    );
    this.saveToDisk();
    return game;
  }

  // ─── Round Control ────────────────────────────────────────────────────────────

  startRound(gameId: string, lockAfterFirst: boolean): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Reset round state
    game.currentRound.status = 'active';
    game.currentRound.startedAt = Date.now();
    game.currentRound.lockAfterFirst = lockAfterFirst;
    game.currentRound.buzzEvents = [];

    // Unlock all teams
    for (const team of game.teams) {
      team.isLocked = false;
    }

    this.saveToDisk();
    return game;
  }

  stopRound(gameId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.currentRound.status = 'idle';
    this.saveToDisk();
    return game;
  }

  resetRound(gameId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Archive current buzz events to history
    game.buzzHistory.unshift(...game.currentRound.buzzEvents);

    game.currentRound.status = 'idle';
    game.currentRound.number += 1;
    game.currentRound.startedAt = null;
    game.currentRound.buzzEvents = [];

    // Unlock all teams
    for (const team of game.teams) {
      team.isLocked = false;
    }

    this.saveToDisk();
    return game;
  }

  resetGame(gameId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.buzzHistory = [];
    game.currentRound = {
      number: 1,
      status: 'idle',
      startedAt: null,
      lockAfterFirst: game.currentRound.lockAfterFirst,
      buzzEvents: [],
    };

    for (const team of game.teams) {
      team.score = 0;
      team.isLocked = false;
      team.lastBuzzTime = 0;
    }

    this.saveToDisk();
    return game;
  }

  // ─── Buzzer Logic ─────────────────────────────────────────────────────────────

  processBuzz(
    gameId: string,
    teamId: string
  ): { accepted: boolean; reason?: string; event?: BuzzEvent; game?: GameState } {
    const game = this.games.get(gameId);
    if (!game) return { accepted: false, reason: 'Game not found' };

    const team = game.teams.find((t) => t.id === teamId);
    if (!team) return { accepted: false, reason: 'Team not found' };

    // Validate round is active
    if (game.currentRound.status !== 'active') {
      return { accepted: false, reason: 'Round is not active' };
    }

    // Team locked out
    if (team.isLocked) {
      return { accepted: false, reason: 'Team is locked out' };
    }

    // Debounce: prevent rapid re-presses
    const now = Date.now();
    if (now - team.lastBuzzTime < DEBOUNCE_MS) {
      return { accepted: false, reason: 'Too fast — debounced' };
    }

    // Check if another team already buzzed and lock-after-first is on
    if (
      game.currentRound.lockAfterFirst &&
      game.currentRound.buzzEvents.length > 0
    ) {
      // Lock this team out
      team.isLocked = true;
      return { accepted: false, reason: 'Another team already buzzed first' };
    }

    // Accept the buzz
    team.lastBuzzTime = now;
    const responseTimeMs =
      game.currentRound.startedAt !== null ? now - game.currentRound.startedAt : null;

    const isFirst = game.currentRound.buzzEvents.length === 0;

    const buzzEvent: BuzzEvent = {
      id: uuidv4(),
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      timestamp: now,
      roundNumber: game.currentRound.number,
      responseTimeMs,
      isFirst,
    };

    game.currentRound.buzzEvents.push(buzzEvent);
    game.buzzHistory.unshift(buzzEvent);

    // Lock team so they can't buzz again this round
    team.isLocked = true;

    // If lock-after-first, lock all remaining teams
    if (game.currentRound.lockAfterFirst && isFirst) {
      for (const t of game.teams) {
        if (t.id !== teamId) {
          t.isLocked = true;
        }
      }
    }

    this.saveToDisk();
    return { accepted: true, event: buzzEvent, game };
  }

  // ─── Score Management ─────────────────────────────────────────────────────────

  adjustScore(gameId: string, teamId: string, delta: number): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    const team = game.teams.find((t) => t.id === teamId);
    if (!team) return null;

    team.score = Math.max(0, team.score + delta);
    this.saveToDisk();
    return game;
  }

  lockTeam(gameId: string, teamId: string, locked: boolean): GameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    const team = game.teams.find((t) => t.id === teamId);
    if (!team) return null;

    team.isLocked = locked;
    this.saveToDisk();
    return game;
  }
}

export const gameManager = new GameManager();
