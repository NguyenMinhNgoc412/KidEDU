# C12 — Auth refresh and lifecycle recovery

Implements: `PRD-ACC-*`, `PRD-SUB-003`, `TA-ADR-001`.
Depends on: AuthGateway, Supabase identity adapter, C10 timer.
Status: Implemented locally; provider/native verification pending.

## Scope / acceptance

Access-token expiry blocks protected reads and attempts refresh instead of signing out. Transient failures retain the session/refresh credential for manual or foreground retry. A confirmed invalid refresh clears the app session. In-flight work cannot resurrect an explicitly logged-out account. Supabase auto-refresh follows native foreground lifecycle. Account changes clear query state, selected child and Parent Gate.

Parent dashboard and entitlement projection do not issue requests with known expired access. The local identity fixture cannot manufacture a production refresh token. Subscription expiry remains separate from identity expiry.

## Tests / migration / rollback

AuthProvider tests cover expiry recovery, transient failure/retry, invalid refresh and logout races. LearningAccessProvider tests cover expired-token blocking. Run typecheck/lint/Jest; executed results are in the dated review. No schema or API change. Revert gateway/provider wiring to roll back. No credentials are logged.

## Out of scope

Live Supabase/JWKS, provider revocation, process kill and native lifecycle tests remain release checks. This does not implement billing reconciliation or signed activation.
