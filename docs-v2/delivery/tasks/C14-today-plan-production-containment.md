# C14 — Today plan read and production containment

Implements: `PRD-PLAN-*`, `PRD-SUB-003`, `PRD-NFR-003`, `TA-ADR-001/005/007/009`.
Depends on: parent dashboard API, account-bound child selection, future prepared-lesson and activation pipeline.
Status: Partial implementation; R01/R02 remain release blockers.

## Scope / acceptance

Today reflects the selected child's saved server plan with loading/error/no-profile/no-plan/preparation states. Share selection with Parent dashboard and clear on account change; never present a lesson as ready without a prepared runtime. Keep legacy choices development-only.

The unsigned subscription projection only unlocks learning in development. Production fails closed until signed activation, protected content resolution and encrypted pack delivery exist. This deliberately leaves production learning unavailable; it is containment, not completion of the security architecture. Parent family-data access stays independent of learning entitlement.

## Tests / migration / rollback

Provider tests verify active projection cannot unlock production, development fixture works, and expired access issues no subscription request. Chromium synthetic tests verify switching child changes Today plan across navigation. See dated review for executed results. No schema/API migration. Revert Today/shared selection independently; do not remove the production lock before replacement security enforcement is verified. No SOT change.

## Out of scope / remaining work

Implement a complete prepared lesson → all required activities → atomic SQLite observation/outbox → transfer vertical slice, signed grants, manifest/signature verification, encrypted content/key boundary, atomic generation sync and protected media resolver. These are engineering tasks, not only missing owner credentials. Approved corpus/readiness and owner session thresholds are additional inputs in the owner checklist.
