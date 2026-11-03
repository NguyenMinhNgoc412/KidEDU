# C07 — Account isolation and local learning gate

| Field      | Value                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------- |
| Implements | `PRD-ACC-001`, `PRD-BR-007`, `TA-ADR-001`, `TA-ADR-003`, `TA-ADR-009`, `TA-ADR-010`         |
| Depends on | C02 entitlement read, C06 parent login, `/v1/me` internal account ID                        |
| Status     | Local mitigation implemented; signed activation and encrypted packs remain release blockers |

## Scope

The auth gateway obtains the internal account ID from `/v1/me`. SQLite opens a separate file for each validated account ID. The pre-account `kidedu.db` stays quarantined because its owner cannot be established safely. The learning routes and home learning choices are closed until `/v1/subscription` confirms active learning capability; the result is refreshed on foreground and locked at its server-reported expiry. Parent family-data routes remain available when learning is locked.

## Acceptance and tests

- Two internal account IDs open separate SQLite files; an invalid namespace cannot choose a file path.
- Missing, denied, expired or malformed entitlement responses cannot unlock the local learning UI.
- Local browser login with a backend `state: none` shows locked learning while Parent Gate/API remain usable.
- Typecheck, lint, Jest and local web API smoke are required.

## Migration and rollback

No schema migration. Existing `kidedu.db` and global media files are retained without assigning them to an account. Account-specific SQLite starts empty and seeds only bundled defaults. A future reviewed import must identify the owner before migrating legacy family data. Rollback can restore the previous DB selection and route behavior, but should be used only with an account-isolation replacement; it would reopen the cross-account exposure.

## Out of scope

This local API check is an interim UI gate. It is not a signed activation grant or a secure premium-content boundary. Repository, media and key checks, encrypted packs, store billing, family media namespace migration, and complete account-switch lifecycle remain separate tasks before release.
