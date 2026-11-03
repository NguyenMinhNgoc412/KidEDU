# A03 — Identity and family data baseline

| Field      | Value                                                              |
| ---------- | ------------------------------------------------------------------ |
| Implements | `PRD-ACC-001..003`, `TA-ADR-005..007`, `TA-ADR-016`                |
| Depends on | A02, data-model spec, backend spec, approved account/consent scope |
| Status     | Local implementation slice; staging pooler proof pending           |

## Scope / out of scope

Add a bounded PostgreSQL/Prisma baseline for internal accounts, provider identities, family membership, consent records and child profiles. Use separate runtime and migration URLs. This does not add authentication endpoints, a real Supabase project, learning plans, billing, media, or a full physical ERD.

## Acceptance

- Internal account ID is independent of provider subject; `(provider, subject)` is unique.
- Family membership is unique per family/account; child profile belongs to one family.
- Consent is versioned, scoped and revocable. Child profile contains no diagnosis field.
- Birth month is constrained to 1–12; role is an enum; timestamps use PostgreSQL `timestamptz`.
- SQL migration applies to a fresh local PostgreSQL instance and matches Prisma datamodel without drift.

## Data/API/schema changes

Adds the six baseline tables and `FamilyRole` enum in `apps/api/prisma/migrations/20260930081709_identity_family_baseline`. No API contract yet. `DATABASE_POOL_URL` is for runtime; `DATABASE_MIGRATION_URL` is for Prisma migration and must use a reviewed direct/session connection in staging. The local compose database is disposable and uses synthetic data only.

## Security/privacy/operations

No credentials or child PII enter the repo. The local compose password is explicitly for local development and must never be reused outside it. FK restrictions prevent implicit deletion cascades; privacy deletion requires an explicit later job. Provider subject is confined to `auth_identities`. Runtime pool/Cloud Run instance budget and Supavisor prepared-statement behavior remain P0-05 proof items.

## Tests

`prisma migrate deploy`, `prisma generate`, `prisma migrate status` and `prisma migrate diff --exit-code` passed against disposable local PostgreSQL on 2026-09-30. The synthetic integration test passed for account/consent/child persistence, uniqueness and invalid birth month. CI starts PostgreSQL, applies migration and runs the test; GitHub CI has not yet executed.

The API container now packages the generated Prisma Client and the Prisma migration CLI/schema. A local container queried the disposable PostgreSQL database, reported migration status up to date and returned 200 from DB-backed readiness. Production Supavisor transaction-pooler compatibility and connection budget are still unverified.

## Migration / rollback

This is an additive migration. Before production data exists, rollback is to discard the isolated local database and remove the migration/code. After deployment, prefer forward fixes; do not drop tables holding family data without an approved retention/export plan. No SOT rule changed.
