# Operations Runbook (Production)

## 1) Pre-Deploy Checks

1. `npm run validate-env:prod`
2. `npm run build:web`
3. `npm run test:all`
4. Confirm self-hosted runner online
5. Confirm required secrets/vars are present in GitHub Actions

## 2) Deploy Steps

1. Merge verified code to `main`.
2. Trigger `Deploy Web to GitHub Pages` workflow (push or manual).
3. Confirm workflow jobs `build` and `deploy` succeed.
4. Verify production URL and key routes:
   - `/`
   - `/auth/login/`
   - `/join/`

## 3) Incident: Session/Realtime Degradation

Symptoms:

- Players not joining lobby
- Answer counts not updating
- Leaderboard not broadcasting

Actions:

1. Check Supabase project status and realtime health.
2. Check browser console for websocket disconnect/reconnect loops.
3. Verify `NEXT_PUBLIC_APP_URL` and Supabase env vars in deploy target.
4. Run local smoke flow (`npm run test:integration`) against staging/local.

Rollback:

1. Redeploy last known good commit.
2. Re-run smoke checks.

## 4) Incident: Auth Failures

Symptoms:

- Login/signup fails after deploy

Actions:

1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in CI/deploy secrets.
2. Verify Supabase Auth Site URL and redirect URLs match deployed host.
3. Inspect workflow logs for env validation failures.

## 5) Incident: Migration Failures

Actions:

1. Review `migrate-db` workflow logs.
2. Confirm `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`.
3. Validate migration SQL syntax locally with `supabase db reset`.
4. Re-run migration workflow after fix.

## 6) Post-Incident Review

- Timeline
- Root cause
- User impact
- Permanent corrective action
- Follow-up owner and due date
