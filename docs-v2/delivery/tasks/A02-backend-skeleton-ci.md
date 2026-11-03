# A02 — Backend skeleton and CI gate

| Field      | Value                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| Implements | `TA-ADR-001..005`, `TA-ADR-014`, `TA-ADR-020`, `PRD-NFR-006..008`        |
| Depends on | Product Brief, PRD, Technical Architecture, backend and operations specs |
| Status     | Implementation slice; SOT and detailed specs remain `In review`          |

## Scope / out of scope

Add a separate `@kidedu/api` pnpm workspace with NestJS/Fastify, startup/liveness/readiness HTTP checks, bounded request body size, structured Fastify logging, a pinned Node OCI build, and a GitHub Actions verification workflow. This is a code foundation under the user's explicit direction to build backend and CI before deployment. No database, identity, business endpoint, provider credentials, staging or production deploy is included.

## Acceptance

- `pnpm check:api` runs typecheck, lint, Supertest health tests and production TypeScript build.
- `/health/live`, `/health/startup` and `/health/ready` answer without leaking secrets or family data. With A03 configured, readiness probes PostgreSQL and caches a successful result briefly.
- OCI build uses a digest-pinned Node base, frozen lockfile and non-root runtime. CI builds the image after mobile and API checks.
- API code remains separate from mobile imports, Prisma models and provider SDKs.

## Data/API/schema changes

Adds only unauthenticated health endpoints. No `/v1` business contract, persistence schema or migration. `PORT` and `LOG_LEVEL` are runtime configuration; no credentials are needed.

## Security/privacy/operations

Fastify request logs redact authorization, cookie, API key and response set-cookie headers. Keep sensitive values out of URL paths/query strings. The body limit is 1 MiB until endpoint-specific limits are designed. Readiness now checks DB when configured; Auth/R2 checks remain later slices. The container runs as the `node` user; deployment parameters, SBOM, scan and runtime read-only filesystem remain later operations slices.

The 2026-10-07 logging update disables Fastify's raw URL request logs and emits only request ID, method, matched route template and status on completion. This keeps child IDs in route parameters out of normal request logs. Query strings and request bodies are not included.

## Tests

Run `pnpm check:api`, `pnpm check` and `docker build -f apps/api/Dockerfile -t kidedu-api:local .`. Record any unavailable local Docker daemon honestly. CI workflow has no deployment or secrets.

Local verification on 2026-09-30: `pnpm check:api` passed (3 Supertest cases), `pnpm check` passed (39 suites, 213 tests), Docker image built, and a local container returned `{ "status": "ok" }` from `/health/ready` while running as uid 1000. The pruned image measured 362,862,839 bytes. CI has been defined but has not run on GitHub yet. Health checks do not prove DB/Auth/R2 connectivity.

## Migration / rollback

No migration. Remove `apps/api`, workspace registration and CI/API scripts to roll back this isolated slice. Existing mobile data remains untouched.
