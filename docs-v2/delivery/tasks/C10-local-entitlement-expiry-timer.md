# C10 — Local entitlement expiry timer

Implements: `PRD-SUB-003`, `PRD-ACC-005`, `TA-ADR-001`, `TA-ADR-003`.
Depends on: C07 learning guard, C09 full-access fixture.
Status: Implemented; validation recorded below.

## Scope and acceptance

The local subscription UI guard previously locked access after JavaScript's maximum timer delay (approximately 24.8 days), even if the server projection allowed longer access. Schedule expiry in bounded chunks using monotonic elapsed process time. Each chunk rechecks remaining duration; only actual expiry locks access. Cleanup cancels pending chunks on session changes/unmount. Invalid durations fail closed.

Tests cover a 30-day entitlement, exact expiry, wall-clock rollback, cleanup after the first chunk and invalid duration. Run mobile typecheck/lint/Jest and backend baseline checks; results are reported with the change.

Validation on 2026-10-12: `pnpm check` completed with 43 suites / 223 tests passing; `pnpm check:api` completed with 10 suites / 36 tests passing and API build successful. These are local checks; PostgreSQL integration, browser smoke, store sandbox and native device tests were not run for this task.

## Migration / rollback / impact

No schema, API, dependency or production configuration change. Revert the helper/provider wiring to roll back. No SOT rule or architecture change; owner-input checklist only collects existing TBDs. No tokens, keys or family data are added to logs.

## Out of scope

This local projection guard does not provide signed activation, content-key security, network-latency compensation, store reconciliation or native lifecycle proof. Those remain separate release dependencies.
