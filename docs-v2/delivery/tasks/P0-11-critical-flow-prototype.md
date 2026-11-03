# P0-11 — Critical flow prototype

| Field      | Value                                                                                |
| ---------- | ------------------------------------------------------------------------------------ |
| Implements | `PRD-PLAN-*`, `PRD-ACT-009..010`, `PRD-PROG-*`, `PRD-UX-*`, `TA-ADR-015`             |
| Depends on | Product Brief, PRD, Technical Architecture, design specs 01–04 and screenshots 01/03 |
| Status     | Code prototype available; device/design/usability proof pending                      |

## Scope / out of scope

Create a development-only, clickable synthetic flow: Today → lesson overview → functional communication activity → parent handoff → observation/prompt level → parent-guided transfer → finish. It reuses Gentle Growth components and does not connect to plan, activation, pack, progress repository or outbox. The handoff is a prototype of the parent transition, not a production Parent Gate.

## Acceptance

- One clear child action at a time, no score or negative judgment in Child Zone.
- Observation choices are shown only after parent handoff; `supported` asks for prompt level.
- Parent transfer gives preparation, action and observation guidance for a real-world opportunity.
- Route and Home entry exist only in development; production redirects to Home.

## Data/API/schema changes

No data/API/schema changes. All content is synthetic and held in component state.

## Security/privacy/operations

No child identity, media, purchase or external link. This prototype does not assert entitlement or pack readiness and must not be promoted to production flow without the Phase 1–3 dependencies.

## Tests

Jest covers the step order, parent-only observation transition and reset. Typecheck/lint/format cover code. P0-11 still needs design review, small-phone/large-text/screen-reader and real-device usability notes.

## Static design review — 2026-09-30

Compared the development route with design specs 01–04 and `screenshots/01-home-childmode.JPG` and `screenshots/03-child-study-screen.JPG`. The route has a Today-first entry, one child stimulus, a parent handoff before observation, and a real-world transfer prompt. The stimulus has an accessible image label. The Child Zone exit control now uses the 56pt button size required by the design spec.

This is a code/visual-reference review only. It does not establish contrast, screen-reader focus order, large-text reflow, small-phone layout or usability on iOS/Android. The handoff remains a synthetic prototype, not a production Parent Gate. Record those results with device/OS, text scale, screen reader and tester notes before marking P0-11 complete.

Local web check on 2026-09-30: Chromium at a 390×844 viewport rendered Home and `/prototype`; `pnpm test:web` completed Home → Today → activity → parent observation → transfer → finish with no page exception or horizontal overflow. This is browser evidence only; mobile device/accessibility/usability proof remains pending.

## Migration / rollback

No migration. Remove the prototype route, reducer/test and development Home entry; persistent data is unaffected.
