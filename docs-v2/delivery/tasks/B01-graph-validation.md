# B01d — Published lesson graph validation

| Field      | Value                                                           |
| ---------- | --------------------------------------------------------------- |
| Implements | `PRD-CONT-002..004`, `PRD-ACT-010`, `TA-ADR-014`                |
| Depends on | B01a Target, B01b Activity, B01c Lesson                         |
| Status     | Implementation slice; SOT and detailed specs remain `In review` |

## Scope / out of scope

Validate a lesson and its referenced activity/target records as one published structural graph. Resolve exact activity versions and require one target version per referenced ID in the selected snapshot. This does not validate media QA, asset bytes, signatures, provenance rights, entitlement or pack readiness.

## Acceptance

- A valid synthetic graph resolves activity order and target set.
- Unknown schema/type, missing or ambiguous version, unpublished record, wrong goal or disallowed activity type fails with a field path.
- Validation never silently substitutes a different activity version or target.

## Data/API/schema changes

Adds `validatePublishedLessonGraph` with no database or API migration.

## Security/privacy/operations

Only authored content IDs and fields are processed. No user/family content is logged or persisted. The pack builder must run later media/provenance/cryptographic gates as well.

## Tests

Jest covers a valid synthetic graph, missing version, unpublished/disallowed content, ambiguity and malformed input. Typecheck, lint and format checks cover the workspace.

## Migration / rollback

There is no runtime consumer yet. Remove this validator/test/task file to roll back; existing data remains untouched.
