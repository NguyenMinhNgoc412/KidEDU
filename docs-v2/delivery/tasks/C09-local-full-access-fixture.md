# C09 — Local full-access test account

| Field      | Value                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Implements | `PRD-ACC-001`, `PRD-SUB-003`, `TA-ADR-001`, `TA-ADR-017`                                        |
| Depends on | C02 entitlement projection, C06 local JWT fixture, C07 learning gate, Docker Compose PostgreSQL |
| Status     | Local fixture implemented and verified; no production billing or activation claim               |

## Scope

The local identity fixture accepts a second synthetic parent login with a distinct provider subject. An idempotent Compose-only PostgreSQL seed maps it to an internal account and grants a 30-day `active` projection with `learning.plan.full`, `content.pack.full` and `family_media.cloud`. The original unentitled account remains available to test the locked state. The app login screen lists both local credentials only in development without Supabase configuration.

## Acceptance and tests

- Correct fixture credentials produce a signed JWT; incorrect credentials return 401.
- `/v1/me` returns a distinct internal account ID for each fixture login.
- `/v1/subscription` grants learning to the full-access account and denies it to the ordinary account.
- Browser login with the full-access account opens the currently implemented learning UI; the ordinary account remains locked.
- Re-running the local seed cannot overwrite a non-fixture entitlement projection.

## Migration and rollback

No production migration. The seed writes synthetic rows only to the Compose PostgreSQL volume. Remove the seed service, SQL fixture and second identity credential to roll back; delete its local rows only if resetting the disposable local database is desired. Existing ordinary fixture data is unaffected.

## Out of scope

Apple/Google purchase verification, Supabase production users, signed activation, encrypted packs, published content and real family-media cloud storage. “Full access” means all currently modeled test capabilities, not that unfinished product features become available.
