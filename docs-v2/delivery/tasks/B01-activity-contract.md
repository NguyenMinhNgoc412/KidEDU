# B01b — Activity content contract

| Field      | Value                                                               |
| ---------- | ------------------------------------------------------------------- |
| Implements | `PRD-ACT-001..010`, `PRD-CONT-006`, `TA-ADR-014`                    |
| Depends on | B01a Target; curriculum, learning activity and events/content specs |
| Status     | Implementation slice; SOT and detailed specs remain `In review`     |

## Scope / out of scope

Add a versioned authored `ActivityInstance` contract with discriminated stimulus payloads for the ten v1 activity families. The common envelope carries instructions, expected response, prompt ladder, timing, asset references, rubric and transfer guidance. Auto Play is a session policy, not a new content activity type. Media descriptors, pack readiness, lesson assembly and runtime player integration follow in later slices.

## Acceptance

- Unknown type/version or incomplete type-specific stimulus fails validation.
- Recognition accepts two to four authored options and only references visible answer IDs; it does not require mouth video.
- Preference questions have no authored factual truth; factual questions require it.
- Required and optional asset references are separate and duplicate asset IDs fail validation.

## Data/API/schema changes

Adds `activitySchemaV1` and a JSON Schema export with a stable `$id`. No database or API migration.
Cross-field checks (asset roles, references and timing) run in Zod validation; JSON Schema consumers must not treat structural validation alone as publish approval.

## Security/privacy/operations

No child recording, provider URL, owner ID or runtime entitlement is accepted in the contract. Asset integrity, provenance, review and access must be validated before a lesson becomes prepared.

## Tests

Jest covers representative recognition and yes/no payloads, malformed versions/types, answer references and timing. Typecheck/lint/format validation covers the workspace.

## Migration / rollback

There is no runtime consumer yet. Remove this contract/test/task file to roll back; local user data is unaffected.
