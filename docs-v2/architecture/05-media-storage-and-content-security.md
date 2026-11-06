# Media, Storage & Content Security Specification

> C50 target update 2026-11-05 — TA-ADR-026: AI private staging/output dùng family namespace, signed/encrypted pack và approved references; không arbitrary URL/path từ client/model. Reward asset quyền xem inventory tách khỏi premium learning key; thiếu asset không xóa receipt.

| Thuộc tính | Giá trị                                                       |
| ---------- | ------------------------------------------------------------- |
| Trạng thái | `In review`                                                   |
| Owner      | Mobile + Backend + Content Operations                         |
| Implements | `TA-ADR-007..010`, `TA-ADR-024`, `PRD-MEDIA-*`, `PRD-NFR-003` |
| Cập nhật   | 2026-11-05                                                    |

## 1. Storage topology

- Google Drive 5 TB: raw/source/master/archive do owner quản lý, không runtime origin.
- Logical storage class `default-content`: immutable encrypted pack/media production; baseline adapter dùng Cloudflare R2 Standard.
- Logical storage class `family-media`: private user object, account/family scoped; baseline adapter dùng R2 private.
- Logical storage class `database-backup`: encrypted logical dump, credential/retention tách khỏi runtime media.
- Logical storage class `exports`: short-retention generated export.
- Mobile encrypted pack/media cache và separate family-media namespace.

`ObjectStorageGateway` sở hữu put/head/delete/inventory/transfer-authorization; application lưu logical object ID/key/hash/size/provider class, không lưu presigned/public URL làm identity. R2 bucket tách staging/production và content/family/backup; public access tắt; access key least-privilege; presigned URL ngắn hạn.

## 2. Default content pipeline

```text
Drive/source
→ ingest workspace
→ malware/type/metadata validation
→ FFmpeg normalize/transcode/thumbnail + technical report
→ Vietnamese linguistic + audio + mouth-video + visual/motion + license review
→ immutable hash
→ encrypt/sign pack
→ upload through object-storage adapter
→ publish manifest/release
```

Không overwrite object cùng key/hash. Retire qua manifest, không sửa bytes.

Veo/TTS/image output chỉ là candidate. Source/master/provenance nằm ở Drive; production derivative tuân [Content Media Production Specification](../product/06-content-media-production-spec.md). Audio delivery mặc định AAC-LC `.m4a`; mouth video MP4 H.264/AAC; animation là allowlisted Reanimated/SVG recipe hoặc versioned Lottie JSON có static fallback.

## 3. Family media pipeline

Client stage/validate/preview/commit local trước. Cloud upload request gửi size/hash/type/role; server kiểm consent/quota và cấp provider-neutral resumable/transfer authorization. Sau upload client/server finalize; backend dùng `ObjectStorageGateway.head/checksum` verify object rồi mới tạo cloud binding.

Filename/object key không chứa tên trẻ hoặc text target. Derived thumbnail inherits owner/retention.

## 4. Encryption domains

- Premium content: per pack/version CEK, AES-GCM, manifest bind hash/opaque key ID; CEK wrapped bằng server-controlled `KeyManagementGateway`, baseline adapter dùng Cloud KMS.
- Family media: user/family encryption domain riêng; subscription expiry không revoke ownership key.
- Transport: TLS; signed URL chỉ là delivery authorization, không thay encryption/entitlement.
- Plaintext chỉ tồn tại trong bounded runtime/temp và phải cleanup; không backup/log/temp-share ngoài app.

## 5. Mobile cache

Content-addressed path không dựa filename. Registry lưu hash, size, pack/version, encrypted state, last access và pin reason. LRU weighted eviction không xóa family media, active lesson, staging đang commit hoặc outbox.

## 6. Playback

Resolver kiểm account → grant → pack/key → integrity → local URI/stream adapter. Vì encrypted file có thể cần decrypt-on-read/native temp strategy, POC phải đo memory, startup và cleanup. Không tạo permanent plaintext duplicate.

## 7. Upload/download abuse

Server rate limit, quota, content-length/type allowlist, presigned URL expiry và finalize ownership. Không proxy binary qua NestJS trừ payload nhỏ; app server chỉ authorize/metadata để giữ Cloud Run CPU/network thấp. R2 credential không bao giờ gửi cho mobile.

## 8. Operations

Inventory detect orphan/missing object; lifecycle rule cleanup staging/export/backup; object versioning theo bucket policy; restore test metadata + object; metrics storage/operations/cache-hit/upload-failure. Drive source phải map vào immutable hash trước publish và không xuất hiện trong runtime manifest.

## 9. Acceptance

Test corrupt/malicious file, MIME spoof, huge dimensions, interrupted upload/download, signed URL expiry, account switch, cache copy, key expiry, low storage, orphan cleanup và deletion inventory.
