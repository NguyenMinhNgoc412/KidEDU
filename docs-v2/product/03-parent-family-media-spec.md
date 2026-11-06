# Parent & Family Media Specification

> C50 target update 2026-11-05 — PRD-CUSTOM-001/006 và PRD-SUB-006: paid thêm bộ thủ công/AI; family-media override hiện có là capability riêng, không được vô tình khóa vì free không tạo bộ mới. Family media không gửi AI mặc định; stage/validate/preview/atomic commit vẫn bắt buộc.

| Thuộc tính | Giá trị                                         |
| ---------- | ----------------------------------------------- |
| Trạng thái | `In review`                                     |
| Owner      | Product + Mobile + Backend                      |
| Implements | `PRD-MEDIA-*`, `PRD-ACC-002..005`, `PRD-PRIV-*` |
| Cập nhật   | 2026-11-05                                      |

## 1. Mục tiêu

Cho phép phụ huynh cá nhân hóa target bằng người/vật quen thuộc mà vẫn giữ chất lượng, quyền riêng tư, fallback và data ownership. Family media là dữ liệu người dùng, không phải premium content.

## 2. Media roles

| Role                  | Loại                  | Dùng cho                         |
| --------------------- | --------------------- | -------------------------------- |
| `semantic_visual`     | image/short animation | hiểu nghĩa, nhận biết, gọi tên   |
| `mouth_video`         | video                 | model khẩu hình                  |
| `pronunciation_audio` | audio                 | giọng người thân/canonical model |
| `context_visual`      | image/animation       | câu, hỏi đáp, hành động/ngữ cảnh |
| `sfx`                 | audio                 | minh họa nhẹ, luôn optional      |

Family media override theo `(child, target/activity, role)`. Không có một media tổng quát thay mọi role.

## 3. Priority resolver

```text
valid family override for current child/activity
→ approved default asset
→ authored fallback for activity
→ not_ready
```

Resolver luôn kiểm tra file existence, media type, binding version, entitlement của default asset và activity readiness. Xóa override phải quay về default atomically.

## 4. Capture/import flow

1. Parent qua Parent Gate và chọn role.
2. App giải thích mục đích/quyền cần dùng.
3. Request permission đúng thời điểm.
4. Capture hoặc picker trả file vào staging.
5. Validate type, size, duration, readability và free storage.
6. Normalize/thumbnail nếu cần.
7. Preview; media cũ vẫn active.
8. Parent xác nhận lưu.
9. Transaction commit metadata + durable file; sau đó cleanup bản cũ/orphan.
10. Nếu cloud backup bật, tạo upload job riêng; local save không chờ upload.

Cancel/crash trước commit phải xóa staging khi an toàn và không thay media active.

## 5. Validation baseline

- image: JPEG/PNG/WebP đọc được, một chủ thể rõ; kích thước/dung lượng budget do media spec đo;
- mouth video: tối đa khoảng 15 giây ở UI hiện tại, rõ vùng miệng, audio không méo; con số cuối qua usability/storage review;
- pronunciation audio: ngắn, có tiếng người rõ, không nhạc nền;
- không tin MIME/extension từ picker; server validate lại file upload;
- metadata EXIF không cần thiết phải được strip trước cloud upload;
- thumbnail/derived file không thay original ownership.

## 6. Local và cloud

- Local family media thuộc account/child namespace và được mã hóa bằng user-data key.
- Mặc định lưu local để dùng ngay; cloud backup là capability có consent/quota.
- Cloud object private, key không chứa tên trẻ/filename gốc.
- Upload dùng server-issued resumable/signed authorization; server finalize sau checksum/ownership validation.
- Hết subscription: không upload mới; local media vẫn dùng/xuất/xóa được; cloud retention theo policy đã công bố.

## 7. Privacy

Family media không được:

- đưa vào analytics, crash attachment hoặc log;
- dùng huấn luyện AI hay cải thiện model nếu chưa có consent hoàn toàn riêng;
- chia sẻ với content editor/support theo mặc định;
- đưa vào default content pack;
- hiển thị sau account switch.

Parent xem inventory, dung lượng local/cloud, trạng thái sync, export và delete. Account deletion phải xóa object, derived asset, metadata và backup theo retention/legal policy.

## 8. Reuse code/UI

Giữ foundation hiện có: permission-in-context, staging/preview, `PersonalizedMediaSection`, media import validation, resolver, durable storage và orphan cleanup. Refactor bắt buộc:

- binding từ `LearningItem` sang target/activity/child;
- thêm account namespace và encryption;
- tách local-save khỏi cloud-upload;
- thêm inventory/quota/sync state;
- không dùng trạng thái `custom/default` làm readiness duy nhất.

## 9. Failure cases

| Case                  | Expected                                                              |
| --------------------- | --------------------------------------------------------------------- |
| permission denied     | giải thích, mở Settings khi parent chủ động; không lặp prompt         |
| low storage           | không commit file; giữ media cũ                                       |
| upload timeout        | local vẫn usable; retry có backoff                                    |
| cloud quota exceeded  | dừng upload mới, không xóa local                                      |
| default retired       | override vẫn usable nếu binding hợp lệ; fallback version được migrate |
| account logout/switch | đóng player, clear decrypted handle, isolate namespace                |
| delete đang playback  | stop/close resource rồi commit delete an toàn                         |

## 10. Acceptance

Test import/capture/cancel/replace/delete/fallback, process kill tại mỗi bước, low storage, invalid file, account switch, entitlement expiry và cloud retry. Không có network request khi phát lại local family media đã commit.

## 11. Open items

- `MEDIA-TBD-01`: size/duration/resolution budget theo corpus/device;
- `MEDIA-TBD-02`: cloud quota/retention theo subscription;
- `MEDIA-TBD-03`: user-key recovery khi đổi thiết bị;
- `MEDIA-TBD-04`: family media có sync đa thiết bị trong v1 hay chỉ backup/restore.
