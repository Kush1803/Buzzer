import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { gameManager } from './gameManager';
import {
  JoinGamePayload,
  BuzzPayload,
  StartRoundPayload,
  StopRoundPayload,
  ResetRoundPayload,
  ResetGamePayload,
  ScoreUpdatePayload,
  AddTeamPayload,
  UpdateTeamPayload,
  RemoveTeamPayload,
  LockTeamPayload,
} from './types';

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// ─── Express + HTTP + Socket.io ───────────────────────────────────────────────

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000,
});

// ─── REST API ─────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Create a new game
app.post('/api/games', (_req, res) => {
  const game = gameManager.createGame();
  res.json({ gameId: game.id, game });
});

// Get game state (for reconnection / initial load)
app.get('/api/games/:gameId', (req, res) => {
  const game = gameManager.getGame(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  return res.json({ game });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────

function broadcastGame(gameId: string): void {
  const game = gameManager.getGame(gameId);
  if (!game) return;
  io.to(gameId).emit('game_state', { game });
}

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── Join game room ─────────────────────────────────────────────────────────
  socket.on('join_game', (payload: JoinGamePayload) => {
    const { gameId, role, teamId } = payload;

    const game = gameManager.getGame(gameId);
    if (!game) {
      socket.emit('error', { message: `Game ${gameId} not found` });
      return;
    }

    socket.join(gameId);
    console.log(`[Socket] ${socket.id} joined game ${gameId} as ${role}${teamId ? ` (team ${teamId})` : ''}`);

    if (role === 'host') {
      gameManager.setHostSocket(gameId, socket.id);
    }

    // Send full state to the new joiner
    socket.emit('game_state', { game });
  });

  // ── Buzz ──────────────────────────────────────────────────────────────────
  socket.on('buzz', (payload: BuzzPayload) => {
    const { gameId, teamId } = payload;
    const result = gameManager.processBuzz(gameId, teamId);

    if (result.accepted && result.event && result.game) {
      // Broadcast full updated state to all in room
      io.to(gameId).emit('game_state', { game: result.game });
      io.to(gameId).emit('buzz_result', {
        event: result.event,
        accepted: true,
        game: result.game,
      });
    } else {
      // Only tell the buzzing client they were rejected
      socket.emit('buzz_result', {
        accepted: false,
        reason: result.reason,
      });
    }
  });

  // ── Start round ───────────────────────────────────────────────────────────
  socket.on('start_round', (payload: StartRoundPayload) => {
    const game = gameManager.startRound(payload.gameId, payload.lockAfterFirst);
    if (game) {
      io.to(payload.gameId).emit('game_state', { game });
      io.to(payload.gameId).emit('round_started', { roundNumber: game.currentRound.number });
    }
  });

  // ── Stop round ────────────────────────────────────────────────────────────
  socket.on('stop_round', (payload: StopRoundPayload) => {
    const game = gameManager.stopRound(payload.gameId);
    if (game) {
      io.to(payload.gameId).emit('game_state', { game });
    }
  });

  // ── Reset round ───────────────────────────────────────────────────────────
  socket.on('reset_round', (payload: ResetRoundPayload) => {
    const game = gameManager.resetRound(payload.gameId);
    if (game) {
      io.to(payload.gameId).emit('game_state', { game });
      io.to(payload.gameId).emit('round_reset', { roundNumber: game.currentRound.number });
    }
  });

  // ── Reset game ────────────────────────────────────────────────────────────
  socket.on('reset_game', (payload: ResetGamePayload) => {
    const game = gameManager.resetGame(payload.gameId);
    if (game) {
      io.to(payload.gameId).emit('game_state', { game });
    }
  });

  // ── Score update ──────────────────────────────────────────────────────────
  socket.on('score_update', (payload: ScoreUpdatePayload) => {
    const game = gameManager.adjustScore(payload.gameId, payload.teamId, payload.delta);
    if (game) {
      io.to(payload.gameId).emit('game_state', { game });
    }
  });

  // ── Add team ──────────────────────────────────────────────────────────────
  socket.on('add_team', (payload: AddTeamPayload) => {
    const result = gameManager.addTeam(payload);
    if (result) {
      io.to(payload.gameId).emit('game_state', { game: result.game });
    }
  });

  // ── Update team ───────────────────────────────────────────────────────────
  socket.on('update_team', (payload: UpdateTeamPayload) => {
    const game = gameManager.updateTeam(payload);
    if (game) {
      io.to(payload.gameId).emit('game_state', { game });
    }
  });

  // ── Remove team ───────────────────────────────────────────────────────────
  socket.on('remove_team', (payload: RemoveTeamPayload) => {
    const game = gameManager.removeTeam(payload.gameId, payload.teamId);
    if (game) {
      io.to(payload.gameId).emit('game_state', { game });
    }
  });

  // ── Lock / unlock team (manual host override) ─────────────────────────────
  socket.on('lock_team', (payload: LockTeamPayload) => {
    const game = gameManager.lockTeam(payload.gameId, payload.teamId, payload.locked);
    if (game) {
      io.to(payload.gameId).emit('game_state', { game });
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`\n🎯 Buzzer Game Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Client origin: ${CLIENT_ORIGIN}\n`);
});

export { app, io };
