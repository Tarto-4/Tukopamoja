# TUKOPAMOJA — Project Manual

> **Version**: 1.0 · **Date**: May 2026 · **Author**: Tmongwe  
> **Classification**: Internal — ENS Africa

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Scope & Objectives](#2-project-scope--objectives)
3. [Architecture Overview](#3-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Repository Structure](#5-repository-structure)
6. [Database Design](#6-database-design)
7. [Game Mechanics & Scoring](#7-game-mechanics--scoring)
8. [Real-Time Communication](#8-real-time-communication)
9. [Authentication & Security](#9-authentication--security)
10. [Environment Configuration](#10-environment-configuration)
11. [Development Workflow](#11-development-workflow)
12. [Build & Deployment](#12-build--deployment)
13. [CI/CD Pipelines](#13-cicd-pipelines)
14. [Design System & Branding](#14-design-system--branding)
15. [Accessibility](#15-accessibility)
16. [Observability & Monitoring](#16-observability--monitoring)
17. [Operations Runbook](#17-operations-runbook)
18. [Project Timeline & Milestones](#18-project-timeline--milestones)
19. [Roadmap](#19-roadmap)
20. [Stakeholder Roles & Responsibilities](#20-stakeholder-roles--responsibilities)
21. [Risk Register](#21-risk-register)
22. [FAQ & Concerns](#22-faq--concerns)
23. [Glossary](#23-glossary)
24. [Appendices](#24-appendices)

---

## 1. Executive Summary

**TUKOPAMOJA** is a production-ready, real-time multiplayer quiz platform developed for ENS Africa. The name means "We are together" in Swahili and reflects the collaborative nature of the platform.

The platform enables a host to create quiz templates, launch live game sessions, and engage audiences of up to 200 concurrent players through presenter-led rounds. Players join via a 6-digit PIN or QR code on any device — web browser or native mobile app — and compete in real-time with ranked scoring, live leaderboards, and post-game feedback.

### Key Capabilities

| Capability | Description |
|---|---|
| **Quiz Hosting** | Create reusable templates, launch sessions, control game flow in real time |
| **Player Experience** | Join via PIN/QR, answer questions under time pressure, view leaderboard |
| **Multiplayer Scoring** | Rank-based scoring that rewards speed — first correct answer gets full points |
| **Real-Time Sync** | All clients stay synchronised via Supabase Realtime (WebSocket) |
| **Cross-Platform** | Web (Next.js) + Mobile (React Native/Expo) sharing a common type layer |
| **Feedback System** | Post-game star ratings and comments from players to hosts |
| **Branding** | Single-tenant branding with custom logo, colours, and tagline |

### Deliverables

- Production web application at `https://tarto-4.github.io/Tukopamoja/`
- Mobile companion app (iOS + Android via Expo)
- PostgreSQL database with RLS policies and automated migrations
- CI/CD pipelines for build, deploy, and database migration
- Docker configurations for development, static hosting, and server mode
- Comprehensive documentation suite

---

## 2. Project Scope & Objectives

### 2.1 In Scope

| Area | Details |
|---|---|
| **Host Dashboard** | Template CRUD (create, edit, delete, publish), session management, branding configuration, session history |
| **Live Game Engine** | Session lifecycle (lobby → questions → leaderboard → game over), host controls (next question, skip, end), real-time player synchronisation |
| **Player Flows** | Join via PIN or QR, name entry, avatar selection, live question answering, leaderboard view, game-over screen with feedback |
| **Question Types** | Multiple choice, true/false, text input |
| **Scoring** | Rank-based multiplayer scoring (first correct = 100%, diminishing for slower responders) |
| **Authentication** | Email/password sign-up and sign-in for hosts via Supabase Auth |
| **Branding** | Single-tenant organisation branding (logo, colours, tagline) propagated across all screens |
| **Feedback** | Post-game rating (5 or 10 star scale) with optional comments |
| **Deployment** | GitHub Pages (primary), Docker (secondary), Vercel (configured) |
| **Mobile App** | Expo-based React Native app for iOS and Android player experience |

### 2.2 Out of Scope (Current Phase)

| Area | Status |
|---|---|
| Puzzle Rush game mode | Architecture prepared, UI removed, awaiting implementation |
| Chess Duel game mode | Planned for future phase |
| Word Sprint game mode | Planned for future phase |
| Multi-tenant / multi-organisation | Single-tenant only in current release |
| Payment / subscription billing | Not applicable |
| Offline play | Requires active network connection |
| Video/audio streaming | Text and image-based questions only |

### 2.3 Objectives

1. **Engagement**: Enable live, interactive quiz sessions for up to 200 concurrent players
2. **Ease of Use**: Hosts can create and launch a quiz in under 5 minutes
3. **Cross-Platform Reach**: Accessible from any modern browser and native mobile apps
4. **Reliability**: Zero data loss during active sessions with real-time synchronisation
5. **Security**: Row-level security on all database tables, authenticated host access
6. **Maintainability**: Monorepo with shared types, automated CI/CD, comprehensive documentation

---

## 3. Architecture Overview

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│                                                         │
│  ┌──────────────┐    ┌──────────────────┐              │
│  │   Web App    │    │   Mobile App     │              │
│  │  (Next.js)   │    │  (Expo / RN)     │              │
│  │  Host + Join │    │  Player only     │              │
│  └──────┬───────┘    └────────┬─────────┘              │
│         │     Shared Types    │                         │
│         └────────┬────────────┘                         │
│                  │                                      │
│         ┌────────▼────────┐                             │
│         │ @tukopamoja/    │                             │
│         │    shared       │                             │
│         └────────┬────────┘                             │
└──────────────────┼──────────────────────────────────────┘
                   │ HTTPS + WebSocket
┌──────────────────┼──────────────────────────────────────┐
│                  │     BACKEND LAYER                    │
│         ┌────────▼────────┐                             │
│         │    Supabase     │                             │
│         │  ┌────────────┐ │                             │
│         │  │  Auth       │ │  Email/password, MFA       │
│         │  ├────────────┤ │                             │
│         │  │  PostgREST  │ │  Auto-generated REST API   │
│         │  ├────────────┤ │                             │
│         │  │  Realtime   │ │  WebSocket (postgres_changes│
│         │  │             │ │  + broadcast)              │
│         │  ├────────────┤ │                             │
│         │  │  Storage    │ │  Logo/image uploads        │
│         │  ├────────────┤ │                             │
│         │  │  PostgreSQL │ │  15.x with RLS + triggers  │
│         │  └────────────┘ │                             │
│         └─────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Runtime Flow

1. **Host signs in** on the web app → authenticates via Supabase Auth
2. **Host creates/selects a quiz template** → templates and questions stored in PostgreSQL
3. **Host starts a session** → `create_session()` RPC snapshots questions into the session, generates a unique 6-digit PIN
4. **Players join** via PIN or QR code on web or mobile → inserted into `session_players`
5. **Host controls game flow** → advances through states: `lobby` → `question_active` → `evaluating` → `leaderboard` → `finished`
6. **Players answer** → answers stored in `player_answers`, scored via rank-based algorithm
7. **All clients stay synchronised** via Supabase Realtime channels
8. **Game ends** → final leaderboard displayed, optional feedback collected

### 3.3 State Machine

```
lobby ──► question_active ──► evaluating ──► leaderboard ──┐
                                                            │
              ┌─────────────────────────────────────────────┘
              │
              ▼
         question_active  (next question — loops back)
              │
              ▼
          finished  (all questions answered or host ends early)
```

---

## 4. Technology Stack

### 4.1 Frontend — Web

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.2 | App Router, static export or server mode |
| React | 18.3 | UI framework |
| TypeScript | 5.5 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui (Radix) | Latest | Accessible component primitives |
| Framer Motion | 12.x | Animations and transitions |
| anime.js | 4.4 | Complex animation sequences |
| Zustand | 5.x | Global state management |
| qrcode | 1.5 | QR code generation for session PINs |
| Lucide React | 0.468 | Icon library |

### 4.2 Frontend — Mobile

| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.76.6 | Cross-platform native UI |
| Expo | ~52 | Build toolchain, managed workflow |
| Expo Router | ~4 | File-based navigation |
| React Native Reanimated | ~3.16 | High-performance animations |
| Expo Camera | Latest | QR code scanning |
| Zustand | 5.x | Shared state management pattern |

### 4.3 Backend

| Technology | Version | Purpose |
|---|---|---|
| Supabase | Cloud | Backend-as-a-Service |
| PostgreSQL | 15.x | Primary database |
| PostgREST | Auto | Auto-generated REST API |
| Supabase Realtime | Auto | WebSocket pub/sub |
| Supabase Auth | Auto | Authentication (email/password) |
| Supabase Storage | Auto | File/image uploads |

### 4.4 Shared

| Package | Purpose |
|---|---|
| `@tukopamoja/shared` | TypeScript types, constants, scoring logic, option colours, medals, question defaults |

### 4.5 Infrastructure

| Tool | Purpose |
|---|---|
| GitHub Actions | CI/CD pipelines |
| GitHub Pages | Primary static hosting |
| Docker | Containerised deployment (nginx or Node.js) |
| Vercel | Alternative deployment (configured) |
| npm workspaces | Monorepo management |

---

## 5. Repository Structure

```
quizarena/
├── .github/workflows/          # CI/CD pipeline definitions
│   ├── ci.yml                  # Lint, typecheck, build, Docker test
│   ├── deploy.yml              # Docker push + manual Pages deploy
│   ├── deploy-pages.yml        # GitHub Pages (actions/deploy-pages)
│   ├── deploy-public-pages.yml # Mirror to public repo gh-pages
│   └── migrate-db.yml          # Supabase migration push
├── designs/                    # Design assets and guidelines
│   ├── backgrounds/            # Background images
│   ├── favicon/                # Favicon assets
│   ├── guides/                 # Brand direction documents
│   ├── logo/                   # Logo files (SVG, PNG)
│   ├── uiux/                   # UI/UX reference documentation
│   └── uploads/                # Uploaded media assets
├── docker/
│   └── nginx.conf              # nginx config for static Docker mode
├── docs/                       # Project documentation
│   ├── accessibility-audit.md  # WCAG compliance tracking
│   ├── high-end-roadmap.md     # Feature and quality roadmap
│   ├── observability.md        # Logging and monitoring standards
│   ├── operations-runbook.md   # Deployment and incident procedures
│   └── PROJECT-MANUAL.md       # This document
├── packages/
│   ├── mobile/                 # Expo React Native app (player)
│   │   ├── app/                # Expo Router screens
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Supabase client, utilities
│   │   └── stores/             # Zustand stores
│   ├── shared/                 # Shared TypeScript package
│   │   └── src/                # Types, constants, scoring
│   └── web/                    # Next.js web application
│       ├── public/             # Static assets (favicon, manifest)
│       ├── scripts/            # Build/deploy helper scripts
│       └── src/
│           ├── app/            # Next.js App Router pages
│           ├── components/     # React components
│           │   ├── host/       # Host game screens
│           │   ├── player/     # Player game screens
│           │   ├── quiz-builder/ # Template editor
│           │   ├── theme/      # Theme provider
│           │   └── ui/         # Shared UI primitives
│           ├── hooks/          # Custom hooks (realtime, auth)
│           ├── lib/            # Supabase client, utilities
│           ├── stores/         # Zustand stores
│           └── styles/         # Global CSS (Tailwind layers)
├── scripts/                    # Root-level automation scripts
├── supabase/
│   ├── config.toml             # Supabase local config
│   ├── seed.sql                # Database seed (template)
│   └── migrations/             # SQL migration files (21 total)
├── Dockerfile                  # Production static (nginx)
├── Dockerfile.dev              # Development (hot-reload)
├── Dockerfile.server           # Production server (Node.js)
├── docker-compose.yml          # Dev environment
├── docker-compose.prod.yml     # Production static
├── docker-compose.server.yml   # Production server
├── package.json                # Root workspace config
├── vercel.json                 # Vercel deployment config
└── DEPLOYMENT.md               # Deployment documentation
```

---

## 6. Database Design

### 6.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ organization │     │   profiles   │     │  templates   │
│              │     │              │◄────┤              │
│ id (PK)      │     │ id (PK/FK)   │     │ id (PK)      │
│ name         │     │ email        │     │ created_by   │──► profiles.id
│ tagline      │     │ full_name    │     │ title        │
│ logo_url     │     │ avatar_url   │     │ description  │
│ primary_color│     │ role         │     │ is_published │
│ secondary_   │     │ created_at   │     │ question_count│
│   color      │     └──────────────┘     │ play_count   │
│ font_family  │                          └──────┬───────┘
└──────────────┘                                 │
                                                 │ 1:N
                                          ┌──────▼───────┐
                                          │  questions   │
                                          │              │
                                          │ id (PK)      │
                                          │ template_id  │──► templates.id
                                          │ question_text│
                                          │ question_type│
                                          │ time_limit   │
                                          │ points       │
                                          │ options (jsonb)│
                                          └──────────────┘

┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   sessions   │     │ session_players  │     │player_answers│
│              │     │                  │     │              │
│ id (PK)      │────►│ id (PK)          │────►│ id (PK)      │
│ template_id  │     │ session_id (FK)  │     │ session_id   │
│ host_id      │     │ first_name       │     │ player_id    │
│ pin (unique) │     │ last_name        │     │ question_idx │
│ status       │     │ avatar           │     │ selected_opt │
│ current_q_idx│     │ score            │     │ is_correct   │
│ player_count │     │ streak           │     │ time_taken_ms│
│ questions_   │     │ rank             │     │ points_awarded│
│   snapshot   │     │ is_ready         │     │ answered_at  │
│ started_at   │     │ is_muted         │     └──────────────┘
│ ended_at     │     └──────────────────┘
└──────────────┘

┌──────────────────┐
│session_feedback  │
│                  │
│ id (PK)          │
│ session_id (FK)  │
│ player_id (FK)   │
│ rating           │
│ comment          │
│ created_at       │
└──────────────────┘
```

### 6.2 Key Tables

#### `organization` — Single-row branding

Single-tenant company branding. One row per deployment.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | uuid | auto | Primary key |
| `name` | text | `'TUKOPAMOJA'` | Organisation display name |
| `tagline` | text | `'Real-time Quiz Platform'` | Subtitle / tagline |
| `logo_url` | text | null | Supabase Storage logo URL |
| `primary_color` | text | `'#8E191E'` | Brand primary colour |
| `secondary_color` | text | `'#C9A84C'` | Brand secondary colour |
| `font_family` | text | `'Inter'` | Display font |

#### `profiles` — Host accounts

Auto-created on sign-up via database trigger.

| Column | Type | Description |
|---|---|---|
| `id` | uuid (FK → auth.users) | Matches Supabase Auth user |
| `email` | text | User email |
| `full_name` | text | Display name |
| `role` | text | `'admin'` or `'host'` |

#### `templates` — Quiz blueprints

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `created_by` | uuid (FK → profiles) | Owner |
| `title` | text | Quiz title |
| `description` | text | Optional description |
| `is_published` | boolean | Whether visible for session creation |
| `question_count` | int | Denormalised, auto-synced via trigger |
| `play_count` | int | Incremented on each session creation |

#### `questions` — Template questions

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `template_id` | uuid (FK → templates) | Parent template |
| `question_text` | text | The question prompt |
| `question_type` | enum | `multiple_choice`, `true_false`, `text_input` |
| `time_limit_sec` | int (5–120) | Seconds allowed, default 20 |
| `points` | int | Max points, default 1000 |
| `options` | jsonb | Array of `{ text, is_correct }` objects |
| `sort_order` | int | Display order |

#### `sessions` — Live game instances

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `pin` | text (unique) | 6-digit game PIN |
| `status` | enum | `lobby`, `question_active`, `evaluating`, `leaderboard`, `finished` |
| `current_q_index` | int | Current question (-1 = not started) |
| `player_count` | int | Auto-synced via trigger |
| `questions_snapshot` | jsonb | Frozen copy of questions at session start |

#### `session_players` — Players in a session

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `session_id` | uuid (FK → sessions) | Parent session |
| `first_name` | text | Player first name |
| `last_name` | text | Player last name |
| `avatar` | text | Emoji avatar (default `'🎮'`) |
| `score` | int | Running total score |
| `streak` | int | Consecutive correct answers |
| `rank` | int | Current leaderboard rank |

#### `player_answers` — Per-question responses

| Column | Type | Description |
|---|---|---|
| `session_id` | uuid | Session reference |
| `player_id` | uuid | Player reference |
| `question_index` | int | Which question |
| `selected_option` | int | Index into options array |
| `is_correct` | boolean | Whether the answer was correct |
| `time_taken_ms` | int | Milliseconds to answer |
| `points_awarded` | int | Points earned for this answer |

### 6.3 SQL Functions

| Function | Purpose |
|---|---|
| `generate_unique_pin()` | Generates a unique 6-digit PIN (loops until no collision with active sessions) |
| `create_session(template_id, host_id)` | Snapshots questions → creates session → generates PIN → increments play_count |
| `calculate_score(...)` | Computes rank-based score from answer position and correctness |
| `sync_question_count()` | Trigger: keeps `templates.question_count` in sync |
| `set_updated_at()` | Trigger: auto-touches `updated_at` on mutated rows |
| `join_session(...)` | Player join with validation (session exists, is in lobby, not full) |
| `submit_answer(...)` | Validates and records a player's answer |

### 6.4 Migrations

21 migration files covering schema evolution from initial creation through player scaling, feedback, and text answers. All migrations are idempotent and applied via `supabase db push`.

---

## 7. Game Mechanics & Scoring

### 7.1 Rank-Based Scoring

Points are awarded based on the order in which correct answers are received. The first player to answer correctly receives the maximum points; subsequent correct answers receive progressively less.

| Finish Position | Score Share | Example (1000 max) |
|---|---|---|
| 1st correct | 100% | 1,000 |
| 2nd correct | 90% | 900 |
| 3rd correct | 80% | 800 |
| 4th correct | 70% | 700 |
| 5th correct | 60% | 600 |
| 6th correct | 50% | 500 |
| 7th correct | 40% | 400 |
| 8th correct | 30% | 300 |
| 9th+ correct | 20% (floor) | 200 |
| Incorrect / no answer | 0% | 0 |

### 7.2 Question Types

| Type | Description | How It's Scored |
|---|---|---|
| **Multiple Choice** | 2–6 options, one correct | Player taps an option; matched against `is_correct` flag |
| **True / False** | Two options (true/false) | Same as multiple choice with 2 options |
| **Text Input** | Free-text answer field | Matched against accepted answer(s); case-insensitive |

### 7.3 Time Limits

Each question has a configurable time limit (5–120 seconds, default 20). The timer is synchronised across all clients via real-time state updates. If a player does not answer within the time limit, they receive 0 points.

### 7.4 Session Capacity

The platform supports up to **200 concurrent players** per session, validated at the database level.

---

## 8. Real-Time Communication

### 8.1 Channel Structure

Each active session uses a dedicated Supabase Realtime channel: `session:{sessionId}`

### 8.2 Event Types

| Mechanism | Table Watched | Events | Direction |
|---|---|---|---|
| `postgres_changes` | `sessions` | Status updates, question index changes | Host → All clients |
| `postgres_changes` | `session_players` | Player joins, score updates | Player → Host |
| `postgres_changes` | `player_answers` | Answer submissions | Player → Host |
| `broadcast` | (channel) | Custom game events (leaderboard, game over) | Server → All |

### 8.3 Client Synchronisation

- **Host** subscribes to player joins and answer submissions
- **Players** subscribe to session status changes (question start, time up, leaderboard)
- Both sides handle reconnection gracefully — Supabase Realtime auto-reconnects on transient failures
- State is always recoverable from the database (the source of truth)

---

## 9. Authentication & Security

### 9.1 Authentication

| Feature | Implementation |
|---|---|
| **Host Sign-Up** | Email + password via Supabase Auth |
| **Email Confirmation** | Enabled; OTP length 8 |
| **MFA (TOTP)** | Enabled and available for enrolment |
| **Session Management** | Supabase-managed JWT tokens (auto-refresh) |
| **Player Access** | Anonymous — players join via PIN without creating an account |

### 9.2 Security Measures

| Layer | Control |
|---|---|
| **Database** | Row-Level Security (RLS) enabled on all tables |
| **API** | Only anon key exposed to clients (service role key never in frontend) |
| **Auth Redirects** | Restricted to configured URLs in `supabase/config.toml` |
| **Docker** | Non-root containers (UID 1001), no secrets baked into images |
| **nginx** | Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |
| **Secrets** | `.env.production` gitignored; CI secrets managed via GitHub Secrets |
| **Input Validation** | Client-side form validation + server-side SQL constraints |
| **CORS** | Configured in Supabase project settings |

### 9.3 RLS Policy Summary

| Table | Who Can Read | Who Can Write |
|---|---|---|
| `organization` | Everyone (authenticated) | Admins only |
| `profiles` | Own profile | Auto-created on sign-up |
| `templates` | Own templates | Own templates |
| `questions` | Via template ownership | Via template ownership |
| `sessions` | Host (own) + players (joined) | Host (own session) |
| `session_players` | Session participants | Join via RPC |
| `player_answers` | Session participants | Answer via RPC |

---

## 10. Environment Configuration

### 10.1 Required Variables

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://xxxxx.supabase.co` | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `eyJhbGci...` | Supabase anonymous API key |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://tarto-4.github.io/Tukopamoja` | Public URL of the deployed application |
| `NEXT_PUBLIC_MOBILE_SCHEME` | No | `tukopamoja` | Deep-link scheme for mobile app |

### 10.2 Environment Files

| File | Purpose | Git Status |
|---|---|---|
| `.env.local` | Local development overrides | Gitignored |
| `.env.production` | Production values for local builds | Gitignored |
| `.env.docker` | Docker compose environment | Gitignored |

### 10.3 Validation

Environment variables are validated at build time by `scripts/validate-env.mjs`. In production mode (`--production`), the script rejects localhost URLs and verifies all required variables are present.

```bash
# Development
npm run validate-env

# Production (strict)
npm run validate-env:prod
```

### 10.4 CI/CD Secrets

| Secret | Used By |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Build workflows |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build workflows |
| `SUPABASE_PROJECT_ID` | Migration workflow |
| `SUPABASE_ACCESS_TOKEN` | Migration workflow |
| `SUPABASE_DB_PASSWORD` | Migration workflow |
| `PUBLIC_PAGES_PAT` | Public mirror deploy |

| Variable | Used By |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Build workflows |
| `PUBLIC_PAGES_REPO` | Public mirror deploy |
| `WORKFLOW_RUNNER` | Runner selection override |

---

## 11. Development Workflow

### 11.1 Prerequisites

- **Node.js** 20.x
- **npm** 10.x+
- **Git**
- **Supabase CLI** (for local database development)

### 11.2 Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd quizarena

# Install all workspace dependencies
npm ci

# Set up local environment variables
npm run setup:env
# → Creates .env.local from template; fill in Supabase credentials

# Start local Supabase (optional — for local DB development)
supabase start

# Start the web development server
npm run dev:web
# → http://localhost:3000

# Start the mobile development server (separate terminal)
npm run dev:mobile
```

### 11.3 Available Scripts

| Script | Description |
|---|---|
| `npm run dev:web` | Start Next.js dev server (hot-reload) |
| `npm run dev:mobile` | Start Expo development server |
| `npm run build:web` | Build static export |
| `npm run build:shared` | Build shared package |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run validate-env` | Validate environment variables |
| `npm run validate-env:prod` | Validate for production |
| `npm run db:migrate` | Push database migrations |
| `npm run db:reset` | Reset local database |
| `npm run db:types` | Generate TypeScript types from DB schema |
| `npm run test:rules` | Verify game scoring rules |
| `npm run test:rls` | Verify RLS policies |
| `npm run test:integration` | Run integration tests |
| `npm run test:all` | Run all test suites |

### 11.4 Docker Development

```bash
# Start full development environment (web + postgres + studio)
docker compose up

# Access:
# Web:     http://localhost:3000
# Studio:  http://localhost:54323
# API:     http://localhost:54321
```

### 11.5 Git Workflow

- **Main branch**: `main` — all CI/CD triggers from here
- **Commit convention**: `type: description` (e.g., `fix:`, `feat:`, `refactor:`, `ci:`, `docs:`)
- **Remotes**:
  - `origin` — Enterprise GitHub (`ens.ghe.com`)
  - `public` — Public mirror (`github.com/Tarto-4/Tukopamoja`)
- **Push to both**: Code is pushed to both remotes after each meaningful change

---

## 12. Build & Deployment

### 12.1 Build Modes

| Mode | Trigger | Output | Hosting |
|---|---|---|---|
| **Static Export** (default) | `BUILD_MODE=static` | `packages/web/out/` (HTML/CSS/JS) | GitHub Pages, nginx, S3, CDN |
| **Server Mode** | `BUILD_MODE=server` | Node.js application | Docker, VPS, cloud VMs |

### 12.2 Deployment Targets

#### A. GitHub Pages (Primary — Current Production)

**URL**: `https://tarto-4.github.io/Tukopamoja/`

Deployed via:
1. Automated: `deploy-pages.yml` workflow (triggers on push to `main`)
2. Manual: Local build + force-push to `gh-pages` branch

```bash
# Manual deploy
npm run build:web
cd packages/web
TMPDIR=$(mktemp -d)
cp -a out/* "$TMPDIR"
cd "$TMPDIR"
git init && git checkout -b gh-pages
git add -A && git commit -m "deploy"
git remote add origin https://github.com/Tarto-4/Tukopamoja.git
git push origin gh-pages --force
```

#### B. Docker — Static (nginx)

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  -t tukopamoja-web .

docker run -p 3000:80 tukopamoja-web
```

#### C. Docker — Server (Node.js)

```bash
docker build -f Dockerfile.server \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  -t tukopamoja-web .

docker run -p 3000:3000 tukopamoja-web
```

#### D. Vercel

Configured via `vercel.json`. Build command: `npm run build:web`, output: `packages/web/out`.

---

## 13. CI/CD Pipelines

### 13.1 Pipeline Overview

```
Push to main
    │
    ├──► CI Workflow
    │    ├── Lint & Typecheck (shared + web)
    │    ├── Build Static Site (depends on quality)
    │    └── Docker Build Test (depends on quality)
    │
    ├──► Deploy Pages Workflow
    │    ├── Build static export
    │    └── Deploy via actions/deploy-pages@v4
    │
    ├──► Deploy Workflow
    │    └── Build & push Docker image to GHCR
    │
    └──► Migrate DB Workflow (only if migrations/ changed)
         ├── Check secrets exist
         ├── Link Supabase project
         └── Push migrations
```

### 13.2 Workflow Details

| Workflow | File | Trigger | Jobs |
|---|---|---|---|
| **CI** | `ci.yml` | Push/PR to `main` | quality → build + docker (parallel) |
| **Deploy Pages** | `deploy-pages.yml` | Push to `main` (web/shared paths) | build → deploy |
| **Deploy Public Pages** | `deploy-public-pages.yml` | Push to `main` (web/shared paths) | Build + force-push to public mirror |
| **Deploy** | `deploy.yml` | Push to `main` + manual dispatch | Docker build + GHCR push |
| **Migrate DB** | `migrate-db.yml` | Push to `main` (migrations/ path) + manual | Supabase CLI migration push |

### 13.3 Pipeline Health

All workflows are configured to pass gracefully when optional secrets are not configured (e.g., the DB migration workflow skips when Supabase credentials are absent on the public mirror repo).

---

## 14. Design System & Branding

### 14.1 Colour Palette

| Token | Hex | Usage |
|---|---|---|
| **Primary (Tuko Yellow)** | `#EEDC00` | Primary actions, highlights, brand |
| **ENS Crimson** | `#8E191E` | Legacy brand colour |
| **Carbon Black** | `#111111` | Dark backgrounds |
| **Slate Deep** | `#3A3A3C` | Secondary text |
| **Prestige Gold** | `#C9A84C` | Achievement accents |
| **Off White** | `#F5F5F3` | Light backgrounds |

#### Quiz Answer Colours

| Colour | Hex | Position |
|---|---|---|
| Red | `#E8003E` | Option A |
| Blue | `#0A62FF` | Option B |
| Yellow | `#FF9F00` | Option C |
| Green | `#00A854` | Option D |

### 14.2 Typography

**Font Family**: Outfit (sans, display, and serif roles)  
**Weights**: 200 (light), 400 (regular), 500 (medium), 700 (bold)  
**Loaded via**: Google Fonts CDN

### 14.3 Spacing & Sizing

- **Base unit**: 8px grid system
- **Border radius tokens**: Small (8px), medium (12px), large (16px), XL (24px)
- **Container**: Centred, `max-width: 1400px`, responsive padding

### 14.4 Surface Treatments

| Surface | Dark Mode | Light Mode |
|---|---|---|
| **Glass** | Blur 40px, saturate 180%, semi-transparent dark | White, solid border |
| **Card** | Dark slate with subtle border | White with light shadow |
| **Gradient Dark** | Deep indigo/purple gradient | Clean white (#F8F9FA) |

### 14.5 Theme System

- **Dark mode** (default): Class-based (`html.dark`)
- **Light mode**: Class-based (`html.light`)
- **Toggled** via `ThemeProvider` component with localStorage persistence
- **CSS variables**: Full shadcn HSL variable system for all semantic colours

---

## 15. Accessibility

### 15.1 Completed

| Item | Status |
|---|---|
| Colour contrast tokens centralised | ✅ |
| Visible focus styles (`.btn-3d:focus-visible`) | ✅ |
| `prefers-reduced-motion` globally applied | ✅ |
| Skip-to-main-content link | ✅ |
| Semantic HTML landmarks | ✅ |
| `aria-label` on game controls | ✅ |

### 15.2 Outstanding

| Item | Priority |
|---|---|
| Full keyboard-only flow verification | High |
| Screen reader labels on all icon-only controls | High |
| `aria-live` regions for score/state transitions | Medium |
| Contrast verification on gradient backgrounds | Medium |
| Heading hierarchy audit (all pages) | Low |

### 15.3 Target Standard

WCAG 2.1 Level AA compliance across all interactive flows.

---

## 16. Observability & Monitoring

### 16.1 Logging Standards

| Field | Purpose |
|---|---|
| `event` | What happened (e.g., `session.created`, `player.joined`) |
| `level` | Severity: `info`, `warn`, `error` |
| `sessionId` | Game session context |
| `playerId` | Player context |
| `route` | Current page/screen |
| `timestamp` | ISO 8601 |
| `errorCode` | Machine-readable error identifier |

### 16.2 Key Events to Capture

| Event | Trigger |
|---|---|
| `session.created` | Host starts a new game |
| `session.finished` | Game completes |
| `player.joined` | Player enters lobby |
| `player.left` | Player disconnects |
| `answer.submitted` | Player submits an answer |
| `answer.failed` | Answer submission error |
| `auth.signin` | Host signs in |
| `auth.failed` | Authentication failure |
| `realtime.connected` | WebSocket connection established |
| `realtime.disconnected` | WebSocket connection lost |

### 16.3 Alert Thresholds

| Metric | Alert Condition |
|---|---|
| Realtime disconnect rate | >5 disconnects/min in a session |
| Session start failure rate | >2 failures in 10 mins |
| Player join failure rate | >5 failures in 5 mins |
| Build/deploy failure | Any failure on main branch |

### 16.4 Privacy

- **Never** log tokens, keys, or passwords
- **Redact** email addresses in logs
- Log **IDs and aggregates only** — no PII in plain text

---

## 17. Operations Runbook

### 17.1 Pre-Deploy Checklist

- [ ] Run `npm run validate-env:prod` — all environment variables present
- [ ] Run `npm run build:web` — clean build with no errors
- [ ] Run `npm run test:all` — all tests pass
- [ ] Confirm CI workflows are green on `main`
- [ ] Verify GitHub Secrets are current

### 17.2 Deploy Procedure

1. Merge/push changes to `main`
2. CI pipeline validates (lint, typecheck, build)
3. Deploy Pages workflow builds and deploys to GitHub Pages
4. Verify live routes: `/`, `/auth/login/`, `/join/`, `/dashboard/`

### 17.3 Incident Response

#### Realtime Degradation

1. Check Supabase status page
2. Verify WebSocket connections in browser DevTools (Network → WS)
3. Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
4. Test locally to isolate — is it Supabase or the deployed app?

#### Authentication Failures

1. Verify Supabase Auth redirect URLs include the production domain
2. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` secrets match the project
3. Test sign-in flow in an incognito window

#### Migration Failures

1. Review the `migrate-db.yml` workflow logs
2. Confirm `SUPABASE_PROJECT_ID`, `SUPABASE_ACCESS_TOKEN`, and `SUPABASE_DB_PASSWORD` secrets are set
3. Validate the SQL locally: `supabase db push --dry-run`
4. Check for enum conflicts or dependency ordering issues

### 17.4 Post-Incident Review

1. Write a timeline of events
2. Identify root cause
3. Assess user impact
4. Define corrective actions
5. Assign follow-up owner
6. Update this runbook if procedures need revision

---

## 18. Project Timeline & Milestones

### 18.1 Completed Milestones

| Milestone | Date | Deliverables |
|---|---|---|
| **M1 — Foundation** | April 2026 | Database schema, auth, core types, monorepo structure |
| **M2 — Host Dashboard** | April 2026 | Template CRUD, quiz builder, branding configuration |
| **M3 — Live Game Engine** | April 2026 | Session lifecycle, real-time sync, host controls, player flows |
| **M4 — Scoring & Leaderboard** | April 2026 | Rank-based scoring, live leaderboard, game-over screens |
| **M5 — Player Scaling** | May 2026 | 200-player support, performance optimisation |
| **M6 — Text Answers & Feedback** | May 2026 | Text input question type, post-game feedback system |
| **M7 — Brand Polish** | May 2026 | Logo display, light/dark mode consistency, responsive backgrounds |
| **M8 — CI/CD & Documentation** | May 2026 | All pipelines green, project manual, deployment docs |

### 18.2 Current Phase

**Phase: Production Stabilisation & Polish**

Focus areas:
- Responsive design optimisation
- Cross-browser/device testing
- Accessibility improvements
- Documentation completeness

### 18.3 Upcoming Milestones

| Milestone | Target | Scope |
|---|---|---|
| **M9 — Accessibility** | TBD | WCAG 2.1 AA compliance, keyboard navigation, screen reader support |
| **M10 — Analytics** | TBD | Host analytics dashboard, session history drill-down, CSV/PDF export |
| **M11 — Advanced Questions** | TBD | Multiple-select, ordering, matching pairs, numeric input |
| **M12 — Game Modes** | TBD | Puzzle Rush, Chess Duel, Word Sprint modes |

---

## 19. Roadmap

### 19.1 Product Features

| Priority | Feature | Description |
|---|---|---|
| High | **Host Analytics** | Active players, drop-off rates, response time heatmaps |
| High | **Session History** | Drill-down into past sessions, top players, replay data |
| High | **Export** | CSV and PDF export of session results |
| Medium | **New Question Types** | Multiple-select, ordering/ranking, matching pairs, numeric |
| Medium | **Moderation** | Nickname moderation, kick/mute, lock lobby, pause/resume |
| Medium | **Onboarding** | First-run checklist, contextual tooltips, help centre |
| Low | **Puzzle Rush** | Competitive timed puzzle solving mode |
| Low | **Chess Duel** | Turn-based and speed chess mode |
| Low | **Word Sprint** | Fast-paced word game mode |

### 19.2 Engineering Quality

| Priority | Item |
|---|---|
| High | End-to-end tests for web + mobile (happy + failure paths) |
| High | Contract tests (web/mobile ↔ Supabase RPCs) |
| Medium | Load tests for realtime spikes and latency budgets (p95) |
| Medium | Gated deploy pipeline with automated rollback |
| Low | Formal threat model and quarterly penetration tests |

### 19.3 Long-Term Vision

- **Team Play**: Players form teams within a session
- **Tournaments / Brackets**: Multi-round elimination format
- **Spectator Mode**: Read-only viewing of live games
- **Classroom Mode**: Educational features (progress tracking, homework)
- **Adaptive Difficulty**: Questions adjust based on player performance
- **Notifications**: Push notifications for game invitations
- **Player Profiles**: Persistent player accounts with history and stats

---

## 20. Stakeholder Roles & Responsibilities

| Role | Responsibilities |
|---|---|
| **Project Owner** | Define scope, approve milestones, make priority decisions |
| **Lead Developer** | Architecture decisions, code review, CI/CD management, deployment |
| **Host Users** | Create templates, run live sessions, provide feedback on UX |
| **Player Users** | Participate in sessions, provide feedback via in-app ratings |
| **Design** | Brand guidelines, UI/UX direction, accessibility standards |
| **Infrastructure** | Supabase project management, DNS, domain configuration |
| **QA / Testing** | Verify functionality, report bugs, validate accessibility |

### 20.1 Communication Channels

| Channel | Purpose | Frequency |
|---|---|---|
| GitHub Issues | Bug reports, feature requests | As needed |
| Git Commits | Change tracking, code review | Per change |
| Project Manual (this doc) | Reference documentation | Updated per milestone |
| Operations Runbook | Incident response procedures | Updated per incident |

---

## 21. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Supabase outage** | Low | High | Monitor status page; document incident procedures; consider multi-region in future |
| **Realtime disconnections** | Medium | Medium | Auto-reconnect built into Supabase client; state recoverable from DB |
| **Database migration failure** | Low | Medium | Dry-run migrations locally; CI checks for secrets; idempotent SQL |
| **Secret exposure** | Low | Critical | Secrets in GitHub Secrets only; `.env.production` gitignored; rotate on exposure |
| **Player capacity exceeded** | Low | Medium | 200-player limit enforced at DB level; monitor session sizes |
| **Browser compatibility** | Medium | Low | Tailwind CSS handles cross-browser; test on Chrome, Safari, Firefox, Edge |
| **Mobile app store rejection** | Low | Medium | Follow Expo guidelines; test on physical devices before submission |
| **Enterprise GHE runners unavailable** | Known | Low | Actions disabled on enterprise repo; use public repo for CI/CD |

---

## 22. FAQ & Concerns

### General

**Q: What is TUKOPAMOJA?**  
A: TUKOPAMOJA is a real-time multiplayer quiz platform built for ENS Africa. It allows a host to create quiz templates, launch live sessions, and engage up to 200 players who join via a 6-digit PIN or QR code.

**Q: What does "TUKOPAMOJA" mean?**  
A: It means "We are together" in Swahili, reflecting the collaborative and interactive nature of the platform.

**Q: Who are the target users?**  
A: Hosts are ENS Africa staff who create and run quiz sessions (e.g., for training, team building, or events). Players are anyone invited to participate — colleagues, clients, or event attendees.

**Q: Is this a public product or internal tool?**  
A: It is an internal tool for ENS Africa. The repository is private. A public mirror exists solely for GitHub Pages hosting.

---

### For Hosts

**Q: How do I create a quiz?**  
A: Sign in at the web app → navigate to Templates → click "New Template" → add questions with options → publish the template → go to Host and start a session.

**Q: How many questions can I add?**  
A: There is no hard limit on the number of questions per template. Practical sessions typically have 10–30 questions.

**Q: Can I reuse a quiz template?**  
A: Yes. Templates are reusable. Each time you start a session, the questions are snapshotted so you can edit the template without affecting running or past sessions.

**Q: Can I edit questions during a live session?**  
A: No. Questions are frozen when the session starts. Edit the template and start a new session to use updated questions.

**Q: How do players join?**  
A: Share the 6-digit PIN displayed on the lobby screen. Players enter it at the `/join` page or scan the QR code with the mobile app.

**Q: What happens if a player disconnects?**  
A: Their submitted answers are preserved. If they reconnect before the session ends, they rejoin automatically. Unanswered questions during disconnection score 0.

**Q: Can I remove a disruptive player?**  
A: Yes. The host lobby shows all connected players with Mute and Kick controls.

**Q: How is the winner decided?**  
A: The player with the highest total score across all questions wins. Scores are based on a rank system — the first correct answer gets the most points.

**Q: Can I export results?**  
A: Results export (CSV/PDF) is on the roadmap but not yet implemented. Currently, results are visible on the game-over screen and in the session history on the dashboard.

**Q: Can I customise branding?**  
A: Yes. Navigate to Dashboard → Branding to upload a logo, set organisation name, and configure brand colours. These propagate to all game screens.

---

### For Players

**Q: Do I need an account to play?**  
A: No. Players join anonymously by entering a game PIN and their name. No sign-up required.

**Q: What devices can I use?**  
A: Any device with a modern web browser (Chrome, Safari, Firefox, Edge) or the TUKOPAMOJA mobile app (iOS/Android).

**Q: How do I join a game?**  
A: Go to the join page (shared by your host) → enter the 6-digit PIN → enter your name → wait in the lobby until the host starts the game.

**Q: What if I answer incorrectly?**  
A: You receive 0 points for that question. Your streak resets. You can still earn points on subsequent questions.

**Q: Is my feedback anonymous?**  
A: Feedback is linked to your player session but is only visible to the host. Your name and rating are stored for the host's review.

**Q: Can I play on my phone in landscape mode?**  
A: Yes. The interface adapts to both portrait and landscape orientations on all screen sizes.

---

### Technical

**Q: What tech stack does TUKOPAMOJA use?**  
A: Next.js 14 (web), Expo/React Native (mobile), Supabase (PostgreSQL + Auth + Realtime), TypeScript, Tailwind CSS, Zustand, Framer Motion. See [Section 4](#4-technology-stack) for the full stack.

**Q: How is the database managed?**  
A: PostgreSQL hosted on Supabase. Schema changes are managed via SQL migration files in `supabase/migrations/`. Migrations are pushed via `supabase db push` — either locally or through the CI/CD pipeline.

**Q: How do I add a new migration?**  
A: Create a new SQL file in `supabase/migrations/` following the naming convention `YYYYMMDDHHMMSS_description.sql`. Push to `main` and the `migrate-db.yml` workflow will apply it automatically (if Supabase secrets are configured).

**Q: Why are there multiple Dockerfiles?**  
A: Three Dockerfiles serve different purposes:
- `Dockerfile` — Production static build served via nginx (port 80)
- `Dockerfile.dev` — Development with hot-reload via volume mounts
- `Dockerfile.server` — Production Node.js server mode (port 3000, supports SSR/middleware)

The primary deployment is static to GitHub Pages; Docker configs exist for alternative hosting scenarios.

**Q: How does the static export work with dynamic routes?**  
A: Next.js `output: "export"` generates static HTML for all pages. Dynamic data (templates, sessions, players) is fetched client-side via Supabase. The basePath is derived from `NEXT_PUBLIC_APP_URL`.

**Q: How is real-time sync handled?**  
A: Supabase Realtime uses PostgreSQL's logical replication to push database changes to connected clients via WebSocket. The app subscribes to `postgres_changes` on the `sessions`, `session_players`, and `player_answers` tables, plus `broadcast` for custom game events.

**Q: What happens if Supabase goes down?**  
A: Active sessions would be interrupted. The database is the source of truth — once Supabase recovers, clients can reconnect and state is restored. See the [Operations Runbook](#17-operations-runbook) for incident procedures.

**Q: How do I run the app locally?**  
A: See [Section 11 — Development Workflow](#11-development-workflow). In short: `npm ci`, configure `.env.local` with Supabase credentials, then `npm run dev:web`.

**Q: Why are GitHub Actions disabled on the enterprise repo?**  
A: The enterprise GitHub instance (ens.ghe.com) does not have hosted runners available. All CI/CD runs on the public mirror (github.com/Tarto-4/Tukopamoja) where GitHub-hosted runners are active.

**Q: How do I deploy a new version?**  
A: Push to `main` on both remotes. The CI validates and the deploy-pages workflow publishes to GitHub Pages automatically. For immediate manual deploy, build locally and force-push to `gh-pages`. See [Section 12.2](#122-deployment-targets).

**Q: What's the difference between `origin` and `public` remotes?**  
A: `origin` points to the enterprise GitHub (ens.ghe.com) for code storage. `public` points to github.com/Tarto-4/Tukopamoja for CI/CD and GitHub Pages hosting. Both should be kept in sync.

---

### Security

**Q: Is player data encrypted?**  
A: Data in transit is encrypted via HTTPS/WSS (TLS). Data at rest is managed by Supabase's infrastructure, which uses encrypted storage.

**Q: Can players see other players' answers?**  
A: No. RLS policies ensure players can only read their own answers. Leaderboard data (scores, ranks) is shared but individual answer choices are not.

**Q: What happens if the anon key is leaked?**  
A: The anon key only grants access allowed by RLS policies — it cannot bypass row-level security. However, it should still be rotated immediately via the Supabase dashboard. Update the GitHub Secrets and redeploy.

**Q: Is there rate limiting?**  
A: Supabase provides built-in rate limiting on auth endpoints. Custom rate limiting on game RPCs is on the roadmap.

---

### Deployment & Infrastructure

**Q: What is the production URL?**  
A: `https://tarto-4.github.io/Tukopamoja/`

**Q: What is the Supabase project region?**  
A: Sydney (ap-southeast-2). Project ID: `kqembfhanjfspfovzapu`.

**Q: How much does hosting cost?**  
A: GitHub Pages hosting is free. Supabase free tier covers the current usage. Costs would increase if scaling beyond Supabase free-tier limits.

**Q: Can we migrate to a different hosting provider?**  
A: Yes. The static export can be hosted anywhere (Vercel, Netlify, S3, nginx). The Docker configurations support VPS, Kubernetes, and cloud VM deployment. Supabase can be self-hosted if needed.

**Q: Is there a staging environment?**  
A: Not currently. The development flow is local → push to `main` → deploy. A staging environment with a separate Supabase project is recommended for the next phase.

---

## 23. Glossary

| Term | Definition |
|---|---|
| **Template** | A reusable quiz blueprint containing questions and settings |
| **Session** | A single live game instance created from a template |
| **PIN** | A 6-digit numeric code used by players to join a session |
| **Host** | The authenticated user who creates and controls a quiz session |
| **Player** | An anonymous participant who joins a session and answers questions |
| **Lobby** | The waiting room state before the host starts the game |
| **Snapshot** | A frozen copy of template questions stored with the session at creation time |
| **RLS** | Row-Level Security — PostgreSQL feature that restricts data access per user |
| **Realtime** | Supabase's WebSocket-based system for pushing database changes to clients |
| **Broadcast** | A Supabase Realtime feature for sending custom events to all channel subscribers |
| **Streak** | Consecutive correct answers by a player (historically used for bonus multiplier) |
| **Rank-based scoring** | Scoring system where points depend on the order of correct answers, not just correctness |
| **Static export** | Next.js build mode that outputs plain HTML/CSS/JS files without a Node.js server |
| **BasePath** | URL prefix (e.g., `/Tukopamoja`) required for GitHub Pages sub-path hosting |
| **Glass surface** | A semi-transparent UI surface with backdrop blur, used in the dark theme |
| **Game screen** | A full-viewport layout used for all game states (lobby, question, leaderboard) |

---

## 24. Appendices

### Appendix A — Database Migration History

| # | Migration File | Description |
|---|---|---|
| 1 | `00001_create_schema.sql` | Core tables, functions, triggers |
| 2 | `00002_create_rls_policies.sql` | Row-level security policies |
| 3 | `00003_player_count_sync.sql` | Auto-sync player count on session |
| 4 | `00004_refresh_brand_defaults.sql` | Reset branding to defaults |
| 5 | `20260423_set_public_auth_redirects.sql` | Configure auth redirect URLs |
| 6 | `20260424_backfill_profiles.sql` | Backfill profiles + insert policy |
| 7 | `20260424_enable_realtime.sql` | Enable Realtime on tables |
| 8 | `20260424_advanced_interactivity.sql` | Host controls (mute, kick, ready) |
| 9 | `20260424_ranked_scoring.sql` | Rank-based scoring by answer speed |
| 10 | `20260424_adjust_scoring_curve.sql` | Tune scoring percentages |
| 11 | `20260424_explicit_rank_ladder.sql` | Fixed rank → percentage ladder |
| 12 | `20260424_fix_join_session.sql` | Fix session_id parameter ambiguity |
| 13 | `20260427_fix_rls_views.sql` | RLS + security invoker views |
| 14 | `20260428_reset_host_history.sql` | Reset host play history RPC |
| 15 | `20260429_rename_brand.sql` | Rename brand to TUKOPAMOJA |
| 16 | `20260429_name_surname.sql` | Replace nickname with first/last name |
| 17 | `20260429_data_management.sql` | Data management policies + RPCs |
| 18 | `20260506_auth_redirects.sql` | Update auth redirect URLs |
| 19 | `20260507_scale_200.sql` | Scale to 200 concurrent players |
| 20 | `20260507_fix_branding_rls.sql` | Fix branding RLS policies |
| 21 | `20260507_text_and_feedback.sql` | Text input answers + feedback system |

### Appendix B — CI/CD Secrets Reference

| Secret / Variable | Where Set | Used By |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | GitHub Secrets | CI build, Deploy Pages, Deploy Public Pages |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub Secrets | CI build, Deploy Pages, Deploy Public Pages |
| `NEXT_PUBLIC_APP_URL` | GitHub Variables | CI build, Deploy Pages, Deploy Public Pages |
| `SUPABASE_PROJECT_ID` | GitHub Secrets | Migrate DB |
| `SUPABASE_ACCESS_TOKEN` | GitHub Secrets | Migrate DB |
| `SUPABASE_DB_PASSWORD` | GitHub Secrets | Migrate DB |
| `PUBLIC_PAGES_PAT` | GitHub Secrets | Deploy Public Pages |
| `PUBLIC_PAGES_REPO` | GitHub Variables | Deploy Public Pages |
| `WORKFLOW_RUNNER` | GitHub Variables | Runner override (default: `ubuntu-latest`) |

### Appendix C — Useful Commands Quick Reference

```bash
# Development
npm run dev:web                    # Start web dev server
npm run dev:mobile                 # Start mobile dev server
npm run build:web                  # Build static export
npm run lint                       # Lint all workspaces
npm run typecheck                  # Typecheck all workspaces

# Database
npm run db:migrate                 # Push migrations to Supabase
npm run db:reset                   # Reset local database
npm run db:types                   # Generate TS types from schema

# Testing
npm run test:all                   # Run all test suites
npm run test:rules                 # Verify scoring rules
npm run test:rls                   # Verify RLS policies

# Deployment
npm run deploy:pages               # Deploy to GitHub Pages
npm run deploy:public-pages        # Deploy to public mirror
npm run validate-env:prod          # Validate production env vars

# Docker
docker compose up                  # Start dev environment
docker compose -f docker-compose.prod.yml up    # Start production (nginx)
docker compose -f docker-compose.server.yml up  # Start production (Node.js)
```

---

*This manual is a living document. Update it when milestones are completed, architecture changes, or new answers to common questions emerge.*
