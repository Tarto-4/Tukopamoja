# TUKOPAMOJA — Comprehensive Technical Documentation

> **Version**: 1.0 · **Last Updated**: 6 May 2026  
> **Live**: <https://tarto-4.github.io/Tukopamoja/>  
> **Platform**: Real-time quiz platform for ENS Africa

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Game Flow](#7-game-flow)
8. [Realtime Communication](#8-realtime-communication)
9. [Scoring Engine](#9-scoring-engine)
10. [Scalability & Performance](#10-scalability--performance)
11. [Security Protocols](#11-security-protocols)
12. [Deployment](#12-deployment)
13. [API Reference](#13-api-reference)
14. [User Flows](#14-user-flows)
15. [Accessibility](#15-accessibility)
16. [Troubleshooting](#16-troubleshooting)
17. [Development Guide](#17-development-guide)

---

## 1. Overview

**Tukopamoja** is a real-time, interactive quiz platform designed for corporate learning, events, and team engagement. Hosts create quiz templates, launch live sessions with a unique PIN, and present questions to an audience. Players join via PIN on their devices, answer in real-time, and see live leaderboards.

### Key Capabilities
- **Template management** — Create, edit, and publish reusable quiz blueprints
- **Live game hosting** — Full presenter controls (start, pause, skip, end)
- **Anonymous player join** — No account required; join via 6-digit PIN
- **Real-time scoring** — Rank-based scoring with streak bonuses
- **Live leaderboards** — Broadcast rankings between questions
- **Multi-platform** — Web (Next.js) + Mobile (Expo/React Native)
- **Organization branding** — Customizable colors, logo, tagline
- **Data lifecycle** — Auto-archive finished sessions; host data management RPCs
- **Observability** — Host action audit logs, analytics views

---

## 2. Architecture

### High-Level Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     Client Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Next.js Web │  │ Expo Mobile │  │ Presenter View   │  │
│  │  (Host +     │  │ (Player)    │  │ (Host Question   │  │
│  │   Dashboard) │  │             │  │  + Leaderboard)  │  │
│  └──────┬───┬──┘  └──────┬──────┘  └───────┬─────────┘  │
│         │   │            │                  │            │
│         │   └────────────┼──────────────────┘            │
│         │                │                               │
│  ┌──────┴────────────────┴───────────────────────────┐   │
│  │           @tukopamoja/shared                       │   │
│  │  (Types · Constants · Scoring Engine)              │   │
│  └───────────────────────┬───────────────────────────┘   │
└──────────────────────────┼───────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │    Supabase Platform     │
              │  ┌────────────────────┐  │
              │  │   Realtime (WS)    │  │  ← postgres_changes + broadcast
              │  │   Auth (JWT)       │  │  ← email/password + MFA
              │  │   REST (PostgREST) │  │  ← Auto-generated API
              │  │   Storage          │  │  ← Media uploads
              │  └────────┬───────────┘  │
              │  ┌────────┴───────────┐  │
              │  │  PostgreSQL 15     │  │
              │  │  + RLS Policies    │  │
              │  │  + RPCs/Triggers   │  │
              │  │  + pg_cron         │  │
              │  └────────────────────┘  │
              └─────────────────────────┘
```

### Design Principles
1. **Question snapshots** — Questions are deep-copied into `sessions.questions_snapshot` (JSONB) at session creation, so template edits never affect active games.
2. **Shared code** — Types, scoring logic, and constants live in `@tukopamoja/shared`, consumed by both web and mobile.
3. **Dual deploy modes** — A single `BUILD_MODE` env var switches between static export (GitHub Pages/nginx) and Node.js server (Docker).
4. **Anonymous players** — Players join without authentication; RLS permits `anon` insert/read on player tables.
5. **Server-authoritative scoring** — A PostgreSQL trigger (`recompute_ranked_question_scores`) recomputes rank-based scores on every answer insert, ensuring tamper-proof results.

---

## 3. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 14.x |
| **UI** | React 18 + Tailwind CSS + Framer Motion | — |
| **Animations** | Anime.js v4 (button micro-interactions) | 4.x |
| **State** | Zustand | 5.x |
| **Mobile** | Expo SDK 52 + React Native 0.76 | — |
| **Backend** | Supabase (managed PostgreSQL 15) | — |
| **Realtime** | Supabase Realtime (WebSocket) | — |
| **Auth** | Supabase Auth (email/password + MFA) | — |
| **Shared** | `@tukopamoja/shared` (TypeScript library) | — |
| **CI/CD** | GitHub Actions + GitHub Pages | — |
| **Container** | Docker (multi-stage), nginx 1.27 | — |
| **Node** | >= 20.0.0 | — |

---

## 4. Project Structure

```
tukopamoja/
├── packages/
│   ├── shared/            # @tukopamoja/shared — types, constants, scoring
│   │   └── src/
│   │       ├── index.ts           # Public API
│   │       ├── constants.ts       # Game constants, colors, flow
│   │       ├── scoring.ts         # calculateScore(), rankPlayers()
│   │       └── types/
│   │           ├── database.ts    # Database row types
│   │           └── realtime.ts    # Channel events, DTOs
│   │
│   ├── web/               # Next.js application
│   │   ├── src/
│   │   │   ├── app/               # App Router pages
│   │   │   │   ├── auth/          # Login, password reset
│   │   │   │   ├── dashboard/     # Host dashboard (templates, sessions, branding)
│   │   │   │   ├── host/          # Live game presenter screen
│   │   │   │   ├── join/          # Player PIN entry
│   │   │   │   ├── play/          # Player game screen
│   │   │   │   ├── layout.tsx     # Root layout + metadata
│   │   │   │   └── error.tsx      # Global error boundary
│   │   │   ├── components/
│   │   │   │   ├── host/          # HostLobby, HostQuestion, HostLeaderboard, HostGameOver
│   │   │   │   ├── player/        # PlayerLobby, PlayerQuestion, PlayerLeaderboard, PlayerGameOver
│   │   │   │   ├── ui/            # Button, DancingCharacters, WinnerCelebration, etc.
│   │   │   │   └── theme/         # ThemeProvider
│   │   │   ├── hooks/             # useRealtimeGame, usePlayerRealtime
│   │   │   ├── stores/            # useGameStore, usePlayerStore, useBrandingStore
│   │   │   ├── lib/
│   │   │   │   ├── supabase/      # Client + env helpers
│   │   │   │   ├── base-path.ts   # Dynamic basePath for GitHub Pages
│   │   │   │   └── query-cache.ts # Session query caching
│   │   │   └── styles/
│   │   │       └── globals.css    # Tailwind + custom animations
│   │   ├── public/                # Static assets (favicon, backgrounds)
│   │   ├── next.config.js         # Dual-mode config (static vs server)
│   │   └── tailwind.config.ts     # Design tokens, keyframes
│   │
│   └── mobile/            # Expo/React Native app
│       ├── app/                   # Expo Router screens
│       ├── components/            # Mobile components
│       ├── hooks/                 # Mobile hooks
│       ├── stores/                # Mobile Zustand stores
│       └── lib/                   # Supabase client
│
├── supabase/
│   ├── config.toml                # Local dev config
│   ├── seed.sql                   # Seed data
│   └── migrations/                # Sequential SQL migrations
│       ├── 00001_create_schema.sql
│       ├── 00002_create_rls_policies.sql
│       ├── 00003_player_count_sync.sql
│       ├── 00004_refresh_brand_defaults.sql
│       └── ... (20+ migrations)
│
├── docker/
│   └── nginx.conf                 # Production nginx config
├── Dockerfile                     # Static build (nginx)
├── Dockerfile.server              # Node.js server build
├── docker-compose.yml             # Dev environment
└── docker-compose.prod.yml        # Production compose
```

---

## 5. Database Schema

### Entity-Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ organization │       │   profiles   │       │  templates   │
│ (single row) │       │              │       │              │
│              │       │ id (auth.uid)│←──┐   │ id           │
│ name         │       │ email        │   │   │ created_by ──┤──→ profiles.id
│ primary_color│       │ full_name    │   │   │ title        │
│ logo_url     │       │ role         │   │   │ is_published │
└──────────────┘       └──────────────┘   │   │ question_count│
                                          │   └──────┬───────┘
                                          │          │
                                          │   ┌──────┴───────┐
                                          │   │  questions   │
                                          │   │ template_id  │
                                          │   │ question_text│
                                          │   │ options JSONB│
                                          │   │ time_limit   │
                                          │   │ points       │
                                          │   └──────────────┘
                                          │
┌──────────────┐                          │   ┌──────────────────┐
│   sessions   │                          │   │ host_action_logs │
│              │                          │   │ session_id  ─────┤─┐
│ id           │                          │   │ host_id     ─────┤─┤→ profiles
│ template_id ─┤──→ templates             │   │ action           │ │
│ host_id     ─┤──→ profiles──────────────┘   │ metadata JSONB   │ │
│ pin (unique) │                              └──────────────────┘ │
│ status       │                                                   │
│ questions_   │←── snapshot at creation                            │
│   snapshot   │                                                   │
│ player_count │           ┌──────────────────┐                    │
│ lobby_locked │           │ session_players  │                    │
│ allow_late_  │           │                  │                    │
│   join       │←──────────┤ session_id       │                    │
│ is_paused    │           │ first_name       │                    │
│ current_q_   │           │ last_name        │                    │
│   index      │           │ email            │                    │
│ current_     │           │ score            │                    │
│   question_  │           │ streak           │                    │
│   started_at │           │ is_ready         │                    │
└──────────────┘           │ kicked_at        │                    │
       │                   └────────┬─────────┘                    │
       │                            │                              │
       │                   ┌────────┴─────────┐                    │
       │                   │ player_answers   │                    │
       └───────────────────┤ session_id       │                    │
                           │ player_id ───────┤──→ session_players │
                           │ question_index   │                    │
                           │ selected_option  │                    │
                           │ is_correct       │                    │
                           │ time_taken_ms    │                    │
                           │ points_awarded   │                    │
                           └──────────────────┘                    │
                                                                   │
                           ┌──────────────────┐                    │
                           │ archived_sessions│                    │
                           │ payload JSONB    │ ← pg_cron daily    │
                           └──────────────────┘                    │
```

### Tables Detail

#### `organization` — Single-tenant branding
| Column | Type | Default |
|--------|------|---------|
| `id` | UUID | auto |
| `name` | text | `'TUKOPAMOJA'` |
| `tagline` | text | `'Together We Quiz'` |
| `logo_url` | text | — |
| `primary_color` | text | `'#8E191E'` |
| `secondary_color` | text | `'#C9A84C'` |
| `font_family` | text | `'Inter'` |

#### `sessions` — Live game instances
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `template_id` | UUID | FK → templates |
| `host_id` | UUID | FK → profiles |
| `pin` | text | Unique 6-digit, generated by `generate_unique_pin()` |
| `status` | session_status | `lobby` → `question_active` → `evaluating` → `leaderboard` → `finished` |
| `current_q_index` | int | -1 = not started |
| `player_count` | int | Auto-synced via trigger |
| `questions_snapshot` | JSONB | Deep copy from template at creation |
| `lobby_locked` | bool | Prevents new joins |
| `allow_late_join` | bool | Allows join after lobby |
| `is_paused` | bool | Pause/resume control |
| `current_question_started_at` | timestamp | For timer recovery |
| `current_question_time_limit_sec` | int | Active question limit |
| `current_question_remaining_sec` | int | Pause state preservation |

#### `session_players` — Players in a session
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `session_id` | UUID | FK → sessions |
| `first_name` | text | Required |
| `last_name` | text | Required |
| `nickname` | text | Computed display name |
| `email` | text | Optional |
| `avatar` | text | Emoji avatar |
| `score` | int | Running total |
| `streak` | int | Consecutive correct |
| `is_ready` | bool | Lobby ready state |
| `is_muted` | bool | Host can mute |
| `kicked_at` | timestamp | Soft delete |
| **Unique** | | `(session_id, first_name, last_name)` |

#### `player_answers` — Per-question answers
| Column | Type | Notes |
|--------|------|-------|
| `session_id` | UUID | FK → sessions |
| `player_id` | UUID | FK → session_players |
| `question_index` | int | 0-based |
| `selected_option` | int | 0-based option index |
| `is_correct` | bool | — |
| `time_taken_ms` | int | Answer speed |
| `points_awarded` | int | Rank-adjusted score |
| **Unique** | | `(session_id, player_id, question_index)` |

### Enums

```sql
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false');
CREATE TYPE session_status AS ENUM ('lobby', 'question_active', 'evaluating', 'leaderboard', 'finished');
```

### Database Functions (RPCs)

| Function | Purpose | Access |
|----------|---------|--------|
| `generate_unique_pin()` | Unique 6-digit PIN generation | Internal |
| `create_session(template_id, host_id)` | Snapshot questions → create session | `security definer` |
| `join_session_guarded(pin, first_name, last_name, email, avatar)` | Validated join with rate limiting (8/60s) | `anon, authenticated` |
| `recompute_ranked_question_scores(session_id, q_index)` | Rank-based score recomputation | `security definer` |
| `get_leaderboard_page(session_id, limit, offset)` | Paginated leaderboard with `dense_rank()` | `anon, authenticated` |
| `log_host_action(session_id, action, metadata)` | Audit trail | `authenticated` |
| `archive_and_cleanup_finished_sessions(days, batch)` | Daily archival via `pg_cron` | `authenticated` |
| `reset_host_play_history()` | Delete all host data | `authenticated` |
| `delete_single_session(session_id)` | Safe delete (lobby/finished only) | `authenticated` |

### Triggers

| Trigger | Table | Event | Action |
|---------|-------|-------|--------|
| `on_auth_user_created` | `auth.users` | INSERT | Auto-create profile |
| `trg_sync_player_count` | `session_players` | INSERT/DELETE | Sync `sessions.player_count` |
| `trg_ranked_scoring_after_answer` | `player_answers` | INSERT | Recompute ranked scores |
| `trg_sync_question_count` | `questions` | INSERT/DELETE | Update template count |

---

## 6. Authentication & Authorization

### Auth Flow

```
┌─────────┐   email + password   ┌──────────────┐   JWT   ┌──────────┐
│  User   │ ──────────────────→  │ Supabase Auth │ ──────→ │ PostgREST│
│ (Host)  │ ←────────────────── │              │         │  (RLS)   │
│         │   session token      │  MFA (TOTP)  │         │          │
└─────────┘                      └──────────────┘         └──────────┘

┌─────────┐   PIN + name         ┌──────────────┐  anon JWT ┌──────────┐
│  User   │ ──────────────────→  │ join_session_ │ ────────→ │ PostgREST│
│(Player) │ ←────────────────── │   guarded()  │          │  (RLS)   │
│         │   player_id          └──────────────┘          └──────────┘
```

### Host Authentication
- **Sign up**: Email + password → Supabase Auth → auto-created profile via trigger
- **Email confirmation**: Required, OTP length 8
- **MFA**: TOTP enrollment and verification enabled
- **Password reset**: Email-based with recovery link
- **Session**: JWT stored in browser, auto-refreshed by `@supabase/ssr`

### Player Authentication
- **No account required** — Players join via 6-digit PIN
- **Identity**: First name + last name + email (optional) + emoji avatar
- **Persistence**: `localStorage` stores `{playerId, sessionId, firstName, lastName, avatar}`
- **Reconnection**: `rejoinSession()` validates session/player still active, restores state
- **Rate limiting**: `join_session_guarded()` limits to 8 attempts per email per 60 seconds

### Supabase Client Setup

```typescript
// packages/web/src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;
  const { url, anonKey } = getEnv();
  client = createBrowserClient(url, anonKey);
  return client;
}
```

---

## 7. Game Flow

### Session Lifecycle

```
 ┌─────────┐     ┌────────────────┐     ┌────────────┐     ┌─────────────┐     ┌──────────┐
 │  LOBBY  │ ──→ │ QUESTION_ACTIVE│ ──→ │ EVALUATING │ ──→ │ LEADERBOARD │ ──→ │ FINISHED │
 └─────────┘     └────────────────┘     └────────────┘     └─────────────┘     └──────────┘
   Host creates    Timer counts down     Auto after timer    Host reviews        Game ends;
   session with    Players answer        or host forces      rankings;           data archived
   PIN; players                          close               host clicks         after 14 days
   join + ready                                              "Next" or "End"
```

### State Transitions

| From | To | Trigger | What Happens |
|------|----|---------|-------------|
| — | `lobby` | Host creates session | PIN generated, questions snapshotted |
| `lobby` | `question_active` | Host clicks "Start" | Timer starts, Q1 displayed |
| `question_active` | `evaluating` | Timer expires / host closes | Answers locked, results shown |
| `question_active` | `leaderboard` | Host clicks "Show Leaderboard" | Rankings broadcast to all players |
| `leaderboard` | `question_active` | Host clicks "Next Question" | Next question starts |
| `leaderboard` | `finished` | Host clicks "Finish" (last Q) | Final rankings broadcast |
| Any | `finished` | Host clicks "End Game" | Game ends early |
| `question_active` | `evaluating` | Host pauses | Timer frozen, remaining seconds saved |
| `evaluating` | `question_active` | Host resumes | Timer resumes from saved seconds |

### Host Controls

```typescript
// From useGameStore
startGame()           // lobby → question_active
nextQuestion()        // leaderboard → question_active (or → finished if last)
showLeaderboard()     // question_active → leaderboard + broadcast rankings
endGame()             // any → finished + broadcast final rankings
pauseGame()           // question_active → evaluating (timer frozen)
resumeGame()          // evaluating → question_active (timer resumed)
setLobbyLocked(bool)  // Toggle lobby lock
setLateJoin(bool)     // Toggle late join
kickPlayer(id)        // Soft-delete player
mutePlayer(id, bool)  // Toggle player mute
```

### Timer Management

**Host side** (`useGameStore`):
```typescript
startTimer(seconds, onExpiry?) {
  stopTimer();
  set({ timeLeft: seconds });
  const interval = setInterval(() => {
    if (current <= 1) { clearInterval; set({ timeLeft: 0 }); onExpiry?.(); }
    else set({ timeLeft: current - 1 });
  }, 1000);
}
```

**Player side** (`usePlayerStore`):
- Higher-resolution timer (100ms updates) for precise `timeLeftMs`
- `questionStartTime` tracked from `current_question_started_at` DB timestamp

**Timer recovery on refresh**:
```typescript
// In loadSession() — host side
if (session.status === "question_active" && session.current_question_started_at) {
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const remaining = Math.max(0, limitSec - elapsed / 1000);
  if (remaining > 0) startTimer(remaining);
}
```

---

## 8. Realtime Communication

### Channel Architecture

```
Channel: session:{sessionId}
├── postgres_changes
│   ├── sessions (UPDATE)       → status changes, question progression
│   ├── session_players (INSERT) → new player joined
│   ├── session_players (UPDATE) → player kicked, score updated, ready state
│   └── player_answers (INSERT)  → new answer submitted (host only)
└── broadcast
    └── game_event              → LEADERBOARD / GAME_OVER rankings
```

### Event Flow

```
Host clicks "Start"
    │
    ├── DB UPDATE: sessions.status = 'question_active'
    │   └── Realtime postgres_changes → all clients
    │       ├── Host: useRealtimeGame → startTimer(duration)
    │       └── Players: usePlayerRealtime → setSession(), startTimer()
    │
Player answers
    │
    ├── DB INSERT: player_answers
    │   └── Realtime postgres_changes → host
    │       └── Host: incrementAnswered(selectedOption)
    │
    ├── DB TRIGGER: recompute_ranked_question_scores()
    │   └── Recalculates all answer scores for this question
    │
Host clicks "Show Leaderboard"
    │
    ├── DB UPDATE: sessions.status = 'leaderboard'
    ├── Host: fetchAndBroadcastLeaderboard("LEADERBOARD")
    │   ├── RPC: get_leaderboard_page() → rankings
    │   └── Broadcast on channel session:{id}: { type: "LEADERBOARD", rankings }
    │       └── All players: setLeaderboard(rankings) → rank + totalScore updated
```

### Broadcast Events

| Event | Payload | Sender | Receivers |
|-------|---------|--------|-----------|
| `LEADERBOARD` | `{ rankings: LeaderboardEntry[] }` | Host | All players |
| `GAME_OVER` | `{ final_rankings: LeaderboardEntry[] }` | Host | All players |

### Connection Management

```typescript
// Exponential backoff reconnection
channel.subscribe((status) => {
  if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
    const delay = Math.min(15000, 1000 * 2 ** Math.min(attempt, 4));
    setTimeout(() => subscribe(attempt + 1), delay);
  }
});
```

| Attempt | Delay |
|---------|-------|
| 0 | 1s |
| 1 | 2s |
| 2 | 4s |
| 3 | 8s |
| 4+ | 15s (capped) |

---

## 9. Scoring Engine

### Rank-Based Scoring

The fastest correct answer gets 100% of max points. Each subsequent correct answer receives a decreasing share:

| Answer Rank | Share of Max Points |
|-------------|-------------------|
| 1st | 100% |
| 2nd | 90% |
| 3rd | 80% |
| 4th | 70% |
| 5th | 60% |
| 6th | 50% |
| 7th | 40% |
| 8th | 30% |
| 9th+ | 20% (floor) |

**Incorrect answers**: 0 points, streak reset to 0.

### Implementation

```typescript
// @tukopamoja/shared/src/scoring.ts
export function calculateScore(input: ScoreInput): ScoreResult {
  const { maxPoints, isCorrect, answerRank, activePlayers, currentStreak } = input;

  if (!isCorrect) return { points: 0, newStreak: 0 };

  const shareIndex = Math.min(answerRank - 1, SCORING.RANK_SHARES.length - 1);
  const share = SCORING.RANK_SHARES[shareIndex] ?? SCORING.MIN_RANK_SHARE;
  const points = Math.round(maxPoints * share);
  const newStreak = currentStreak + 1;

  return { points, newStreak };
}
```

### Server-Side Recomputation

A PostgreSQL trigger fires on every `player_answers` INSERT:

```sql
CREATE FUNCTION recompute_ranked_question_scores(p_session_id UUID, p_question_index INT)
-- Ranks answers by time_taken_ms ASC (fastest first)
-- Applies RANK_SHARES ladder to correct answers
-- Updates player_answers.points_awarded
-- Recalculates session_players.score as SUM(points_awarded)
```

This ensures scores cannot be tampered with client-side — the server always has authority.

---

## 10. Scalability & Performance

### Concurrent User Handling

#### Database Optimizations
- **Connection pooling**: Supabase's built-in PgBouncer handles connection limits
- **Atomic operations**: `player_count` synced via trigger (no race conditions)
- **Indexed queries**: Session PIN lookups, player-by-session joins indexed automatically
- **Paginated leaderboard**: `get_leaderboard_page(limit, offset)` prevents loading all players at once
- **Dense ranking**: Uses PostgreSQL's `dense_rank()` window function instead of application-level sorting

#### Client-Side Optimizations
- **Parallel DB fetches**: `loadSession()` and `rejoinSession()` fetch session + players concurrently using `Promise.all()`
- **Memoized Supabase client**: Single client instance reused across all operations
- **Debounced answer submission**: `hasAnswered` flag prevents double-submit
- **Zustand selectors**: Components only re-render when their specific state slice changes

#### Realtime Optimizations
- **Single channel per session**: All postgres_changes + broadcast events share one WebSocket channel (`session:{id}`)
- **Exponential backoff reconnect**: Prevents thundering herd on reconnection (1s → 2s → 4s → 8s → 15s cap)
- **Server-side filtering**: `filter: id=eq.${sessionId}` ensures clients only receive relevant events

#### Data Lifecycle
- **Auto-archival**: `pg_cron` runs daily at 03:15 UTC — archives finished sessions older than 14 days to JSONB, then deletes originals (batch size 200)
- **Session query cache**: Client-side cache with TTL for repeated session lookups

### Capacity Guidelines

| Metric | Recommended Limit | Notes |
|--------|-------------------|-------|
| Players per session | 500 | Supabase Free tier broadcast limit |
| Concurrent sessions | 50 | Depends on Supabase plan |
| Questions per template | 100 | JSONB snapshot size concern |
| Answer rate | ~200/sec | Trigger-based rescoring adds overhead |

### Performance Checklist for Large Sessions

1. ✅ Use `get_leaderboard_page()` with pagination for sessions > 100 players
2. ✅ Broadcast leaderboard via WebSocket instead of DB polling
3. ✅ Client calculates score locally for instant feedback, server recomputes authoritatively
4. ✅ Timer recovery from DB timestamp on reconnection
5. ✅ Player arrays deduplicated with `.some()` check before append

---

## 11. Security Protocols

### Row-Level Security (RLS)

All tables have RLS enabled. Key policies:

| Table | Operation | Rule |
|-------|-----------|------|
| `organization` | SELECT | Anyone |
| `organization` | UPDATE | Admin role only |
| `profiles` | SELECT/UPDATE | Own row only (`id = auth.uid()`) |
| `templates` | SELECT | Any authenticated user |
| `templates` | INSERT/UPDATE/DELETE | Creator only (`created_by = auth.uid()`) |
| `questions` | SELECT | Creator OR published template |
| `questions` | INSERT/UPDATE/DELETE | Creator only (via template join) |
| `sessions` | SELECT | Anyone (players need PIN lookup) |
| `sessions` | INSERT/UPDATE/DELETE | Host only (`host_id = auth.uid()`) |
| `session_players` | SELECT/INSERT/UPDATE | Anyone (anonymous join) |
| `player_answers` | SELECT/INSERT | Anyone |
| `archived_sessions` | ALL | Revoked from `anon` + `authenticated`; accessed via `security definer` RPCs only |

### Input Validation

```sql
-- join_session_guarded() validates:
-- 1. Email format (regex): ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$
-- 2. Name length: 1-50 characters each
-- 3. Session exists and is joinable
-- 4. Lobby not locked
-- 5. Late join allowed (if session past lobby)
-- 6. Rate limit: max 8 join attempts per email per 60 seconds
```

### Security Hardening

- **Security-definer RPCs**: Sensitive functions (`create_session`, `recompute_ranked_question_scores`, `archive_and_cleanup_finished_sessions`) run with elevated privileges and explicit `search_path = public`
- **Security-invoker views**: Analytics views (`v_session_join_funnel`, `v_session_completion`, `v_session_dropoff`) execute under the caller's RLS context
- **Soft deletes**: Players are not deleted but marked with `kicked_at` timestamp
- **Audit logging**: All host actions logged to `host_action_logs` via `log_host_action()` RPC
- **Anti-tamper scoring**: Server-side trigger recomputes scores — client-side calculations are for instant UI feedback only
- **CORS**: Managed by Supabase; only the configured `site_url` and redirect URLs are allowed

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (safe for client) |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (for basePath derivation) |
| `NEXT_PUBLIC_MOBILE_SCHEME` | No | Mobile deep link scheme |
| `BUILD_MODE` | No | `static` (default) or `server` |

> **Never expose**: `SUPABASE_SERVICE_ROLE_KEY`, database passwords, or JWT secrets in client-side code.

---

## 12. Deployment

### Static Export (GitHub Pages)

```bash
# Build static HTML
cd packages/web
BUILD_MODE=static npx next build

# Deploy to GitHub Pages
touch out/.nojekyll
npx gh-pages -d out --dotfiles
```

The `basePath` is automatically derived from `NEXT_PUBLIC_APP_URL`:
- URL: `https://tarto-4.github.io/Tukopamoja`
- basePath: `/Tukopamoja`
- All assets served from `/Tukopamoja/_next/...`

### Docker (Static/nginx)

```dockerfile
# Dockerfile — 3-stage build
FROM node:20-alpine AS deps      # npm ci
FROM node:20-alpine AS builder   # next build (static export)
FROM nginx:1.27-alpine           # Serve from /usr/share/nginx/html
```

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  --build-arg NEXT_PUBLIC_APP_URL=... \
  -t tukopamoja .

docker run -p 80:80 tukopamoja
```

### Docker (Node.js Server)

```dockerfile
# Dockerfile.server — 4-stage build
FROM node:20-alpine AS deps       # Full install
FROM node:20-alpine AS prod-deps  # npm prune --omit=dev
FROM node:20-alpine AS builder    # BUILD_MODE=server next build
FROM node:20-alpine               # next start -p 3000
```

```bash
docker build -f Dockerfile.server \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  -t tukopamoja-server .

docker run -p 3000:3000 tukopamoja-server
```

### Docker Compose (Production)

```yaml
# docker-compose.prod.yml
services:
  web:
    build: .
    ports: ["80:80"]
    deploy:
      resources:
        limits: { memory: 256M, cpus: "0.5" }
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/healthz"]
      interval: 30s
```

### CI/CD (GitHub Actions)

Automated deployment to GitHub Pages:
```bash
# scripts/deploy-pages.sh
cd packages/web
npm run build
touch out/.nojekyll
npx gh-pages -d out --dotfiles
```

---

## 13. API Reference

### Supabase REST (PostgREST)

All tables are auto-exposed via PostgREST. Common queries:

```typescript
// Find session by PIN
const { data } = await supabase
  .from("sessions")
  .select("*")
  .eq("pin", pin)
  .in("status", ["lobby", "question_active"])
  .single();

// Get players in a session
const { data } = await supabase
  .from("session_players")
  .select("*")
  .eq("session_id", sessionId)
  .is("kicked_at", null)
  .order("score", { ascending: false });

// Submit answer
await supabase.from("player_answers").insert({
  session_id, player_id, question_index,
  selected_option, is_correct, time_taken_ms, points_awarded
});
```

### RPCs

```typescript
// Join a game
const { data } = await supabase.rpc("join_session_guarded", {
  p_pin: "123456",
  p_first_name: "John",
  p_last_name: "Doe",
  p_email: "john@example.com",
  p_avatar: "🦊"
});
// Returns: [{ session_id, player_id, session_status }]

// Get leaderboard
const { data } = await supabase.rpc("get_leaderboard_page", {
  p_session_id: sessionId,
  p_limit: 100,
  p_offset: 0
});
// Returns: [{ player_id, nickname, avatar, score, streak, rank }]

// Create session
const { data } = await supabase.rpc("create_session", {
  p_template_id: templateId,
  p_host_id: hostId
});
```

---

## 14. User Flows

### Host Flow

```
1. Login (email/password)
         │
2. Dashboard → Templates
         │
3. Create/Edit Template
   └── Add questions (MCQ / T/F)
       └── Set time limits (5-120s)
       └── Set point values
       └── Publish template
         │
4. Create Session
   └── Select template → create_session() RPC
   └── Unique 6-digit PIN generated
         │
5. Lobby
   └── Display PIN for players
   └── Toggle lobby lock / late join
   └── Kick/mute players
   └── Wait for players to be ready
         │
6. Start Game
   └── Timer starts for Q1
   └── See live answer count + distribution
   └── Controls: Show Leaderboard / Skip / End
         │
7. Between Questions
   └── Leaderboard shown to all
   └── Dancing characters animation
   └── Next question or Finish
         │
8. Game Over
   └── Podium (top 3)
   └── Final rankings broadcast
   └── Return to dashboard
```

### Player Flow

```
1. Open /join
         │
2. Enter 6-digit PIN
         │
3. Enter name + email (optional)
         │
4. Lobby — toggle "Ready"
         │
5. Question appears with timer
   └── Select one option
   └── Instant feedback (correct/wrong + points)
         │
6. Leaderboard (between questions)
   └── See rank, score, streak
   └── Wait for host to advance
         │
7. Game Over
   └── Final score + rank
   └── Auto-redirect to /join after 10s
```

### Reconnection Flow

```
Browser refresh during active game
         │
Player: loadPlayerIdentity() from localStorage
         │
rejoinSession() → parallel DB queries:
  ├── Verify session active (not finished)
  ├── Verify player not kicked
  ├── Check existing answer for current question
  └── Fetch all players for leaderboard
         │
Restore state:
  ├── hasAnswered + answerResult (if already answered)
  ├── Leaderboard + rank (if in leaderboard/evaluating)
  ├── Timer with remaining seconds (from DB timestamp)
  └── Realtime channel reconnection
```

---

## 15. Accessibility

### Implemented

- **Skip to content**: `<a href="#main-content" class="skip-to-main">` in root layout
- **Reduced motion**: All CSS animations check `@media (prefers-reduced-motion: reduce)` and disable
- **ARIA roles**: Error messages use `role="alert"`, decorative elements use `aria-hidden="true"`
- **Color contrast**: Option colors have WCAG-aware text contrast (yellow uses dark text `#1a1200`)
- **Keyboard navigation**: All buttons have focus rings (`focus-visible:ring-2`)
- **Semantic HTML**: Proper heading hierarchy, `<main>` landmark
- **No strobing**: Button animations use static glow (no infinite keyframes above 3Hz)
- **Timer bar**: Critical state animation slowed to 2s (well below WCAG 2.3.1 threshold of 3/second)

### WCAG 2.1 AA Compliance Notes

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.1.1 Non-text Content | ✅ | Alt text on images, decorative emojis hidden |
| 1.4.1 Use of Color | ✅ | Shapes (▲◆●■) accompany option colors |
| 1.4.3 Contrast | ✅ | All text meets 4.5:1 ratio |
| 2.1.1 Keyboard | ✅ | All interactive elements keyboard-accessible |
| 2.3.1 Three Flashes | ✅ | No animations exceed 3Hz |
| 2.4.1 Bypass Blocks | ✅ | Skip link present |
| 4.1.2 Name, Role, Value | ✅ | Buttons have text labels |

---

## 16. Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "Game not found" on join | PIN expired/incorrect | Check PIN is 6 digits; session may have ended |
| Timer frozen after refresh | Missing timer recovery | Timer now auto-recovers from `current_question_started_at` |
| Scores not showing on player screen | Broadcast channel mismatch | Fixed: host now broadcasts on `session:{id}` (same channel players listen on) |
| Button flickering/strobing | Infinite CSS animation + variant toggling | Fixed: replaced with static glow, no animation |
| Player can't rejoin | `kicked_at` set or session finished | Check session status; player may have been kicked |
| No favicon displayed | basePath not applied to icon URL | `withBasePath("/favicon.svg")` generates correct path |
| Build fails with env errors | Missing environment variables | Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` |
| Realtime disconnects | Network instability | Auto-reconnect with exponential backoff (up to 15s) |

### Debug Checklist

1. **Check console**: `[TUKOPAMOJA]` prefixed logs for errors
2. **Check Supabase dashboard**: Realtime inspector shows active channels
3. **Check network tab**: WebSocket connection to `wss://...supabase.co/realtime/v1/websocket`
4. **Check localStorage**: `tukopamoja_player` key should contain player identity
5. **Check session status**: Query `sessions` table for current status

---

## 17. Development Guide

### Prerequisites

- Node.js >= 20
- npm >= 9
- Docker (optional, for containerized dev)
- Supabase CLI (optional, for local DB)

### Quick Start

```bash
# Clone
git clone https://github.com/Tarto-4/Tukopamoja.git
cd Tukopamoja

# Install
npm install

# Environment
cp packages/web/.env.example packages/web/.env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL

# Run web
npm run dev:web

# Run mobile
npm run dev:mobile
```

### Docker Development

```bash
docker-compose up
# Web: http://localhost:3000
# Supabase Studio: http://localhost:54323
# DB: localhost:54322
```

### Database Migrations

```bash
# Apply all migrations
npm run db:migrate

# Reset (drops all data)
npm run db:reset

# Generate TypeScript types from schema
npm run db:types
```

### Testing

```bash
# Verify game rules
npm run test:rules

# Verify RLS policies
npm run test:rls

# Integration tests
npm run test:integration

# E2E tests
./scripts/e2e-test.sh
```

### Code Style

- **TypeScript**: Strict mode, no `any` (use `unknown` + narrowing)
- **Components**: Functional + hooks only; `"use client"` directive for client components
- **State**: Zustand stores with typed interfaces; no prop drilling
- **CSS**: Tailwind utility classes + globals.css for complex animations
- **Naming**: PascalCase components, camelCase functions/variables, UPPER_SNAKE constants

### Adding a New Feature

1. **Types**: Define types in `@tukopamoja/shared/src/types/`
2. **Database**: Create a migration in `supabase/migrations/`
3. **Backend**: Add RPC or trigger as needed
4. **Store**: Add state + actions to relevant Zustand store
5. **Component**: Create under `packages/web/src/components/`
6. **Route**: Add page under `packages/web/src/app/`
7. **Test**: Add test script or verify existing tests pass
8. **Build**: Run `npx tsc --noEmit && npx next build` to validate

---

*Document maintained by the Tukopamoja development team. For questions, contact the repository maintainers.*
