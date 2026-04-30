# TUKOPAMOJA — Deployment Guide

> Production containerization and deployment documentation for shipping the TUKOPAMOJA quiz platform.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Local Development](#local-development)
5. [Docker Deployment](#docker-deployment)
6. [GitHub Pages Deployment](#github-pages-deployment)
7. [CI/CD Pipelines](#cicd-pipelines)
8. [Database Migrations](#database-migrations)
9. [Security Checklist](#security-checklist)
10. [Monitoring & Health Checks](#monitoring--health-checks)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TUKOPAMOJA Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────┐    │
│  │  Web App  │   │  Mobile  │   │  Supabase (managed)  │    │
│  │ Next.js   │   │  Expo    │   │  ┌────────────────┐  │    │
│  │ Static    │◄──┤  React   │   │  │ PostgreSQL 15  │  │    │
│  │ Export    │   │  Native  │   │  │ Auth + RLS     │  │    │
│  └────┬─────┘   └────┬─────┘   │  │ Realtime WS    │  │    │
│       │              │         │  │ Storage        │  │    │
│       └──────┬───────┘         │  └────────────────┘  │    │
│              │                 │                       │    │
│              └─────────────────┤                       │    │
│                   REST + WS    │                       │    │
│                                └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

| Package              | Purpose                          | Technology           |
|----------------------|----------------------------------|----------------------|
| `packages/web`       | Host dashboard + player UI       | Next.js 14, React 18 |
| `packages/mobile`    | Player companion app             | Expo, React Native   |
| `packages/shared`    | Types, constants, scoring logic  | TypeScript           |
| `supabase/`          | DB schema, migrations, RLS       | PostgreSQL 15        |

---

## Prerequisites

| Tool          | Version  | Purpose                     |
|---------------|----------|-----------------------------|
| Node.js       | ≥ 20     | Build toolchain             |
| npm           | ≥ 10     | Package manager             |
| Docker        | ≥ 24     | Containerization            |
| Docker Compose| ≥ 2.20   | Multi-service orchestration |
| Supabase CLI  | ≥ 1.100  | DB management (optional)    |

---

## Environment Variables

All environment variables are injected at **build time** (since the app is a static export).

| Variable                          | Required | Description                        | Example                                    |
|-----------------------------------|----------|------------------------------------|--------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | Yes      | Supabase project API URL           | `https://xxx.supabase.co`                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Yes      | Supabase anonymous (public) key    | `eyJhbGciOiJIUzI1NiIs...`                  |
| `NEXT_PUBLIC_APP_URL`             | Yes      | Public URL of deployed app         | `https://yourdomain.com`                   |
| `NEXT_PUBLIC_MOBILE_SCHEME`       | No       | Mobile deep-link scheme            | `quizarena` (default)                      |

### File Layout

```
.env.example              # Template with placeholder values
.env.local                 # Local development (gitignored)
.env.production            # Production values (gitignored)
.env.local.example         # Template for local dev
.env.production.example    # Template for production
.env.docker.example        # Template for Docker dev
```

### Setting Up

```bash
# Local development
cp packages/web/.env.local.example packages/web/.env.local
# Edit with your local Supabase values

# Production
cp packages/web/.env.production.example packages/web/.env.production
# Edit with your production Supabase values

# Docker development
cp .env.docker.example .env.docker
# Edit with your Docker stack values
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Supabase locally (requires Supabase CLI + Docker)
supabase start

# 3. Run migrations
supabase db push

# 4. Start dev server
npm run dev:web
# → http://localhost:3000
```

---

## Docker Deployment

### Option A: Quick Production Build (static / nginx)

```bash
# Build the container with your production values
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  -t quizarena-web .

# Run it
docker run -d -p 3000:80 --name quizarena quizarena-web

# Verify
curl http://localhost:3000/healthz
# → ok
```

### Option B: Server Mode (Next.js standalone — recommended for shipment)

When deploying to another system that does **not** use static hosting, use the server Dockerfile. This runs Next.js as a full Node.js server with SSR capabilities.

```bash
# Build
docker build -f Dockerfile.server \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  -t quizarena-web .

# Run
docker run -d -p 3000:3000 --name quizarena quizarena-web

# Verify
curl http://localhost:3000/
```

Or with Compose:

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
export NEXT_PUBLIC_APP_URL=https://yourdomain.com

docker compose -f docker-compose.server.yml up -d --build
```

### Option C: Docker Compose — static/nginx (Production)

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
export NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Build and run
docker compose -f docker-compose.prod.yml up -d --build

# Check health
docker compose -f docker-compose.prod.yml ps
```

### Option D: Docker Compose (Development)

```bash
# Copy env template
cp .env.docker.example .env.docker
# Edit .env.docker with your values

# Start full dev stack
docker compose up -d

# → Web:      http://localhost:3000
# → Postgres: localhost:54322
```

### Build Modes

The project supports two build modes controlled by `BUILD_MODE` env var in `next.config.js`:

| Mode         | File                 | Output              | Use Case                   |
|--------------|----------------------|----------------------|----------------------------|
| `static`     | `Dockerfile`         | nginx + HTML files   | GitHub Pages, CDN, S3      |
| `server`     | `Dockerfile.server`  | Node.js server       | Docker, cloud VMs, K8s     |

### Container Details

| Property          | Static (nginx)           | Server (standalone)          |
|-------------------|--------------------------|------------------------------|
| Base image        | `nginx:1.27-alpine`      | `node:20-alpine`             |
| Exposed port      | 80                       | 3000                         |
| Health endpoint   | `/healthz`               | `/`                          |
| Memory limit      | 256 MB                   | 512 MB                       |
| Runs as           | Non-root (UID 1001)      | Non-root (UID 1001)          |
| SSR support       | No                       | Yes                          |

---

## GitHub Pages Deployment

### Manual

```bash
# Ensure .env.production is set, then:
npm run deploy:public-pages
```

### Automated (via CI)

Push to `main` → the `Deploy` workflow automatically builds and deploys to GitHub Pages.

**Required GitHub Secrets:**

| Secret                          | Description                                   |
|---------------------------------|-----------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                             |
| `NEXT_PUBLIC_APP_URL`           | Public URL (e.g. `https://x.github.io/repo`) |
| `PUBLIC_PAGES_PAT`              | PAT with repo write access to Pages repo      |

**Required GitHub Variables:**

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `PUBLIC_PAGES_REPO`   | `owner/repo` of the Pages repository |

---

## CI/CD Pipelines

### CI (`ci.yml`) — Every push & PR

```
quality (lint + typecheck)
    ├── build (static site + artifact upload)
    └── docker (image build test)
```

### CD (`deploy.yml`) — Push to main / manual trigger

```
deploy-pages   → GitHub Pages (automatic on main push)
deploy-docker  → GitHub Container Registry (manual trigger)
```

### Manual Docker Deploy

```bash
# Trigger from GitHub UI: Actions → Deploy → Run workflow → target: docker-registry
# Image is pushed to: ghcr.io/<owner>/quizarena/web:latest
```

---

## Database Migrations

Migrations are in `supabase/migrations/` and run sequentially.

```bash
# Apply migrations to remote Supabase
supabase db push --linked

# Reset local database (runs migrations + seed)
supabase db reset

# Generate TypeScript types from schema
npm run db:types
```

### Migration Files

| Migration                                         | Purpose                                    |
|---------------------------------------------------|--------------------------------------------|
| `00001_create_schema.sql`                        | Core tables: profiles, templates, sessions |
| `00002_create_rls_policies.sql`                  | Row-level security policies                |
| `00003_player_count_sync.sql`                    | Player count triggers                      |
| `00004_refresh_brand_defaults.sql`               | Branding defaults                          |
| `20260424*` series                               | Scoring, interactivity, realtime           |
| `20260427_fix_rls_and_security_invoker_views.sql`| Security fixes                             |
| `20260429_data_management_policies_and_rpcs.sql` | Data cleanup RPCs                          |

---

## Security Checklist

- [x] **RLS enabled** on all tables — no direct access without policies
- [x] **Anon key** is the public (read-limited) key, not the service role key
- [x] **Service role key** never exposed to the client
- [x] **CORS** configured in Supabase dashboard
- [x] **Auth redirects** restricted to known URLs in `supabase/config.toml`
- [x] **nginx security headers**: X-Frame-Options, X-Content-Type-Options, CSP-adjacent
- [x] **Non-root container** — runs as UID 1001
- [x] **No secrets in Docker image** — all env vars are build args (public keys only)
- [x] **`.env.production`** gitignored — never committed to source control
- [x] **Email confirmation** enabled for auth
- [x] **Input validation** on all user-facing forms (PIN, names, email)

---

## Monitoring & Health Checks

### Endpoints

| Endpoint    | Method | Response   | Purpose              |
|-------------|--------|------------|----------------------|
| `/healthz`  | GET    | `200 ok`   | Container liveness   |
| `/`         | GET    | HTML page  | Application up check |

### Docker Health

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' quizarena

# View logs
docker logs quizarena --tail 50 -f

# Resource usage
docker stats quizarena --no-stream
```

---

## Troubleshooting

### Build fails with missing env vars

```bash
# Ensure env vars are set before building
source packages/web/.env.production
npm run build:web
```

### Container starts but shows blank page

The static export requires correct `NEXT_PUBLIC_APP_URL` at build time for asset paths. Rebuild with the correct URL:

```bash
docker build --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com ...
```

### Supabase connection errors

1. Verify `NEXT_PUBLIC_SUPABASE_URL` points to correct project
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the anon key (not service role)
3. Check RLS policies allow the intended operations

### Port conflicts

```bash
# Change the host port mapping
docker run -p 8080:80 quizarena-web
# Or set PORT in docker-compose.prod.yml
PORT=8080 docker compose -f docker-compose.prod.yml up -d
```

---

## Shipping Checklist

Before shipping to another system:

- [ ] Clone this repository
- [ ] Set up environment variables (see [Environment Variables](#environment-variables))
- [ ] Run `npm install` and `npm run build:web` to verify build
- [ ] Run `docker build ...` to verify container builds
- [ ] Configure Supabase project (apply migrations)
- [ ] Set GitHub Secrets for CI/CD
- [ ] Test the deployed application end-to-end
