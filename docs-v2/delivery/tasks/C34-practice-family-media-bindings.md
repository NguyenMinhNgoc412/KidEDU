# C34 — Child and activity scoped family media

Implements: `PRD-MEDIA-*`, `PRD-ACC-005`, `PRD-SES-*`, `TA-ADR-005/006`. Dependencies: C33, local runtime repository and existing media import/player/permissions.

Authorization: direct implementation request. Scope: parent-only image/video picking and audio recording with staged preview, confirmation, atomic SQLite binding, file export and fallback. Bindings use account database plus child/lesson/target/activity type/asset role. Editor/export remains reachable in Parent Zone when learning entitlement expires; no learning authorization is granted by editing media.

Acceptance: source account/child and role validated before prepare; unreadable replacement falls back to bundled sample; failed commit retains prior binding; new sessions resolve current bindings while paused sessions keep their immutable prepared assets. Staging is discarded on cancel/unmount; recording stops on background/unmount and concurrent editors cannot record simultaneously. Native practice files have a separate subtree so legacy orphan cleanup cannot delete them. Unreferenced replaced files are cleaned; files referenced by saved sessions are retained for safe restore/history. Family files are not uploaded or placed in API checkpoints.

Tests: real SQLite isolation/foreign URI/replacement/reference-retention and additive migration tests; browser file picker → preview → confirm → default fallback. Native permission/recording/process-kill/low-storage and account deletion/export coverage still require device review; do not claim those from Chromium.

Migration: local runtime schema v3 adds `practice_media_bindings` without changing observation/outbox/session rows. Existing v1/v2 databases migrate additively. Rollback must keep v3 reader/table and family files; hide editor first, never reset account databases. No PostgreSQL migration for local-only family bindings.

Out of scope: optional cloud family-media backup/consent, arbitrary external URI imports, AI Custom Library and clinical media approval. Saved-session file retention is conservative; automatic deletion on history retention/account erasure must be verified with the wider account data lifecycle before release.
