# Accessibility Audit — Sprint Baseline

## Scope

- Host web app in `packages/web`
- Primary flows: home, join, auth/login, host lobby/question/leaderboard/game-over, dashboard pages

## WCAG 2.1 AA Checklist

- [x] Color contrast tokens centralized in theme
- [x] Visible focus style for primary interactive controls (`.btn-3d:focus-visible`)
- [x] Reduced motion behavior added globally via `prefers-reduced-motion`
- [ ] Full keyboard-only flow verified on host game controls
- [ ] Full keyboard-only flow verified on join and auth forms
- [ ] Screen reader labels validated on all icon-only controls
- [ ] Landmark and heading hierarchy audited per page

## Current Risks

1. Dynamic game screens use motion effects and may still need screen-reader announcement tuning.
2. Some status changes (leaderboard/game-over transitions) may need explicit live-region announcements.
3. Manual contrast verification still needed for all text over gradients.

## Next Actions (Owner-Ready)

- FE Owner: add `aria-live` for score and state transitions.
- FE Owner: audit icon-only controls and add explicit `aria-label` where needed.
- QA Owner: run keyboard navigation script across all host/player views.
- QA Owner: run contrast checks for text over `gradient-dark` and `gradient-ens` surfaces.

## Exit Criteria

- All checklist items complete.
- No critical accessibility blockers in primary gameplay and auth flows.
- Audit artifacts attached to release PR.
