# B01c — Lesson content contract

| Field      | Value                                                           |
| ---------- | --------------------------------------------------------------- |
| Implements | `PRD-PLAN-*`, `PRD-ACT-010`, `PRD-CONT-004`, `TA-ADR-014`       |
| Depends on | B01a Target, B01b Activity; curriculum and events/content specs |
| Status     | Implementation slice; SOT and detailed specs remain `In review` |

## Scope / out of scope

Define a versioned authored lesson with one primary goal, at most one supporting goal, a version-pinned activity sequence and an in-sequence parent transfer. The 64-reference parser bound is a safety cap, not the daily/session length decision (`PRD-TBD-01`). Plan selection, pack assembly and content publish validation remain later slices.

## Acceptance

- Lesson references explicit activity versions so an active session can retain its content snapshot.
- Transfer references an in-sequence `parent_transfer` activity; at least one learning activity is present.
- Duplicate activity versions, identical primary/supporting goals, unknown fields and versions fail validation.

## Data/API/schema changes

Adds `lessonSchemaV1` and JSON Schema export. No database or API migration.
Cross-field sequence checks run in Zod validation; JSON Schema alone is not a publish gate.

## Security/privacy/operations

No child or family identity appears in the authored lesson. Pack assembly must resolve all references and validate publish status, content integrity and entitlement before runtime use.

## Tests

Jest validates a synthetic lesson and rejects broken references; typecheck/lint/format cover the workspace.

## Migration / rollback

There is no runtime consumer yet. Remove the isolated contract/test/task file to roll back; existing user data is unaffected.
