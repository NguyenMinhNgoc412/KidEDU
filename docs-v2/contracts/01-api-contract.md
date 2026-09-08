# API Contract Overview

| Thuộc tính | Giá trị                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Trạng thái | `In review`                                                             |
| Owner      | Backend                                                                 |
| Implements | `TA-ADR-014`, `TA-ADR-016`, PRD account/sync/media/subscription/privacy |
| Base       | HTTPS `/v1` REST/JSON, OpenAPI 3.1                                      |
| Cập nhật   | 2026-09-08                                                              |

## 1. Contract rules

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

Breaking field/semantic change tạo API version hoặc additive-deprecate window. Unknown response field client bỏ qua; required enum mới cần compatibility gate. OpenAPI diff chạy CI và fixture support ít nhất app versions backend còn hỗ trợ.
