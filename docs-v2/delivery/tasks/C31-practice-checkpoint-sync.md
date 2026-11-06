# C31 — Practice session separation and checkpoint sync

Implements: `PRD-SES-001..005`, `PRD-PROG-*`, `PRD-BR-006..008`, `TA-ADR-005/006/010`.

Authorization: same explicit FE/BE request as C29. Dependencies: C15/C27 runtime, C29 API and C30 routes.

Scope: practice-prefixed immutable generation/session ID, backend preparation before local session start, local observation/checkpoint/outbox reuse, cloud checkpoint references and paused cold restore. Sync is only on finish/explicit leave/hub update, outside activity actions. Observations must be acknowledged before advancing the cloud checkpoint. Hub offers retry for retained local sessions/outbox. Recommendation merges recent remote/local observations by event ID and respects remote supersession.

Acceptance: no activity-loop API calls; denied preparation never starts SQLite session; remote restore pauses without autoplay. Highest assistance meaning is preserved. A stale remote pause must not resurrect a session already finished locally. Backend checkpoint revisions are monotonic/idempotent, stable lesson/version references cannot be changed and finished sessions cannot rewind. Stored checkpoint contains state references only, not media URI/token/key/PII. Pending/rejected observation sync blocks checkpoint advancement; local data survives network failure.

Tests: runtime hooks for server authorization, generation separation, denied preparation, remote pause and local-finished guard; checkpoint serialization/restoration and ownership/schema tests; real Nest/PostgreSQL checkpoint retry/regression/isolation; browser observation+transfer sync and no-loop-network checks. Results in C32.

Migration: server checkpoint table in C29 migration, no SQLite schema change. Rollback: keep parser for practice-prefixed generations and preserve observation/outbox rows; remove entry/sync triggers before disabling endpoints. Do not merge separate Học/practice generations or erase local unsynced state.

Limits: cloud list returns latest 30 session references, local recommendation uses recent history. Conflicts are not silent last-write-wins merges and do not establish mastery. Native process kill/low-storage/crypto proof remains outstanding.
