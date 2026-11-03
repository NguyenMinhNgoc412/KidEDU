# C16 — Account media storage / resolver boundary

Implements: `PRD-ACC-005`, `PRD-MEDIA-*`, `PRD-PRIV-003`, `TA-ADR-007/010`.
Depends on: internal account namespace, existing stage/preview/commit flow.
Status: Local storage and display scope implemented; encryption/cloud/key boundary pending.

## Scope / acceptance

New parent media commits use `media/accounts/<account-id>/<type>/`; video thumbnails use the same account. Web durable blobs receive an account-bound ID/owner while preview blobs stay staged. After copy, an unmounted account editor cannot commit metadata into another account. Existing account DB namespace remains the metadata owner.

Display resolver denies another account's scoped file/blob URI before returning even a cached ready source. Account switch invalidates the visible source and pending object URL resolution; logout removes the account context. Family-media access does not depend on learning subscription. This path guard is additional isolation, not encryption or premium activation.

Default orphan directory sweep requires an account ID and scans only that account root. It never scans all account media against one account DB. Foreign scoped paths are excluded from orphan cleanup. Unassigned legacy/restored locations are not silently copied, adopted or swept; encryption and backup/restore namespace migration still need separate work.

## Tests / migration / rollback

Tests cover distinct directories, invalid path IDs, foreign file/blob/cached URI denial, normalized traversal, scoped durable recording commit, safe default sweep and preserving foreign files from an injected inventory. Existing media resolver/import/cleanup tests are retained. Final executed checks are in the review.

No SQLite/backend schema migration or dependency. New files use the namespace; existing URIs are preserved. Rollback may revert wiring but must preserve scoped files and metadata; do not move/delete all files as a downgrade. No SOT change or key-policy decision.

## Out of scope

Family encryption/key recovery, child-target-activity bindings, cloud consent/quota/finalize, backup/import migration, OS/native lifecycle evidence and premium signed-pack enforcement. The legacy URI resolver is not a production encrypted-content resolver.
