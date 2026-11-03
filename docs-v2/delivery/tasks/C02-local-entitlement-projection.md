# C02 — Local entitlement projection and read API

| Field      | Value                                                                                |
| ---------- | ------------------------------------------------------------------------------------ |
| Implements | `PRD-SUB-001..004`, `PRD-BR-007`, `TA-ADR-001`, `TA-ADR-013`, `TA-ADR-017`           |
| Depends on | A03 account schema, A04 JWT identity, subscription spec and entitlement architecture |
| Status     | Local implementation slice; store reconciliation and activation pending              |

## Scope and acceptance

Persist one normalized entitlement projection per internal account. The read-only `GET /v1/subscription` evaluates access using server time and authenticated account context. It grants no learning capability without an active projection, a future effective end and the explicit `learning.plan.full` capability. Refunded, revoked, expired and account-hold states deny premium access while leaving family data control available. Billing retry needs a trusted store reconciliation decision.

The endpoint cannot create or modify entitlement. Only a future trusted Apple/Google billing adapter or an isolated local test fixture may write the table. Store callbacks, activation grants, key delivery, trial start/length and purchase reconciliation are out of scope for this slice.

## Data, API and security

Migration `20261007000000_entitlement_projection` adds `entitlements` with account FK, normalized state, effective end, capability array and version. The API returns state, access result, server time and access end without exposing receipt or store token. A missing row is `none` with no learning access. No permanent free learning tier is introduced.

## Verification

Unit tests cover active/trial/grace/canceled access, expiry, refund/revoke/hold and billing retry. HTTP contract tests cover `GET /v1/subscription`. A PostgreSQL integration test seeds a synthetic projection directly and checks account isolation, but could not run on 2026-10-07 because the local Docker daemon was unavailable. `pnpm check:api` and Prisma migration deployment must pass before this slice is treated as integrated.

## Migration and rollback

The migration is additive. Roll back the API code independently if needed; keep the table and its data once deployed. Do not drop entitlement records with real subscription history. No SOT or architecture choice changed.
