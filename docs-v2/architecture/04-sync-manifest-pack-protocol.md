# Sync, Manifest & Lesson Pack Protocol

| Thuộc tính | Giá trị                                       |
| ---------- | --------------------------------------------- |
| Trạng thái | `In review`                                   |
| Owner      | Mobile + Backend + Content Pipeline           |
| Implements | `TA-ADR-004..009`, `TA-ADR-014`, `PRD-SYNC-*` |
| Cập nhật   | 2026-09-08                                    |

## 1. Sync channels

| Channel              | Direction                               | Unit                                                   |
| -------------------- | --------------------------------------- | ------------------------------------------------------ |
| activation/bootstrap | server → client                         | grant, trusted time, flags, cursors, required releases |
| user delta           | both                                    | profile/plan/media metadata changes                    |
| progress outbox      | client → server                         | immutable idempotent events                            |
| catalog/manifest     | server → client                         | versioned index and signed manifests                   |
| pack/assets          | server → client                         | encrypted immutable bytes                              |
| family upload        | client → object storage/server finalize | private media object                                   |

## 2. Bootstrap contract

Request gồm app/platform/version, device/app-instance, verified internal identity context, current account namespace, local schema, active generation/release, sync cursors và requested child. Response chỉ gồm trusted server time, effective entitlement/activation, minimum app version, user delta, catalog delta và required/preferred pack refs.

Server trả `NO_CHANGE`, `DELTA` hoặc `FULL_RESYNC_REQUIRED` theo từng channel; không gộp full media vào bootstrap.

## 3. Manifest

Canonical serialized manifest được ký, có schema version, release/generation, pack/asset hash-size-encryption-key ID, dependency, capability tag, min app version và publish timestamp. Client verify signature trước tin bất kỳ URL/hash/dependency nào.

## 4. Download/install

```text
authorize
→ allocate staging + storage check
→ download/resume encrypted bytes
→ verify size/hash/signature
→ validate bounded schema/dependencies
→ SQLite transaction register new generation
→ atomic active-generation switch
→ cleanup old unreferenced generation
```

Không decrypt toàn pack ra durable plaintext. Parser có size/depth/count limits để chống malicious/corrupt content.

## 5. Prefetch policy

Default: current + 2 next lessons. Scheduler ưu tiên required structured data/audio/image trước mouth video optional, chỉ tải entitlement-valid pack, tôn trọng cellular/data saver/battery/storage. Parent có control tải/dọn cache; active session/unsynced data/family media không bao giờ là cache eviction target.

## 6. User delta/conflict

- Observation append-only merge bằng event ID.
- Profile/settings optimistic version; conflict trả current server value + client proposal.
- Plan lưu revision/rule version; client không overwrite plan mới bằng stale revision.
- Delete tombstone ngăn device cũ làm record sống lại.
- Server cursor opaque, account/child scoped và hết hiệu lực được báo explicit.

## 7. Recovery

Partial download giữ resumable staging trong TTL. Verify/install failure giữ active generation cũ. Crash sau DB switch trước cleanup vẫn valid. Corrupt active asset chuyển pack `failed/repair_required`, không tự fallback sang unauthorized/plaintext source.

## 8. Protocol acceptance

Contract fixtures cho current/previous schema; tests kill process tại mọi transition; tampered signature/hash; no-space; duplicate/out-of-order delta; expired signed URL resume; account switch; entitlement loss; app downgrade/upgrade.

## 9. Size decision

Pack granularity chỉ chốt sau khi đo corpus: distribution structured bytes, audio/image/video, first-lesson time và storage. Không dùng một pack toàn thư viện hoặc một request mỗi activity.
