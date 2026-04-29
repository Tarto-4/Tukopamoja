# TUKOPAMOJA

**Production-ready multiplayer game platform** centered on live quiz experiences today, with the architecture already prepared for additional modes such as puzzle, chess, and word-based multiplayer.

TUKOPAMOJA is built as a branded monorepo product with a web presenter experience, a mobile player experience, shared game logic, and a Supabase backend that keeps sessions, scoring, and real-time state synchronized.

## Executive Summary

TUKOPAMOJA currently runs as a presenter-led multiplayer quiz platform.

- Hosts sign in on the web app, create templates, launch sessions, and control progression.
- Players join with a PIN or QR path and participate in real time.
- Shared code keeps scoring, types, and game rules consistent across web, mobile, and backend layers.
- Supabase provides authentication, PostgreSQL storage, row-level security, and realtime updates.
- The public landing experience already supports broader product positioning, where quiz is active and other game modes can be exposed as coming soon.

## Current Capabilities

### Host capabilities

- host authentication
- template creation and editing
- session creation from reusable templates
- presenter-controlled flow through lobby, questions, leaderboard, and finish states
- session and template refresh tools
- branding-aware dashboard experience

### Player capabilities

- join by PIN
- QR-assisted join flow
- synchronized live questions
- smooth timer experience
- explicit ranked scoring by answer order
- end-of-game summary with standings and auto-return

### Platform capabilities

- shared logic in a single monorepo
- database-backed scoring and session authority
- static web deployment for public access
- Supabase migrations for systematic backend evolution
- white-label styling and branded surfaces

## How the Project Works

At runtime, the system follows a predictable session lifecycle:

1. A host signs in on the web app.
2. The host selects or creates a quiz template.
3. Starting a game creates a session and snapshots the questions into the database.
4. Players join the session with a PIN.
5. The host starts each round.
6. Players answer in real time.
7. Scores are calculated from shared rank-based rules and persisted.
8. The host reveals the leaderboard, advances, or ends the game.
9. Players see final results and return to the join flow.

This keeps the presenter in control while the backend remains the source of truth for state and scoring.

## How It Is Systematically Built

The project is organized as a monorepo so every layer can evolve together.

### Product surfaces

- `packages/web` — Next.js presenter dashboard and public web routes
- `packages/mobile` — Expo/React Native player app
- `packages/shared` — shared types, constants, realtime contracts, and scoring

### Backend platform

- `supabase` — migrations, policies, SQL functions, and backend data rules

### Delivery model

- npm workspaces coordinate builds and scripts
- Supabase CLI manages schema rollout
- GitHub workflows handle deployment automation

This separation gives the project a clean structure:

- UI is platform-specific
- rules are centralized
- data is authoritative in PostgreSQL
- realtime events keep all clients aligned

## Workflow and System Connections

### Development workflow

1. Define rules and contracts in shared code.
2. Implement host features in web.
3. Implement player features in mobile.
4. Add database changes as versioned Supabase migrations.
5. Validate with builds and scripted checks.
6. Deploy web and push backend migrations.

### Runtime workflow

1. Host logs in.
2. Host opens templates.
3. Host starts a session.
4. Players join.
5. Host launches question.
6. Players submit answers.
7. Scores and rankings update.
8. Host shows leaderboard.
9. Host advances or finishes.

### How everything is connected

- **Web app** controls hosting, dashboard management, and public access routes.
- **Mobile app** handles the player-side live game experience.
- **Shared package** prevents rule drift by keeping score logic and types in one place.
- **Supabase** stores templates, sessions, players, and answers while broadcasting state changes.

## Required Improvements

The project is already solid, but the next important improvements are:

1. keep documentation aligned with current implementation
2. reduce generated export warnings and metadata noise
3. deepen CI coverage for migrations, builds, and deployment checks
4. improve observability and production diagnostics
5. expand authoring tools with better media and bulk operations
6. strengthen moderation, admin controls, and analytics

## Future Implementations

The architecture supports broader multiplayer growth.

### Near-term roadmap

- puzzle mode
- chess mode
- word-based multiplayer mode
- richer host analytics
- stronger branding controls
- richer player history and profiles

### Longer-term opportunities

- team play
- tournaments and brackets
- spectator mode
- classroom or training mode
- notifications and announcements
- adaptive difficulty and richer ranking models

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        MONOREPO                             │
│                                                             │
│  packages/shared    — Types, scoring, constants             │
│  packages/web       — Next.js 14 App Router (Host)         │
│  packages/mobile    — React Native Expo (Player)            │
│  supabase/          — Migrations, RLS, functions            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Supabase   │
                    │  PostgreSQL  │
                    │  + Realtime  │
                    │  + Storage   │
                    │  + Auth      │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼──────┐    │   ┌────────▼──────┐
     │   Next.js     │    │   │  React Native │
     │  Host Web App │    │   │  Player App   │
     │  (Dashboard + │    │   │  (Expo)       │
     │   Live Host)  │    │   │               │
     └───────────────┘    │   └───────────────┘
                          │
                   Supabase Realtime
                   (postgres_changes
                    + broadcast)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Web (Host)** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Framer Motion |
| **Mobile (Player)** | React Native (Expo 52), Expo Router |
| **State Management** | Zustand (both frontends) |
| **Backend** | Supabase (PostgreSQL 15) |
| **Realtime** | Supabase Realtime (postgres_changes + broadcast) |
| **Auth** | Supabase Auth (email/password) |
| **Storage** | Supabase Storage (logos, media) |

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ organization │     │   profiles   │     │  templates   │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │     │ id (PK/FK)   │────>│ id (PK)      │
│ name         │     │ email        │     │ created_by   │
│ logo_url     │     │ full_name    │     │ title        │
│ primary_color│     │ role         │     │ description  │
│ secondary_   │     └──────────────┘     │ question_cnt │
│   color      │                          │ play_count   │
│ font_family  │                          └──────┬───────┘
└──────────────┘                                 │
                                                 │ 1:N
                                          ┌──────▼───────┐
                                          │  questions   │
                                          │──────────────│
                                          │ id (PK)      │
                                          │ template_id  │
                                          │ question_text│
                                          │ options JSONB│
                                          │ time_limit   │
                                          │ points       │
                                          │ sort_order   │
                                          └──────────────┘

┌──────────────┐     ┌────────────────┐     ┌────────────────┐
│   sessions   │     │session_players │     │player_answers  │
│──────────────│     │────────────────│     │────────────────│
│ id (PK)      │────>│ id (PK)        │────>│ id (PK)        │
│ template_id  │     │ session_id     │     │ session_id     │
│ host_id      │     │ nickname       │     │ player_id      │
│ pin (unique) │     │ score          │     │ question_index │
│ status       │     │ streak         │     │ selected_option│
│ current_q_idx│     │ rank           │     │ is_correct     │
│ questions_   │     └────────────────┘     │ time_taken_ms  │
│   snapshot   │                            │ points_awarded │
└──────────────┘                            └────────────────┘
```

### Key Design Decisions

1. **Template → Session separation**: Templates are reusable blueprints. When "Start Game" is clicked, `create_session()` snapshots the questions into `sessions.questions_snapshot` (JSONB). This ensures template edits never affect an in-progress game.

2. **Scoring in PostgreSQL**: the scoring model is mirrored between `packages/shared/src/scoring.ts` and Supabase migration functions that rescore answers. The current implementation is explicit rank-based scoring: 1st = 100%, 2nd = 90%, 3rd = 80%, tapering down to a 20% floor for later valid answers.

3. **Single-row organization table**: Since this is single-tenant (one company), branding lives in a simple table with one row.

---

## Real-Time Event Architecture

### Channel Design

```
Channel: session:{sessionId}
├── postgres_changes (sessions table)     → Status transitions
├── postgres_changes (session_players)    → Player joins
├── postgres_changes (player_answers)     → Answer tracking (host)
└── broadcast (game_event)                → Leaderboard, game over
```

### State Machine & Event Flow

```
                   Host clicks
                   "Start Game"
                        │
  ┌──────┐    DB UPDATE │     ┌─────────────────┐
  │LOBBY │──────────────┼────>│ QUESTION_ACTIVE  │
  └──────┘              │     └────────┬─────────┘
     ▲                  │              │
     │                  │     Players answer
     │                  │     (INSERT player_answers)
     │                  │              │
     │                  │     Timer expires / all answered
     │                  │              │
     │                  │     ┌────────▼─────────┐
     │                  │     │   EVALUATING     │
     │                  │     └────────┬─────────┘
     │                  │              │
     │                  │     Host clicks "Leaderboard"
     │                  │              │
     │                  │     ┌────────▼─────────┐
     │                  │     │  LEADERBOARD     │◄── broadcast rankings
     │                  │     └────────┬─────────┘
     │                  │              │
     │                  │     Host clicks "Next"
     │                  │     ┌────────▼────┐
     │                  └─────│ More Qs?    │
     │                        │  YES → loop │
     │                        │  NO ↓       │
     │                        └────────┬────┘
     │                                 │
     │                        ┌────────▼─────────┐
     │                        │    FINISHED       │
     │                        └──────────────────┘
     │
     └── reset
```

### Event Types (in packages/shared/src/types/realtime.ts)

| Direction | Event | Trigger |
|-----------|-------|---------|
| Host → All | `GAME_STATE` | Session row UPDATE |
| Host → All | `QUESTION_START` | `current_q_index` changes |
| Host → All | `QUESTION_END` | Status → evaluating |
| Server → All | `LEADERBOARD` | Broadcast with rankings |
| Server → All | `GAME_OVER` | Broadcast with final rankings |
| Player → Host | `PLAYER_JOIN` | INSERT session_players |
| Player → Host | `PLAYER_ANSWER` | INSERT player_answers |

---

## QR Code Deep Linking

```
Host Screen                    Player Phone
┌──────────────┐              ┌──────────────┐
│              │   QR Code    │              │
│  Generates   │─────────────>│  Scans QR    │
│  QR with URL:│              │              │
│  https://    │              │  1. App installed?
│  domain.com/ │              │     YES → quizarena://join?pin=123456
│  join?pin=   │              │     NO  → Opens web /join?pin=123456
│  123456      │              │            (shows "Download App" + PIN)
│              │              │              │
└──────────────┘              └──────────────┘
```

- QR points to `https://your-domain.com/join?pin=XXXXXX`
- iOS: Associated Domains intercepts → opens app with pin param
- Android: Intent filter intercepts → opens app with pin param
- Fallback: Web page at `/join` shows PIN and "Open in App" button

---

## Project Structure

```
quizarena/
├── package.json                    # Workspace root
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   └── migrations/
│       ├── 00001_create_schema.sql
│       └── 00002_create_rls_policies.sql
│
├── packages/
│   ├── shared/                     # Shared code
│   │   └── src/
│   │       ├── constants.ts
│   │       ├── scoring.ts
│   │       └── types/
│   │           ├── database.ts
│   │           └── realtime.ts
│   │
│   ├── web/                        # Next.js Host Dashboard
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/login/
│   │       │   ├── (dashboard)/templates|sessions|branding/
│   │       │   ├── host/[sessionId]/
│   │       │   └── join/
│   │       ├── components/
│   │       │   ├── ui/             # shadcn/ui
│   │       │   ├── quiz-builder/
│   │       │   └── host/
│   │       ├── stores/             # Zustand
│   │       ├── hooks/
│   │       └── lib/supabase/
│   │
│   └── mobile/                     # React Native Player App
│       ├── app/
│       │   ├── index.tsx           # Join screen
│       │   └── game/index.tsx      # Live game
│       ├── components/
│       ├── stores/                 # Zustand
│       ├── hooks/
│       └── lib/
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase CLI (`npm i -g supabase`)
- Docker (for local Supabase)

### Setup

```bash
git clone https://ens.ghe.com/tmongwe/quizarena.git
cd quizarena
npm install

# Start Supabase
supabase start

# Configure env
npm run setup:env
# Edit with values from `supabase status` and your LAN app URL

# Run migrations
npm run db:migrate

# Start web
npm run dev:web     # → http://localhost:3000

# Start mobile (separate terminal)
npm run dev:mobile  # → Expo DevTools
```

Required web env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MOBILE_SCHEME`

If the app throws an environment configuration runtime error, run:

```bash
npm run setup:env
```

Then fill `packages/web/.env.local` with real values and restart `npm run dev:web`.

Note: development mode falls back to safe local defaults if env vars are missing; production remains strict and fails fast.

---

## Exact Launch Sequence (Host + Player)

Use this sequence when running locally and testing with a presenter + participants.

### 1) Start all services

Open 3 terminals from repository root:

```bash
# Terminal 1: backend
supabase start

# Terminal 2: web host dashboard
npm run dev:web

# Terminal 3: mobile player app (Expo)
npm run dev:mobile
```

### 2) Open Host Dashboard (presenter side)

1. Open `http://localhost:3000/auth/login`
2. Sign in
3. Go to **Templates**
4. Create a template (or open existing)
5. Click **Save Template**
6. Click **Start Game**

This opens the host presenter screen at `/host?sessionId=...` where you can:
- watch players join in lobby
- start the first question
- move to leaderboard
- launch next question
- finish game

### 3) Join as a player (same device or different device)

#### Option A — Real mobile app (recommended for testing)

1. Install/open **Expo Go** on the phone
2. From Terminal 3, scan the Expo QR and open the mobile app
3. On host screen, scan the game QR or manually type the PIN in mobile app
4. Tap **Join Game**

#### Option B — QR from host on devices without app installed

If the app is not installed/published yet, QR opens web fallback `/join/?pin=...`.
That page shows the PIN and an Expo Go link. In this case:

1. Install/open Expo Go
2. Launch mobile app from Expo
3. Enter shown PIN manually

### 4) Presenter controls during game

From host screen:
- **Start Game** begins question 1
- **Show Leaderboard** transitions to rankings
- **Next Question** advances to next question
- **End Game / Finish** completes the session

### 5) Common issues checklist

- If players do not appear: verify `supabase start` is running
- If login fails: verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- If cross-device fails: run web with LAN access and set `NEXT_PUBLIC_APP_URL` to reachable URL
- If QR opens fallback only: app is not installed yet (expected in dev)

---

## Scoring Algorithm

TUKOPAMOJA currently uses explicit **rank-based multiplayer scoring** for correct answers.

```
1st correct answer  = 100%
2nd correct answer  = 90%
3rd correct answer  = 80%
4th correct answer  = 70%
5th correct answer  = 60%
6th correct answer  = 50%
7th correct answer  = 40%
8th correct answer  = 30%
9th+ correct answer = 20%
Wrong or late       = 0%
```

Example with `1000` max points:

| Rank | Share | Points |
|------|-------|--------|
| 1 | 100% | 1000 |
| 2 | 90% | 900 |
| 3 | 80% | 800 |
| 4 | 70% | 700 |
| 5 | 60% | 600 |
| 9+ | 20% | 200 |

This makes the scoring transparent, competitive, and easy for players to understand.

---

## Publishing to GitHub

### 1. Create the GitHub Repository

```bash
# Option A: Using GitHub CLI (recommended)
gh repo create quizarena --private --source=. --push

# Option B: Manual
# 1. Go to https://ens.ghe.com/new
# 2. Create a new PRIVATE repository named "quizarena"
# 3. Do NOT add README, .gitignore, or license (we have those already)
# 4. Then push:
git init
git add .
git commit -m "Initial commit: TUKOPAMOJA monorepo"
git branch -M main
git remote add origin https://ens.ghe.com/tmongwe/quizarena.git
git push -u origin main
```

### 2. Protect Secrets

Add these as **Repository Secrets** in GitHub (Settings → Secrets and variables → Actions):

| Secret | Value | Where to find |
|--------|-------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Dashboard → Settings → API |
| `SUPABASE_PROJECT_ID` | `xxxxxxxxxxxx` | Supabase Dashboard → Settings → General |
| `SUPABASE_ACCESS_TOKEN` | Personal access token | Supabase Dashboard → Account → Access Tokens |
| `SUPABASE_DB_PASSWORD` | Your DB password | Set during project creation |
| `EXPO_TOKEN` | EAS token | https://expo.dev/accounts/settings |

Add this as a **Repository Variable**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | Your GitHub Pages production URL |

For local/CI deterministic integration tests:

| Secret/Env | Purpose |
|------------|---------|
| `QUIZARENA_SUPABASE_ANON_KEY` | Used by `scripts/e2e-test.sh` |
| `QUIZARENA_SUPABASE_URL` | Optional Supabase base URL override (default `http://127.0.0.1:54321`) |
| `QUIZARENA_WEB_URL` | Optional web URL override for smoke checks (default `http://localhost:3000`) |
| `QUIZARENA_WEB_CHECKS` | Optional route checks in E2E (`1` = enable, default `0`) |

### 3. Set Up Supabase (Production)

```bash
# 1. Create a project at https://supabase.com/dashboard
# 2. Link your local project to the remote
supabase link --project-ref YOUR_PROJECT_ID

# 3. Push the schema migrations
supabase db push

# 4. Run the seed data (optional — creates default org row)
# Copy contents of supabase/seed.sql into Supabase SQL Editor and run

# 5. Configure Auth
#    - Go to Supabase Dashboard → Auth → URL Configuration
#    - Set Site URL to your deployed web app URL
#    - Add Redirect URLs: https://your-domain.com/**
```

---

## Deploying the Web App on GitHub (Detailed)

This project is configured for static export + GitHub Pages using:

- `.github/workflows/deploy-pages.yml`
- `.github/workflows/deploy-public-pages.yml`
- `packages/web/next.config.js` with `output: "export"`

### External Access with Enterprise GitHub (Recommended)

If your enterprise GitHub Pages domain requires authentication, external players cannot access the app directly.

Use a **public mirror repo** for static hosting:

1. Keep source code in this private enterprise repo
2. Create a public GitHub.com repo (for example: `tmongwe/quizarena-public`)
3. Enable GitHub Pages on the public repo from branch `gh-pages`
4. Run workflow `.github/workflows/deploy-public-pages.yml` from this repo

Required settings in this enterprise repo (**Settings → Secrets and variables → Actions**):

Secrets:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-supabase-project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `PUBLIC_PAGES_PAT` | GitHub PAT with write access to the public mirror repo |

Variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_APP_URL` | Public Pages URL (for example `https://<user>.github.io/<public-repo>`) |
| `PUBLIC_PAGES_REPO` | Public mirror repo in `owner/repo` format |

Optional local fallback (if runners are unavailable):

```bash
PUBLIC_PAGES_REPO=owner/repo npm run deploy:public-pages
```

### Step 1 — Confirm repository and default branch

1. Repository exists on enterprise GitHub: `https://ens.ghe.com/tmongwe/quizarena`
2. Default branch is `main`
3. Your latest local fixes are pushed to `main`

### Step 1.5 — Confirm self-hosted runner availability

Current workflows run on `self-hosted` runners. Ensure at least one runner is online for this repo and has:

1. Node.js 20+
2. npm available
3. Supabase CLI (for migration workflow)
4. Network egress to GitHub + Supabase

### Step 2 — Enable GitHub Pages via Actions

1. Open repository settings on enterprise GitHub
2. Go to **Pages**
3. Under **Build and deployment**, choose:
   - **Source**: `GitHub Actions`

This allows workflow `.github/workflows/deploy-pages.yml` to publish site artifacts.

### Step 3 — Add required repository secrets and variables

Go to **Settings → Secrets and variables → Actions**.

Add **Secrets**:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-supabase-project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

Add **Variable**:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_APP_URL` | Your final GitHub Pages URL |

Set `NEXT_PUBLIC_APP_URL` to your real Pages URL (including repo path if your enterprise Pages requires one). This value is used to generate QR join links.

### Step 4 — Trigger deployment

Any push to `main` touching web/shared files triggers deployment automatically.

Manual trigger options:

1. **Actions** tab
2. Select **Deploy Web to GitHub Pages**
3. Click **Run workflow**

### Step 5 — Verify deployment status

In Actions, verify both jobs pass:

1. `build`
2. `deploy`

On success, GitHub shows deployed page URL in workflow summary/environment.

### Step 6 — Post-deploy validation

Open deployed URL and verify:

1. Login page opens: `/auth/login/`
2. Template list opens: `/dashboard/templates/`
3. Create template + start game works
4. Host page opens: `/host/?sessionId=...`
5. QR points to deployed `/join/?pin=...` URL

### Step 7 — Configure Supabase Auth for deployed domain

In Supabase Dashboard:

1. **Authentication → URL Configuration**
2. Set **Site URL** to deployed Pages URL
3. Add redirect URL pattern for your deployed domain/path

Without this, auth callbacks/session behavior can fail in production.

### Step 8 — Update when URL changes

If repository name, domain, or Pages path changes:

1. Update `NEXT_PUBLIC_APP_URL` repository variable
2. Re-run workflow
3. Re-test QR join

### Troubleshooting deployment

- **404 on app routes**: confirm static export build succeeded and site path is correct
- **Login fails in production**: check Supabase URL/anon key secrets and Auth URL config
- **QR opens wrong host**: `NEXT_PUBLIC_APP_URL` not set correctly
- **Actions not running**: verify Pages source is set to GitHub Actions

---

## Deploying the Mobile App

### EAS Build (Expo Application Services)

```bash
# 1. Install EAS CLI
npm i -g eas-cli

# 2. Log in to Expo
eas login

# 3. Configure builds (from packages/mobile)
cd packages/mobile
eas build:configure

# 4. Build for both platforms
eas build --platform ios     # Requires Apple Developer account ($99/yr)
eas build --platform android # Generates APK or AAB

# 5. Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Internal Distribution (No App Store needed)

For company-internal use, build a distributable APK/IPA:

```bash
# Android APK (sideload)
eas build --platform android --profile preview

# iOS Ad Hoc (requires provisioning profile)
eas build --platform ios --profile preview
```

### GitHub Actions for Mobile Builds

Create `.github/workflows/build-mobile.yml`:

```yaml
name: Build Mobile App

on:
  push:
    branches: [main]
    paths:
      - 'packages/mobile/**'
      - 'packages/shared/**'

jobs:
  build:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - run: npm ci

      - name: Build Android
        working-directory: packages/mobile
        run: eas build --platform android --profile preview --non-interactive

      - name: Build iOS
        working-directory: packages/mobile
        run: eas build --platform ios --profile preview --non-interactive
```

---

## Database Migrations CI

Create `.github/workflows/migrate-db.yml`:

```yaml
name: Run DB Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link Supabase project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

---

## Environment Variables Summary

### packages/web/.env.local

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_MOBILE_SCHEME=quizarena
```

### packages/mobile (via EAS secrets or app.json extra)

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
EXPO_PUBLIC_APP_URL=https://your-domain.com
```

---

## Deterministic Test Commands

```bash
# Verify scoring and session flow rules
npm run test:rules

# Verify RLS migration coverage
npm run test:rls

# Run end-to-end deterministic smoke flow
# Requires QUIZARENA_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
npm run test:integration

# Run both checks
npm run test:all
```

---

## Accessibility and Operations Artifacts

- Accessibility audit checklist and remediation tracker: `docs/accessibility-audit.md`
- Structured logging and monitoring baseline: `docs/observability.md`
- Production incident and recovery runbook: `docs/operations-runbook.md`

---

## Complete Deployment Checklist

- [ ] Create Supabase project on [supabase.com](https://supabase.com)
- [ ] Run database migrations (`supabase db push`)
- [ ] Run seed SQL to create organization row
- [ ] Create a GitHub repo and push code
- [ ] Add repository secrets in GitHub Settings
- [ ] Confirm self-hosted runner is online
- [ ] Deploy web via public mirror workflow (`deploy-public-pages.yml`)
- [ ] Set environment variables in your deploy target
- [ ] Update `NEXT_PUBLIC_APP_URL` to deployed URL
- [ ] Configure Supabase Auth redirect URLs
- [ ] Build mobile app with EAS (`eas build`)
- [ ] Distribute mobile app (APK sideload or App Store)
- [ ] Run `npm run test:all`
- [ ] Create first admin user (sign up via the login page)
- [ ] Configure branding in dashboard

---

## License

Private — Internal use only.

## Author

- Tmongwe
