# Events & Content Schema Contract

| Thuộc tính | Giá trị                                                              |
| ---------- | -------------------------------------------------------------------- |
| Trạng thái | `In review`                                                          |
| Owner      | Mobile + Backend + Content Pipeline                                  |
| Implements | `TA-ADR-005`, `TA-ADR-014`, `TA-ADR-024`, `PRD-CONT-*`, `PRD-PROG-*` |
| Cập nhật   | 2026-09-29                                                           |

## 1. Versioning

Schemas viết bằng JSON Schema/Zod, có `$id`, `schemaVersion`, canonical fixtures và compatibility tests. Network event/content record không dùng TypeScript type riêng lẻ làm contract duy nhất.

Owner giữ taxonomy contract v1 hiện tại và sẽ bổ sung sau nếu cần. `targetType` v1 gồm `person`, `object`, `action`, `attribute`, `phrase`, `sentence`. `activityType` v1 gồm `word_model`, `recognition`, `naming`, `cloze_tail`, `functional_sentence`, `yes_no`, `visual_qa`, `command`, `functional_communication`, `parent_transfer`. Loại mới hoặc thay đổi meaning của loại hiện có cần schema version mới và compatibility review; published record không bị diễn giải lại âm thầm. Đây là quyết định cho enum contract, không chốt corpus depth hay content QA còn mở.

## 2. Sync event envelope

```json
{
  "schemaVersion": 1,
  "eventId": "evt_opaque",
  "eventType": "observation.recorded",
  "accountScope": "family_opaque",
  "childId": "child_opaque",
  "occurredAt": "2026-09-08T03:00:00Z",
  "deviceInstanceId": "device_opaque",
  "payload": {}
}
```

Event ID ổn định qua retry. Server derive account từ auth và đối chiếu scope; không tin envelope owner.

## 3. Event types v1

| Type                         | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| `observation.recorded`       | append immutable observation                   |
| `observation.superseded`     | correction link                                |
| `learning_session.completed` | session summary, không mastery                 |
| `plan.revised`               | persisted client rule result/revision          |
| `media.binding_changed`      | family binding metadata sync                   |
| `media.deleted`              | tombstone                                      |
| `consent.changed`            | server-generated audit/domain event            |
| `entitlement.changed`        | server-generated activation invalidation input |

Analytics events tách schema/domain storage, không tái sử dụng raw sync payload.

## 4. Prepared activity schema

```json
{
  "schemaVersion": 1,
  "id": "activity_opaque",
  "version": 3,
  "type": "cloze_tail",
  "goalId": "goal_opaque",
  "targetIds": ["target_opaque"],
  "instruction": { "parent": "..." },
  "stimulus": {},
  "expectedResponse": {},
  "promptLadder": [],
  "timing": { "waitMs": 4000 },
  "assets": { "required": [], "optional": [] },
  "observationRubric": {},
  "transfer": {}
}
```

Mỗi activity type có discriminated payload schema; unknown type/version làm lesson not-ready, không best-effort render sai.

## 5. Manifest schema

Fields: canonical schema version, release/generation, issued/published, minimum app, pack descriptors, asset hash/size/type/key ID, capability tags, dependencies và signature envelope. Canonicalization/signature algorithm nằm trong crypto protocol; JSON object order không được tự coi là canonical.

## 6. Pack constraints

Schema quy định maximum counts/string/array/depth và accepted media descriptors. Không embedded base64 large media. External URL không được lưu làm direct runtime URL; dùng immutable storage object reference.

Asset descriptor có tối thiểu:

```json
{
  "assetId": "asset_opaque",
  "version": 1,
  "kind": "audio",
  "role": "canonical_target",
  "scope": "default",
  "locale": "vi-VN",
  "required": true,
  "objectRef": "object_opaque",
  "contentHash": "sha256:...",
  "format": { "container": "m4a", "codec": "aac-lc" },
  "provenanceRef": "provenance_opaque",
  "qaStatus": "approved",
  "fallbackAssetId": null
}
```

`scope` là `default|family_custom|family_media`; family scope không nhận owner ID từ content payload để tự authorize. Audio bổ sung transcript/voice/speaker/accent/rate/duration/loudness metadata; video bổ sung dimensions/frame-rate/lip-sync review; image bổ sung dimensions/alpha/semantic label; animation chỉ nhận allowlisted `motionRecipeId` + bounded parameters hoặc reviewed Lottie object reference và bắt buộc static fallback.

Provenance record giữ source type, provider/tool/model/config/version, prompt/recipe reference đã redact, creator/rights/license, source/derivative hash, reviewer/checklist/timestamp/status. Provider secret và raw PII không thuộc schema.

## 7. Observation payload

Result enum `independent|supported|not_yet|not_observed`; prompt level nullable theo rubric; giữ content/activity version, context, session/attempt và optional encrypted/sanitized note. Server reject result/prompt không hợp activity schema.

## 8. Compatibility gate

CI validate examples, previous-reader fixtures, manifest signature, deterministic pack build, asset profiles, motion recipe allowlist và generated types. Retired field không tái sử dụng cùng tên với meaning khác.
