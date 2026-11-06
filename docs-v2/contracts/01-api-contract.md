# API Contract Overview

C50 P1 profile slice: `Child.gender` là `boy | girl | null`, có thể thiếu khi đọc server cũ. Create v1 chấp nhận thiếu để giữ compatibility; client mới bắt buộc parent chọn, không default/suy tên. PATCH chỉ điền khi null hoặc gửi lại cùng giá trị, sửa giá trị khác trả 409 cho đến khi D05 correction policy được duyệt; không cho clear null. Ownership/consent/version guards giữ nguyên. Prisma migration `20261105000000_child_gender` additive, phải chạy trước server mới; OpenAPI/generated mobile client được cập nhật. Đây chưa là daily-game API cutover.

> C50 target update 2026-11-05 — C50 P1/P2 đề xuất versioned start/resume/complete/claim/status daily-game contracts (tên endpoint chốt khi implementation), serverTime/playDay/resetAt/reservationId/sessionId/tier/contentVersion, stable command IDs và conflict codes. Draft/quote/job/preview/approve custom API có quota/ownership. C49 DTO bên dưới là implemented baseline, không đủ catalog/quota C50; cập nhật OpenAPI/generated client trong P1, chưa sửa runtime contract ở docs task.

C49 adds optional `pendingReward` (activity/slot, two stable candidates, selected kind) and `rewardReceipts` (slot key ? kind/item ID, max 120). IDs are bounded to 18 themed stickers and eight puzzle pieces. Receipts cannot be erased or changed by a later revision; candidates for the same pending slot cannot reroll. `stickers` remains the compatible inventory field name and now includes both item kinds. Existing `gameStickers` stays readable. No SQL migration or activity-loop API. See [C49](../delivery/tasks/C49-reward-choice-and-completion-chime.md).

C43 adds optional `PracticeCheckpoint.gameProgress`: activity-ID → schema-v1 per-piece state (`memoryOpen`, `memoryMatched`, `found`, `placed`). Bounded unique IDs, maximum 30 activities; memory card IDs allow the authored piece ID plus its two-character suffix. Revisions cannot erase completed memory pairs/found/placed pieces. Restore validates references against prepared content. SQLite writes remain local per interaction; cloud sync occurs outside the game loop. See [C43](../delivery/tasks/C43-game-progress-recovery-and-renderers.md).

C41 adds optional `PracticeCheckpoint.gameStickers` (activity-ID → one of five bundled sticker IDs), requiring three completed rounds and immutable once saved. GET practice checkpoints also returns optional `stickers`, a DISTINCT collection across all owned-child checkpoint documents, independent of the 30 resume-reference limit. SQLite mirrors the collection across all child sessions. No SQL migration, activity-loop API or observation synthesis. See [C41](../delivery/tasks/C41-picture-first-games-and-sticker-album.md).

C40 adds optional `PracticeCheckpoint.gameRounds`: an activity-ID map of completed game counts (integers 1–3, at most 30 entries). Existing fields/readers remain compatible; the server rejects losing previously checkpointed counts. These are cosmetic game-completion records, never entitlement grants or language observations. SQLite commits occur per completed game; API sync remains outside the activity loop. See [C40](../delivery/tasks/C40-lesson-vocabulary-games.md) and `apps/api/openapi.local.yaml`.

| Thuộc tính | Giá trị                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Trạng thái | `In review`                                                             |
| Owner      | Backend                                                                 |
| Implements | `TA-ADR-014`, `TA-ADR-016`, PRD account/sync/media/subscription/privacy |
| Base       | HTTPS `/v1` REST/JSON, OpenAPI 3.1                                      |
| Cập nhật   | 2026-11-05                                                              |

## 1. Contract rules

C37: optional `PracticeDocument.lessonIds` is the explicit ordered session selection. Missing field retains previous composition; `[]` means no selected lessons. Server rejects duplicate/unknown/deferred entries and conflicting non-null first-lesson references. Revision/ownership/entitlement guards remain unchanged. Course checkpoints retain immutable order after preparation; plan edits do not mutate active sessions. See [C37](../delivery/tasks/C37-edit-session-lessons.md) and the executable OpenAPI definition.

C29–C31 add child-scoped `/children/{childId}/practice/{catalog,plan,checkpoints}` and `/practice/lessons/{lessonId}/prepare`. The versioned document/OpenAPI definitions are in [the executable contract](../../apps/api/openapi.local.yaml); mobile uses its generated types/client. Practice plan is separate from LearningPlan, PUT uses expectedRevision, checkpoint references use stable session ID + monotonic revision. Family-owned plan/checkpoint reads and checkpoint sync remain available after subscription expiry, while lesson preparation and plan learning mutations require access. Only explicit APP_ENV=local exposes starter fixture metadata; this is not a production content grant.

- `Authorization: Bearer <provider access token>` trên authenticated endpoint; baseline Supabase JWT được `SupabaseIdentityAdapter` verify qua issuer/audience/JWKS.
- `X-App-Version`, `X-Platform`, `X-Device-Instance`, `X-Request-Id` theo contract.
- Mutation retry-sensitive dùng `Idempotency-Key`.
- UTC ISO-8601; opaque string IDs; cursor opaque.
- Request/response validate Zod và OpenAPI compatibility test.
- Mobile dùng generated client; không hand-write duplicate DTO.

Error:

```json
{
  "error": {
    "code": "PACK_NOT_AUTHORIZED",
    "message": "Nội dung này hiện không khả dụng.",
    "requestId": "req_...",
    "fields": []
  }
}
```

## 2. Bootstrap/activation

### `POST /v1/bootstrap`

Input app/device/schema/current generation/cursors/child. Output server time, minimum version, account/profile deltas, catalog refs, entitlement summary, activation grant và required/prefetch manifests. Không chứa media bytes.

### `POST /v1/activations/refresh`

Revalidate entitlement/device và trả signed grant/wrapped keys cần thiết. Rate-limited và audited.

## 3. Account/family/children

- `GET /v1/me`
- `POST /v1/families`
- `GET/POST /v1/children`
- `GET/PATCH/DELETE /v1/children/{childId}`
- `GET/POST /v1/consents`
- `POST /v1/devices/register`
- `DELETE /v1/sessions/devices/{deviceId}`

Object authorization theo family membership; không nhận `accountId` từ client để quyết owner.

## 4. Plan/progress sync

- `GET /v1/children/{childId}/plan`
- `PUT /v1/children/{childId}/plan` với expected revision/idempotency
- `GET /v1/children/{childId}/sync?cursor=...`
- `POST /v1/children/{childId}/events:batch`
- `GET /v1/children/{childId}/observations`
- `POST /v1/observations/{id}:supersede`

Batch event có per-item ack/rejection; accepted duplicate trả cùng result. Không fail toàn batch chỉ vì một validation item nếu contract quy định partial ack.

## 5. Catalog/content/download

- `GET /v1/content/catalog?release=...&cursor=...`
- `GET /v1/content/manifests/{manifestId}`
- `POST /v1/content/packs/{packId}:authorize-download`
- `POST /v1/content/releases/{releaseId}:ack-install`

Manifest signed; download response có provider-neutral transfer authorization/short-lived URL, expected hash/size/expiry, không có plaintext content key ngoài wrapped grant flow. Client không dựa hostname/bucket provider làm object identity.

## 6. Family media

- `POST /v1/children/{childId}/media/uploads`
- `POST /v1/media/uploads/{uploadId}:finalize`
- `GET /v1/children/{childId}/media`
- `PUT /v1/children/{childId}/media-bindings/{bindingId}`
- `DELETE /v1/media/{mediaId}`
- `POST /v1/media/{mediaId}:authorize-download`

Create upload kiểm role/type/size/quota/consent; finalize kiểm object/hash/ownership. App server không proxy large binary.

## 7. Billing

- `GET /v1/subscription`
- `POST /v1/subscription:reconcile`
- `POST /v1/webhooks/apple/app-store-server-notifications-v2` — verify signed JWS, không dùng parent auth
- `POST /v1/webhooks/google/play-rtdn` — authenticated Pub/Sub push, không dùng parent auth

Webhook/message verification phải theo contract của từng store; response nhanh sau durable idempotent persist rồi reconcile server API. Endpoint không cấp entitlement chỉ từ raw notification payload.

## 8. Privacy

- `GET /v1/privacy/inventory`
- `POST /v1/privacy/exports`
- `GET /v1/privacy/exports/{jobId}`
- `POST /v1/privacy/deletions`
- `GET /v1/privacy/deletions/{jobId}`
- `DELETE /v1/account`

Export download URL ngắn hạn; deletion status không báo complete trước khi scope hoàn tất.

## 9. Admin

Prefix `/v1/admin`, role/MFA/audit bắt buộc: catalog draft CRUD, review, asset ingest status, publish/retire release, build job status và kill switch. Browser không nhận R2/Supabase privileged credential.

## 10. Compatibility

C50 implemented HTTP slice (2026-11-06): `GET /v1/children/{childId}/daily-game`, `GET .../inventory`, `POST .../start`, `PUT .../{sessionId}/checkpoint`, `GET .../{sessionId}/reward`, `POST .../{sessionId}/reward/reserve`, `POST .../{sessionId}/reward/claim`. Shapes tại `apps/api/openapi.local.yaml`; generated client không dùng Prisma. Auth/ownership bắt buộc; stale mutation trả 409, expired window 410, unavailable reviewed content 503 không tiêu lượt. Exact committed checkpoint retry trả ACK; claim retry theo session trả cùng receipt sau reset. Reward query trả `incomplete | choose_kind | boxes | claimed | expired`, kind đã chọn và receipt đã xác nhận, không lộ candidates; query không cần subscription/catalog hiện tại. Inventory đọc độc lập subscription và có legacy dual-read trên mobile. Production content gateway vẫn unavailable; chỉ Compose local bật synthetic integration corpus bằng `C50_LOCAL_DAILY_FIXTURE=1` cùng `APP_ENV=local`. Activation/private-pack và production catalog còn ở C50 gates.

Breaking field/semantic change tạo API version hoặc additive-deprecate window. Unknown response field client bỏ qua; required enum mới cần compatibility gate. OpenAPI diff chạy CI và fixture support ít nhất app versions backend còn hỗ trợ.
