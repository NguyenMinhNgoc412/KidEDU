# C04 — Local plan and observation API slice

| Field      | Value                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| Implements | `PRD-PLAN-*`, `PRD-PROG-*`, `TA-ADR-005`, `TA-ADR-014`, `TA-ADR-016`   |
| Depends on | A02–A04, API and event contracts                                       |
| Status     | Local implementation slice; database integration and full sync pending |

## Scope / out of scope

Store a client-computed plan with optimistic revision and ingest parent observations with stable event IDs. List observations for one authorized child with an opaque ID cursor. The 2026-10-07 extension adds append-only parent correction through `POST /v1/observations/{id}:supersede`. This slice does not implement full bootstrap/delta sync, plan computation, other sync event types, content publication, store billing or cloud deployment.

## Acceptance

- Account membership is checked before any child plan or observation access.
- A stale plan revision returns conflict and cannot overwrite a newer plan.
- Identical event retries return `duplicate`; reused IDs with changed content return `EVENT_ID_CONFLICT`.
- Invalid events receive item-level rejection while valid events in the same batch are accepted.
- Observation result includes `not_observed` and remains immutable.
- A correction appends a replacement observation and a one-to-one supersession link in one transaction. The original remains in history; cross-family correction returns 404. Repeating the same correction event ID returns `duplicate`.

## Data/API/schema

Migration `20261002000000_plan_observation` adds `learning_plans` and `observations`. Migration `20261007010000_observation_supersession` adds the append-only correction link. The API includes `GET/PUT /v1/children/{childId}/plan`, `POST /v1/children/{childId}/events:batch`, `GET /v1/children/{childId}/observations` and `POST /v1/observations/{id}:supersede`.

## Security/privacy/operations

No child notes or raw media are accepted. The event envelope does not decide account ownership. There is no local authentication bypass. The migration uses PostgreSQL constraints for result, context and positive version.

## Tests

Run `pnpm check:api` and `pnpm --filter @kidedu/api test:db` with local PostgreSQL. Docker daemon is needed for the database test. This slice needs a real database migration and end-to-end check before frontend reliance.

The correction unit/HTTP contract tests cover family scope, atomic append, duplicate retry and conflicting correction. PostgreSQL integration coverage is written but remains unrun until Docker is available.

## Migration/rollback

Apply with `prisma migrate deploy` before starting the API. Roll back API traffic first; retain new tables and data. Dropping tables would lose observations and requires an explicit data export/recovery decision.
