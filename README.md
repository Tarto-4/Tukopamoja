# QuizArena

**Production-ready, white-label Kahoot clone** — real-time quiz platform with a Next.js Host Dashboard, React Native Player App, and Supabase backend.

Built for single-tenant (company) deployment with deep branding customization.

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

2. **Scoring in PostgreSQL**: `calculate_score()` is a database function that mirrors the TypeScript implementation in `packages/shared/src/scoring.ts`. Score = `floor(max_points × max(0, 1 − timeTaken / (2 × timeLimit)))` with streak multiplier (capped at 1.5×).

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
cp packages/web/.env.example packages/web/.env.local
# Edit with Supabase URL and anon key from `supabase status`

# Run migrations
npm run db:migrate

# Start web
npm run dev:web     # → http://localhost:3000

# Start mobile (separate terminal)
npm run dev:mobile  # → Expo DevTools
```

---

## Scoring Algorithm

```
Base = floor(MaxPts × max(0, 1 − timeTaken / (2 × timeLimit)))
Multiplier = min(1.5, 1 + (streak − 1) × 0.1)
Score = floor(Base × Multiplier)
```

| Speed | Points (1000 max) | With 3-streak |
|-------|-------------------|---------------|
| Instant | 1000 | 1200 |
| Half time | 750 | 900 |
| Full time | 500 | 600 |
| Wrong | 0 | streak resets |

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
git commit -m "Initial commit: QuizArena monorepo"
git branch -M main
git remote add origin https://ens.ghe.com/tmongwe/quizarena.git
git push -u origin main
```

### 2. Protect Secrets

Add these as **Repository Secrets** in GitHub (Settings → Secrets and variables → Actions):

| Secret | Value | Where to find |
|--------|-------|---------------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Supabase Dashboard → Settings → API |
| `SUPABASE_PROJECT_ID` | `xxxxxxxxxxxx` | Supabase Dashboard → Settings → General |
| `SUPABASE_DB_PASSWORD` | Your DB password | Set during project creation |
| `EXPO_TOKEN` | EAS token | https://expo.dev/accounts/settings |

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

## Deploying the Web App

### Option A: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from the web package
cd packages/web
vercel

# 3. Set environment variables in Vercel Dashboard:
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
#    NEXT_PUBLIC_APP_URL (your Vercel domain)
#    NEXT_PUBLIC_MOBILE_SCHEME=quizarena
```

Or connect your GitHub repo to Vercel:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `quizarena` repository
3. Set **Root Directory** to `packages/web`
4. Framework Preset: **Next.js**
5. Add the environment variables above
6. Deploy

### Option B: GitHub Actions CI/CD (Auto-deploy on push)

Create `.github/workflows/deploy-web.yml`:

```yaml
name: Deploy Web App

on:
  push:
    branches: [main]
    paths:
      - 'packages/web/**'
      - 'packages/shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Build Web App
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: ${{ vars.APP_URL }}
          NEXT_PUBLIC_MOBILE_SCHEME: quizarena
        run: npm run build:web

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: packages/web
```

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
    runs-on: ubuntu-latest
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
    runs-on: ubuntu-latest
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

## Complete Deployment Checklist

- [ ] Create Supabase project on [supabase.com](https://supabase.com)
- [ ] Run database migrations (`supabase db push`)
- [ ] Run seed SQL to create organization row
- [ ] Create a GitHub repo and push code
- [ ] Add repository secrets in GitHub Settings
- [ ] Deploy web to Vercel (connect GitHub or use CLI)
- [ ] Set environment variables in Vercel
- [ ] Update `NEXT_PUBLIC_APP_URL` to deployed URL
- [ ] Configure Supabase Auth redirect URLs
- [ ] Build mobile app with EAS (`eas build`)
- [ ] Distribute mobile app (APK sideload or App Store)
- [ ] (Optional) Set up GitHub Actions workflows for CI/CD
- [ ] Create first admin user (sign up via the login page)
- [ ] Configure branding in dashboard

---

## License

Private — Internal use only.
