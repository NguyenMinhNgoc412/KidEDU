# C08 — Testable v2 frontend slice

| Field      | Value                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Implements | `PRD-ACC-001`, `PRD-PLAN-*`, `PRD-PROG-*`, `PRD-SUB-*`, `PRD-UX-*`, `TA-ADR-001`, `TA-ADR-015`           |
| Depends on | C06 login, C07 learning gate, local `/v1` family/plan/observation/subscription reads, design specs 01–04 |
| Status     | Local web UI and API smoke implemented; native and accessibility proof pending                           |

## Scope

Child Home shows a Today-first locked state with a Parent Gate handoff when backend learning access is unavailable. Legacy learning choices mount only while access is allowed and are labeled as device content. The Parent dashboard reads child profiles, plan summary, latest observation and subscription state from the versioned app-server API. Child selection stays in the Parent Zone. Existing device-only tools remain available under explicit labels. A development-only synthetic activity flow can be opened from the Parent Zone for visual testing; it does not change entitlement or persist progress.

## Acceptance and tests

- Local account without entitlement sees the Today lock card and can enter Parent Gate; legacy learning choices stay hidden.
- Parent dashboard displays real server child/subscription state and the selected child's plan/observation state, including loading and error messages.
- Development preview is identified as sample data, requires Parent Gate and returns to the Parent dashboard.
- Typecheck, lint, Jest and local web API smoke verify the slice. Screenshots at 390×844 are used for visual review.

## Migration and rollback

No database or API migration. Revert the dashboard hook, screen composition and preview entry to restore the prior UI; C07 account isolation and entitlement gating should remain. No existing family data is modified by this slice.

## Out of scope

Store purchase, production lesson packs, family-media cloud flow, native accessibility/device sign-off and complete plan/progress editing UI. Device-only legacy pages are clearly labeled until their v2 replacements are connected.
