# TUKOPAMOJA High-End Roadmap

This roadmap turns the required outcomes into implementable workstreams.

## 1) Product Maturity

### Host analytics and session insights
- Add a host analytics dashboard with:
  - active players over time
  - question-by-question drop-off
  - answer distribution heatmap
  - average response time and correctness trends
- Add session history drill-down:
  - top players, replay timeline, export CSV/PDF summary

### Richer question types
- Add support for:
  - multiple-select
  - ordering/ranking
  - matching pairs
  - numeric/open response with tolerance
- Add per-question scoring policy configuration (speed, accuracy, mixed)

### Moderation/admin tooling
- Admin panel for:
  - session termination and soft-lock
  - nickname/content moderation queue
  - abusive user blocklist and throttling policies
- Host-side controls:
  - kick/mute player
  - lock lobby
  - pause/resume game globally

### Onboarding and in-app help
- Add first-run host onboarding checklist
- Add contextual tooltips for template builder and host controls
- Add searchable help center drawer and quick actions

## 2) Engineering Quality

### Automated testing depth
- Full e2e for web host + player flows (happy + failure paths)
- Mobile e2e for join/play and reconnect scenarios
- Contract tests between web/mobile clients and Supabase RPC/payload formats

### Performance and scale confidence
- Load tests for realtime spikes:
  - concurrent join bursts
  - simultaneous answer submissions
  - leaderboard broadcast latency under load
- Define budgets for p95 join latency, p95 answer ack, and p95 leaderboard publish

### Release gates and rollback
- Enforce gated deploy pipeline:
  - lint + typecheck + unit + e2e + contract tests must pass
- Add automated rollback playbook:
  - previous known-good static artifact restore
  - DB rollback guardrails for reversible migrations

## 3) Security and Compliance

### Identity and access
- Add enterprise auth pathways (OIDC/SAML) for hosts/admins
- Add MFA for privileged roles
- Add granular RBAC:
  - admin / org-admin / host / viewer / support roles

### Auditability and key management
- Immutable audit log stream for admin and host actions
- Secrets rotation policy and rotation automation calendar
- Break-glass emergency access process with audited approvals

### Security assurance program
- Formal threat model (auth, realtime channels, storage, moderation)
- Quarterly pentest cadence with remediation SLAs
- Security regression checks in CI for common misconfigurations

## 4) Reliability and Operations

### Production monitoring stack
- Unified telemetry:
  - frontend errors
  - API/database traces
  - realtime pipeline metrics
- Alerting by severity with ownership routing

### SLO/SLI framework
- Define SLOs for:
  - host session start success
  - player join success
  - realtime message delivery latency
- Track error budgets and require risk review when depleted

### Operational readiness
- On-call runbook and escalation matrix
- Monthly incident drills with post-incident reviews
- Capacity planning for major events (peak concurrency forecasting)

## 5) UX Excellence

### WCAG 2.1 AA completion
- Complete accessibility audit and remediation to pass AA across all key flows
- Add automated a11y checks in CI for core pages

### Input and motion parity
- Full keyboard navigation support for host/player journeys
- Screen-reader labels, landmarks, and dynamic state announcements
- Reduced-motion parity for timers, transitions, and score updates

### Responsive consistency
- Validate and polish all game states across mobile/tablet/desktop:
  - lobby
  - question active/evaluating
  - leaderboard
  - game over

## Suggested rollout sequence
1. Stability and safety first (reliability + security baseline).
2. Test depth + release gates second (quality and confidence).
3. Product analytics and new question types third (feature depth).
4. UX AA completion and polish continuously across all phases.
