# A05 — Local frontend/API contract probe

| Field      | Value                                                                       |
| ---------- | --------------------------------------------------------------------------- |
| Implements | `PRD-ACC-001..003`, `PRD-PLAN-*`, `PRD-PROG-*`, `TA-ADR-014`, `TA-ADR-016`  |
| Depends on | A02–A04, C04 local API slice, design specs 01–04                            |
| Status     | Development integration slice; production frontend and database E2E pending |

## Scope / out of scope

Add a generated TypeScript client from the backend-owned OpenAPI subset and a development-only Parent Zone screen for reading child profiles, plan and observation history with a test JWT. The same client can write plans and observation batches; the screen keeps these mutations out of the synthetic prototype until real content and local outbox are ready. No production login, token persistence, bootstrap, activation, pack readiness or subscription flow is claimed.

The subsequent C06 login slice supersedes this document's local token acquisition flow: the development screen now receives the authenticated session, and the app starts at email/password login. Production Supabase login remains unverified until project values and device tests are available.

2026-10-07 extension: the development screen now reads the server subscription projection, reads account/child/plan/observations, updates the child display name with optimistic version, and appends an observation correction. UI state and API calls live in `src/features/localBackend/useLocalBackend.ts`; changing JWT/API address clears account data. The screen remains development-only and does not grant learning access or create entitlement.

## Acceptance

- Generated client types follow `apps/api/openapi.local.yaml` using `pnpm generate:api-client`.
- HTTP client uses versioned `/v1` paths, bearer auth and safe error codes; it never logs the token.
- Parent Gate guards the development screen; release builds redirect away from it.
- A Node HTTP contract test calls the running Nest app using the frontend client for children, plan, event batch and observations. A PostgreSQL integration test verifies actual persistence and family isolation.
- Local Compose provides a synthetic JWKS and test JWT fixture on loopback, without weakening JWT verification.

## Tests

Run `pnpm check`, `pnpm check:api`, `pnpm --filter @kidedu/api test:db` with Compose, and local container smoke. The first HTTP test stubs application services; the PostgreSQL test verifies the same generated client against the real database. The Compose fixture is needed to check real JWT/JWKS from the development screen. Device and screen reader review remain pending.

Local verification on 2026-10-02: Docker Compose built and applied the C04 migration; `/health/ready` returned `ok`. `pnpm check` passed 39 suites/213 tests, `pnpm check:api` passed 4 suites/10 tests, and `test:db` passed 3 suites/5 tests including frontend client → Nest → Prisma/PostgreSQL writes and cross-family denial. A Compose-issued JWT passed the real JWKS adapter. `pnpm test:web:api` passed Parent Gate → local JWT → API → child plan/observations in Chromium at 390×844 with no page exception or horizontal overflow. This is a local web proof; device and production identity/entitlement remain open.

## Migration/rollback

No new database migration. Remove the dev route and menu entry to roll back the UI; the API client can stay for later production wiring. Existing C04 migration remains required for real backend data.
