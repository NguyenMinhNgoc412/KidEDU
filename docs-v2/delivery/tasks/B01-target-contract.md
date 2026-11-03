# B01a — Target content contract

| Field      | Value                                                                                |
| ---------- | ------------------------------------------------------------------------------------ |
| Implements | `PRD-CONT-001..005`, `TA-ADR-014`                                                    |
| Depends on | Product Brief, PRD, Technical Architecture, curriculum spec, events/content contract |
| Status     | Implementation slice; SOT and detailed specs remain `In review`                      |

Owner xác nhận ngày 2026-09-29: giữ nguyên taxonomy target/activity v1 hiện tại; có thể bổ sung sau qua version mới của contract.

## Scope / out of scope

Define a bounded, versioned Zod contract for authored target metadata and a canonical synthetic fixture. Activity, lesson, asset, provenance-record and pack schemas remain separate B01/B03/B04 slices. This contract does not publish content or grant access.

## Acceptance

- A Vietnamese target declares taxonomy, prerequisites, allowed activity types, provenance reference and content version.
- Unknown schema versions, fields, activity types, duplicate references and self prerequisites fail validation.
- A target with no mouth video may still allow recognition; asset readiness is checked by the later activity contract.

## Data/API/schema changes

Adds `targetSchemaV1` and a JSON Schema export with a stable `$id`. Duplicate and self-reference checks run in Zod validation, so JSON Schema alone is not a publish gate. No database or API migration.

## Security/privacy/operations

The contract contains no child identity, family data, provider UID or runtime URL. A provenance reference is required; actual rights and human review must be checked at publish time.

## Tests

Jest validates the synthetic fixture and rejects incompatible payloads. Typecheck and lint cover integration with the mobile workspace.

## Migration / rollback

No runtime consumer exists yet. Rollback removes this isolated schema, test and task file; existing local data remains untouched.
