# Server & Mobile Data Model Specification

> C50 target update 2026-11-05 — TA-ADR-025/026: đề xuất versioned DailyGameSession(childId,playDay unique), RewardClaim(unique child/day và stable session), RewardCatalog/OwnedItem, CustomCollection/Version, GenerationJob/QuotaReservation. Daily status reserved/in_progress/completed/expired khác reward pending/claimed. Schema chi tiết ở C50 P1, không là migration đã chạy. Giữ gameStickers/rewardReceipts cũ; không regex hard-code catalog nhỏ.

C50 P1 bắt đầu bằng content contract độc lập tại `src/content/contracts/rewardCatalog.ts`: structural schema v1 và semantic validation theo `PRD-REWARD-002`, giữ reader C49. Chưa tích hợp API/persistence/claim; không SQL migration. Asset references phải được publisher xác minh, schema không tự xác nhận human approval. Evidence/rollback tại [C50 mục 7](../delivery/tasks/C50-four-tabs-daily-games-freemium-ai.md#7-p1-slice-đầu--reward-content-contract-2026-11-05).

| Thuộc tính | Giá trị                                                     |
| ---------- | ----------------------------------------------------------- |
| Trạng thái | `In review`                                                 |
| Owner      | Backend + Mobile                                            |
| Implements | `TA-ADR-005..007`, `TA-ADR-010`, `TA-ADR-014`, `PRD-PROG-*` |
| Cập nhật   | 2026-11-05                                                  |

## 1. Data principles

Opaque UUID/ULID-style IDs, UTC server timestamps, immutable content versions, explicit ownership, foreign keys/unique constraints, soft-delete/tombstone chỉ nơi sync cần, append-only observation/audit và no cross-account identifier reuse.

## 2. Server aggregates/tables

### Identity/family

`accounts`, `auth_identities`, `families`, `family_members`, `devices`, `consent_records`.

Unique: auth provider + subject; membership family/account; device app-instance. Consent lưu document version, scope, granted/revoked timestamp.

### Child/plan

`child_profiles`, `child_settings`, `goals`, `learning_plans`, `plan_items`, `plan_revisions`. Không lưu diagnosis field trong v1. Plan revision giữ curriculum release và rule version do client dùng.

C29–C31 bổ sung `practice_plans` (child, optimistic revision, versioned plan document) và `practice_checkpoints` (child + stable session ID, monotonic revision, state reference). Tách khỏi `learning_plans` để lựa chọn Cùng luyện không ghi đè phần Học. Checkpoint cloud không chứa content payload, media URI, token/key hoặc parent note; observation dùng pipeline append-only hiện có. Migration `20261103000000_guided_practice` chỉ additive; rollback app giữ reader và dữ liệu, không drop/reset bảng. Đây không thay encrypted pack/key model.

### Curriculum/content

`skill_domains`, `targets`, `activity_templates`, `activity_instances`, `lessons`, `lesson_activities`, `content_releases`, `lesson_packs`, `pack_assets`, `manifests`, `content_reviews`, `asset_provenance`.

Published rows immutable; draft/editorial schema có thể tách namespace nhưng publish tạo snapshot không đổi.

### Learning/progress

`learning_sessions`, `activity_attempts`, `observations`, `observation_supersessions`, `sync_events`, `idempotency_records`. Observation giữ activity/content version và prompt/context.

### Billing/access

`subscription_accounts`, `store_events`, `entitlements`, `activation_records`, `pack_key_records`. Không persist plaintext content key trong application table.

### Media/privacy

`user_media`, `media_bindings`, `media_uploads`, `storage_objects`, `export_jobs`, `deletion_jobs`, `retention_tombstones`, `audit_events`.

## 3. Local SQLite groups

- `local_meta`, `account_namespace`, `schema_migrations`;
- `child_projection`, `plan_projection`, `progress_projection`;
- `content_catalog`, `content_generations`, `pack_registry`, `asset_registry`;
- `learning_sessions_local`, `activity_checkpoints`;
- `observations_local`, `outbox_events`, `sync_cursors`;
- `user_media_local`, `media_bindings_local`, `upload_jobs`;
- `activation_cache` chứa signed grant metadata, không plaintext key.
- `notification_preferences_local`, `local_notification_schedules` chứa stable schedule ID; không lưu provider server credential.

Local projection không mirror mọi server table; chỉ lưu dữ liệu cần runtime.

## 4. Key relationships

```text
Account ─ Family ─ ChildProfile ─ LearningPlan ─ PlanItem ─ Lesson(version)
                                      │                     └─ ActivityInstance
                                      └─ Observation ─ Target/Activity/version

ContentRelease ─ Manifest ─ LessonPack ─ PackAsset(storage object)
Child + Target/Activity + Role ─ MediaBinding ─ UserMedia
SubscriptionAccount ─ Entitlement ─ ActivationRecord ─ authorized PackKey IDs
```

## 5. Data classification

| Class           | Examples                                        | Handling                                     |
| --------------- | ----------------------------------------------- | -------------------------------------------- |
| public/product  | store copy, public catalog title                | no child/user identifier                     |
| internal        | draft content, operations                       | role restricted                              |
| personal        | parent account, child nickname/profile/progress | encrypt/least privilege/export/delete        |
| sensitive media | family image/audio/video                        | private bucket, separate key/domain, no logs |
| secret/key      | tokens, signing/content/R2 keys                 | Secret provider/KMS/secure store only        |

## 6. Migration rules

- Server migration expand → deploy compatible app/server → backfill → contract; không drop/rename cùng release.
- Migration transaction khi PostgreSQL hỗ trợ; large backfill resumable và observable.
- Mobile migration incremental/idempotent; backup/check free space; failure không reset user data tự động.
- Content pack schema có reader compatibility matrix và minimum app version.
- Rollback code không được giả định rollback schema destructive.

## 7. Legacy migration

Legacy `LearningItem/Media/Deck` chỉ migrate khi mapping chắc chắn:

- LearningItem text/topic → candidate Target;
- media role/source → Asset/UserMedia với provenance;
- Deck → user collection hoặc lesson draft, không mặc định là curriculum lesson;
- progress view count → legacy activity history, không chuyển thành observation `+/-/-`;
- local backup import phải gắn account/child owner trước khi sync cloud.

## 8. Retention/delete

Account delete tạo server job, revoke grant, tombstone sync data, xóa/anonymize theo policy và đối soát object inventory qua `ObjectStorageGateway`. Audit chỉ giữ tối thiểu pháp lý, không giữ family media. Client nhận deletion state và purge namespace/key.

## 9. Index/constraint baseline

Index mọi foreign key/query cursor; unique idempotency event/provider ID; check enum/state transitions; optimistic version trên mutable profile/plan/media; partial indexes cho active/non-deleted rows. Schema detail phải có query plan test cho sync và Today bootstrap.

## 10. Open items

C50 P4: `20261106000000_daily_game_rewards` thêm reservation (session primary key, bốn candidates), inventory (unique child/item) và receipt (unique session/inventory). Claim transaction dùng child lock chung với daily sessions, commit inventory và receipt nguyên tử. Receipt không phụ thuộc current subscription; không đổi legacy receipt IDs. Giữ toàn bộ tables/data khi rollback; chưa dual-read/import legacy C49 nên chưa cutover. Migration/evidence tại C50 mục 13.

C50 P2 persistence foundation: migration `20261105010000_daily_game_session` thêm `daily_game_sessions`, unique `(child_id, play_day)`, pin window/tier/plan, checkpoint revision và completion timestamp. Repository khóa child row sau ownership check để serialize start/resume và checkpoint giữa thiết bị; clock đọc sau khi lấy khóa. CAS revision và monotonic completed IDs chặn stale overwrite. Đây là internal boundary chưa expose controller, chưa là activation/decryption/reward authority. Rollback giữ bảng/dữ liệu để không mở lượt mới; chỉ migrate database test riêng. Evidence và phần còn thiếu tại C50 mục 11.

C50 P1 profile: migration `20261105000000_child_gender` bổ sung nullable enum `ChildGender` (`boy`, `girl`) cho `child_profiles`. Không default/backfill từ tên; các row cũ giữ null. Parent khai báo qua guarded/versioned API; initial update hai thiết bị chỉ một transaction update thắng. Rollback server/mobile giữ column/type/giá trị và reader cũ; không down migration drop dữ liệu. Evidence chạy PostgreSQL local riêng tại C50 mục 9, chưa deploy database dùng chung/production.

Local Cùng luyện sample runtime: schema v3 adds `practice_media_bindings` keyed by child/lesson/target/activity/asset within the account database. Replacement is transactional and only affects future preparation; saved sessions retain their media snapshots. Family media stays local in a separate practice subtree and can be managed/exported after learning expiry. Migration is additive from v1/v2 and preserves observations/outbox. Keep v3 reader/table on rollback; see [C34](../delivery/tasks/C34-practice-family-media-bindings.md). This fixture implementation is not the encrypted production-pack persistence contract.

ERD vật lý, field-level encryption, exact retention, partition threshold và legacy import policy được chốt trong implementation design trước migration.
