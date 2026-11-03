# C21 — Login request timeout and local connectivity

Implements: `PRD-ACC-001`, `PRD-ACC-004`, `PRD-NFR-008`, `TA-ADR-002`, `TA-ADR-016`.

Authorization: owner reported login remaining on the login screen on 2026-10-30.

Dependency: C06 auth gateway, C18 LAN setup, C20 SDK baseline.

Scope: bound local identity and versioned app-server requests to 15 seconds, abort network work on timeout, and show a retryable auth error. Correct the ignored local environment to the current Wi-Fi address and start the existing Compose stack.

Cause observed: configured Wi-Fi address was stale and Docker Desktop was stopped. Neither identity login nor app-server requests had a deadline. No session can be established until identity and `/v1/me` respond.

Acceptance: unavailable requests settle with a safe error; late responses do not establish a session after timeout; retry can sign in; wrong credentials remain rejected; successful login reaches Home through the protected stack.

Tests: timeout/abort/late-response tests, AuthProvider timeout/retry regression, typecheck, lint, Jest, LAN HTTP login/me and browser login flow.

Migration: no database/content/contract migration. Existing Compose migration/fixture startup runs normally; no volume deletion. Restart/reload Expo to load the changed public URLs.

Rollback: revert C21 request wrapper/gateway/provider changes and restore the previous local endpoint configuration if returning to that network. Existing account data remains intact.

Out of scope: production identity/billing/activation, navigation guard bypass, subscription changes, UI redesign and physical-device proof.

## Verification

- Current LAN health, identity login and authenticated `/v1/me` succeed (HTTP 200).
- `pnpm check` passes: default-media check, typecheck, lint, 52 suites / 264 tests.
- Browser smoke passes: invalid password rejected → login → Home → Parent Gate → API → logout/protected route. First attempts ran before Metro was ready / exceeded the initial bundle deadline; rerun after bundling passed.
- Prettier and changed-file whitespace checks pass. No PB/PRD/architecture invariant change; docs index/changelog updated. Phone reachability remains unverified.
