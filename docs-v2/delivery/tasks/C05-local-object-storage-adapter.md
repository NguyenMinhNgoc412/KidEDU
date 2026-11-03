# C05 — Local object storage adapter

Status: Implemented adapter; client media flow remains pending.

- Implements: `PRD-MEDIA-004`, `PRD-MEDIA-005`, `TA-ADR-016`, `TA-ADR-023`; adapter boundary in `architecture/02-backend-architecture.md` and `architecture/05-media-storage-and-content-security.md`.
- Dependency: R2 endpoint, private bucket and scoped credentials supplied in environment for staging/production. Local unit tests use no provider credentials.
- Acceptance: Server owns provider credentials; logical keys are validated; transfer URLs expire within 15 minutes; provider configuration fails closed; no client-facing transfer route bypasses authorization.
- Tests: `r2-object-storage.spec.ts`, API typecheck, lint and unit suite.
- Migration/rollback: No data migration. Revert adapter registration and package dependencies if needed.
- Out of scope: consent/quota/finalize flow, encrypted content pack publication, provider inventory and backup retention. These require separate scoped tasks and approved policy values.
