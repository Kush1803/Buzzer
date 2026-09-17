# BuzzerZ ⚡ — Real-Time Multiplayer Buzzer Game

A full-stack, server-validated, real-time quiz buzzer game supporting up to 20 simultaneous teams with sub-100ms latency.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express + Socket.io 4 |
| Transport | WebSocket (Socket.io) |
| Persistence | In-memory + JSON file |
| Containerization | Docker + Docker Compose |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Start the Server

```bash
cd server
npm install
npm run dev
# → Server running on http://localhost:3001
```

### 2. Start the Client (new terminal)

```bash
cd client
npm install
npm run dev
# → Client running on http://localhost:5173
```

### 3. Open the App

- **Host Dashboard**: http://localhost:5173/
- Click **"Create New Game"** → you'll be taken to the host dashboard
- Share the player link (shown in the **Share** tab) with players

---

## Docker (All-in-one)

```bash
# From project root
docker-compose up --build

# Client: http://localhost
# Server: http://localhost:3001
```

---

## Game Flow

1. **Host** opens the app and clicks **"Create New Game"**
2. Host is taken to the **Host Dashboard** (`/host/<GAME_ID>`)
3. Host goes to **Teams** tab and adds teams + leaders
4. Host opens the **Share** tab → copies the player URL or shows QR code
5. **Players** open the player URL (`/play/<GAME_ID>`) on their phones
6. Players select their team
7. Host clicks **"Start Round"** on the Dashboard tab
8. Players tap the big buzzer button!
9. Host sees who buzzed first (with exact timestamp and response time)
10. Host awards points using the **+/−** score controls in the leaderboard
11. Host clicks **"Next Round"** to advance and reset buzzers
12. Repeat!

---

## Architecture

```
client (React + Vite)          server (Node.js + Express)
│                               │
│  useSocket.ts ─── WebSocket ──┤ Socket.io
│                               │  • join_game
│  HostDashboard.tsx            │  • buzz           ← server timestamps all presses
│  PlayerView.tsx               │  • start_round
│  Landing.tsx                  │  • score_update
│                               │  • add/update/remove_team
│                               │
│  REST (fetch) ──── HTTP ──────┤ Express REST
│  POST /api/games              │  GET /api/games/:id
│  GET  /api/games/:id          │
```

### Key Technical Decisions

| Concern | Solution |
|---------|----------|
| **Accuracy** | Server timestamps all buzz events — client timestamps are discarded |
| **Debounce** | 500ms minimum between presses per team, enforced server-side |
| **Double-press prevention** | Team locked immediately after first accepted buzz |
| **Lock-after-first** | Configurable toggle; when on, all other teams locked on first buzz |
| **Reconnection** | Socket.io auto-reconnects; full game state re-synced on rejoin |
| **Persistence** | JSON file at `server/data/games.json` — survives server restart |

---

## Environment Variables

### Server (`server/.env`)

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

### Client (`client/.env`)

```env
VITE_SERVER_URL=         # Empty = use Vite proxy (local dev)
                         # Set to https://your-server.railway.app for production
```

---

## Deployment

### Frontend → Vercel

```bash
cd client
npm run build
# Deploy dist/ to Vercel
# Set VITE_SERVER_URL=https://your-railway-backend.railway.app
```

`vercel.json` (in `client/`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend → Railway

```bash
# In Railway, connect this repo
# Set root directory to: server
# Set build command: npm run build
# Set start command: npm start
# Set env: CLIENT_ORIGIN=https://your-vercel-frontend.vercel.app
```

---

## Project Structure

```
Buzzer/
├── server/
│   ├── src/
│   │   ├── index.ts          # Express + Socket.io server
│   │   ├── gameManager.ts    # Game state, validation, persistence
│   │   └── types.ts          # Shared TypeScript types
│   ├── data/                 # Auto-created; stores games.json
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx       # Create/join game
│   │   │   ├── HostDashboard.tsx # Game master view
│   │   │   └── PlayerView.tsx    # Mobile buzzer view
│   │   ├── components/
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── BuzzHistory.tsx
│   │   │   ├── TeamManager.tsx
│   │   │   ├── QRCodePanel.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts  # Socket.io connection hook
│   │   │   └── useGame.ts    # Game state + actions hook
│   │   ├── types.ts          # Client-side types
│   │   ├── App.tsx           # Router
│   │   └── index.css         # Global styles + animations
│   ├── index.html
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Features

- ⚡ **Sub-100ms** server-validated buzzer presses
- 🎯 **Server-side timestamps** — no client manipulation possible
- 🔒 **Lock-after-first** mode (configurable per round)
- 📊 **Live leaderboard** with manual score adjustment
- 📱 **Mobile-first** player view with full-screen buzzer
- 🔊 **Audio feedback** (Web Audio API, no external files)
- 🌐 **QR code** sharing for instant player onboarding
- 🔄 **Auto-reconnect** with full state recovery
- 💾 **JSON persistence** — game state survives server restarts
- 🐳 **Docker-ready** for one-command deployment
