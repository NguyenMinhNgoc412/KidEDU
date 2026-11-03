# A04 — Verified identity and first family API

| Field      | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| Implements | `PRD-ACC-001..003`, `TA-ADR-012`, `TA-ADR-014`, `TA-ADR-016` |
| Depends on | A02, A03, API contract, Supabase signing-key configuration   |
| Status     | Local implementation slice; Supabase staging proof pending   |

## Scope / out of scope

Verify asymmetric Supabase access tokens against a configured JWKS, issuer and audience, map provider subject to an internal account, and expose authenticated `/v1/me`, `/v1/families`, `/v1/consents` and `/v1/children` create/list calls. The 2026-10-07 extension adds family list and child detail/update with optimistic version checks for frontend integration. This enables a local synthetic first-run round trip. Supabase login UI, token refresh/revocation, Google/Apple sign-in, child deletion, device registration and Parent Gate remain separate slices.

## Acceptance

- Missing/invalid token is rejected; a valid token maps to one stable internal account ID.
- A signed token also needs the `authenticated` role before resolving an internal account.
- A provider subject linked to a soft-deleted internal account must not recreate or reopen access.
- A family created by an account has that account as owner. Child creation requires current configured guardian consent and membership in the family.
- Wrong consent version, malformed child data, revoked consent and cross-family access fail with a safe error envelope and request ID.
- API does not return provider subject or Prisma model directly. Production does not have a development auth bypass.
- Child detail/update is family-scoped; update requires `expectedVersion` and returns conflict on stale writes.

## Data/API/schema changes

Adds the above `/v1` operations using existing A03 tables; no new migration. The extension adds `GET /v1/me`, `GET /v1/families` and `GET/PATCH /v1/children/{childId}` to the local OpenAPI contract and generated client. `SUPABASE_JWKS_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_JWT_AUDIENCE`, `CHILD_PROFILE_CONSENT_VERSION` and runtime database URL are required for the respective routes. No policy version value is hard-coded for production.

## Security/privacy/operations

JWKS URL must use HTTPS except for local loopback test. JWT verification pins ES256/RS256 plus issuer/audience/subject/issued-at/expiry. Fastify logs omit authorization headers and request bodies. The synthetic test data is deleted after integration tests. A live Supabase Auth/session revocation/JWKS rotation proof is still needed; JWT verification alone does not prove revocation. Parent Gate and object authorization on future endpoints remain mandatory.

On 2026-10-07, JWT verification was tightened to reject signed tokens with an `anon` or absent role. The local identity fixture now emits the `authenticated` role. This changes no route, response contract or schema. A real Supabase staging token still needs validation before rollout.

## Tests

Local integration test signs synthetic RS256 tokens from a loopback JWKS server, checks invalid audience and missing token, stable account mapping, consent grant/revoke and cross-family denial. `pnpm check:api`, `pnpm --filter @kidedu/api test:db` and container smoke should pass. Staging Supabase proof remains P0-03.

On 2026-10-07, `pnpm check:api` passed with 6 suites/16 tests, including child update policy, deleted-account rejection and frontend HTTP contract. Root `pnpm typecheck` also passed. PostgreSQL integration and Supabase staging remain unverified in this run because Docker was unavailable.

## Migration / rollback

No new migration. Remove controllers/services/adapter while retaining A03 schema if rollback is needed. Accounts and consents already created must be handled by an explicit data migration or deletion process; do not drop their tables automatically.

The role check can be rolled back with the matching fixture and tests if staging reveals an incompatible provider claim.
