# Observability Baseline

## Goals

- Detect gameplay-impacting failures quickly.
- Provide enough context to diagnose session, auth, and realtime issues.
- Keep logs structured and privacy-safe.

## Logging Standard

Use JSON-structured logs with these fields where possible:

- `event`
- `level` (`info`, `warn`, `error`)
- `sessionId`
- `playerId` (if applicable)
- `route`
- `timestamp`
- `errorCode` / `errorMessage` (when relevant)

## Minimum Events to Capture

- Host session lifecycle: create, start, next question, leaderboard, finish
- Player join/leave and answer submit failures
- Supabase auth failures (login/signup)
- Realtime subscription connect/disconnect/reconnect
- Environment validation failures in non-production runs

## Alerting Targets

- Realtime disconnect rate spike
- Session start failure rate
- Player join failure rate
- Build/deploy workflow failure on `main`

## Dashboards

Create at least one dashboard with:

- Session starts per hour
- Active players per session
- Join failure count
- Realtime reconnect count
- Auth failure count

## Privacy & Security

- Never log access tokens, anon keys, or user secrets.
- Redact email addresses where full values are not needed.
- Log IDs and aggregate counters over sensitive payloads.
