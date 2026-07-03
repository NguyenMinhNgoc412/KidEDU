# KidEDU SOT 06 — Local Data & Media Architecture

**Trạng thái:** SOT kỹ thuật chi tiết  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-07-01  
**Phạm vi:** Local database, file storage, media pipeline  
**Liên quan:** `02-kidedu-mobile-architecture-sot.md`, `05-tech-mobile-stack-sot.md`, `07-tech-performance-cache-memory-sot.md`

---

## 1. Nguyên tắc local-first

MVP lưu dữ liệu trên thiết bị.

Local data gồm:

- metadata thẻ học;
- metadata bộ học;
- progress;
- settings;
- metadata media;
- đường dẫn tới file media local hoặc bundled asset.

File media gồm:

- ảnh;
- ảnh động;
- video;
- audio;
- thumbnail;
- file tạm trong quá trình import.

---

## 2. Data ownership

| Data | Source of truth | Ghi chú |
|---|---|---|
| Learning item metadata | SQLite | Không lưu trong Zustand |
| Deck metadata | SQLite | Bao gồm thứ tự thẻ trong deck |
| Progress | SQLite | Ghi nhận cơ bản |
| Settings nhỏ | KV store hoặc SQLite | Tùy loại setting |
| Media metadata | SQLite | Trỏ tới file path/asset key |
| Media file | File system hoặc bundled asset | Không lưu binary trong DB |

---

## 3. Entity model đề xuất

### 3.1. `children`

Dùng cho hồ sơ trẻ. MVP có thể tạo một child mặc định.

| Field | Ý nghĩa |
|---|---|
| `id` | ID hồ sơ trẻ |
| `name` | Tên trẻ |
| `avatar_asset_id` | Ảnh đại diện nếu có |
| `created_at` | Ngày tạo |
| `updated_at` | Ngày cập nhật |

### 3.2. `categories`

Chủ đề học.

| Field | Ý nghĩa |
|---|---|
| `id` | ID category |
| `name` | Tên nhóm, ví dụ Gia đình |
| `sort_order` | Thứ tự hiển thị |
| `is_default` | Có phải nhóm mặc định hay không |

### 3.3. `learning_items`

Thẻ học.

| Field | Ý nghĩa |
|---|---|
| `id` | ID thẻ |
| `title` | Từ/cụm từ |
| `category_id` | Nhóm/chủ đề |
| `status` | active/hidden/archived |
| `learning_status` | new/practicing/familiar |
| `note` | Ghi chú phụ huynh |
| `created_at` | Ngày tạo |
| `updated_at` | Ngày cập nhật |

### 3.4. `learning_item_media`

Mapping media theo từng thẻ.

| Field | Ý nghĩa |
|---|---|
| `id` | ID mapping |
| `learning_item_id` | Thẻ học |
| `media_asset_id` | Media asset |
| `role` | illustration, mouth_video, pronunciation_audio, sfx |
| `priority` | custom ưu tiên hơn default |
| `is_active` | Có đang dùng hay không |
| `created_at` | Ngày tạo |

### 3.5. `media_assets`

Metadata file media.

| Field | Ý nghĩa |
|---|---|
| `id` | ID media |
| `type` | image, animated_image, video, audio, thumbnail |
| `source` | default, custom, generated |
| `uri` | Local file URI hoặc bundled asset key |
| `thumbnail_asset_id` | Thumbnail nếu có |
| `duration_ms` | Thời lượng nếu là video/audio |
| `size_bytes` | Dung lượng file nếu biết |
| `mime_type` | Loại file |
| `status` | active, missing, deleted, processing, failed |
| `created_at` | Ngày tạo |
| `updated_at` | Ngày cập nhật |

### 3.6. `decks`

Bộ học.

| Field | Ý nghĩa |
|---|---|
| `id` | ID bộ học |
| `title` | Tên bộ |
| `description` | Mô tả ngắn |
| `status` | active/hidden/archived |
| `created_at` | Ngày tạo |
| `updated_at` | Ngày cập nhật |

### 3.7. `deck_items`

Thứ tự thẻ trong bộ.

| Field | Ý nghĩa |
|---|---|
| `id` | ID dòng |
| `deck_id` | Bộ học |
| `learning_item_id` | Thẻ học |
| `sort_order` | Thứ tự phát |

### 3.8. `practice_sessions`

Phiên học.

| Field | Ý nghĩa |
|---|---|
| `id` | ID phiên |
| `child_id` | Hồ sơ trẻ |
| `mode` | single_item hoặc auto_play_deck |
| `deck_id` | Bộ học nếu có |
| `started_at` | Bắt đầu |
| `ended_at` | Kết thúc |
| `status` | completed/cancelled/interrupted |

### 3.9. `practice_events`

Event trong phiên học.

| Field | Ý nghĩa |
|---|---|
| `id` | ID event |
| `session_id` | Phiên học |
| `learning_item_id` | Thẻ |
| `event_type` | viewed, replayed, completed_item, skipped |
| `created_at` | Thời điểm |

### 3.10. `learning_progress`

Tổng hợp tiến độ theo trẻ và thẻ.

| Field | Ý nghĩa |
|---|---|
| `id` | ID progress |
| `child_id` | Hồ sơ trẻ |
| `learning_item_id` | Thẻ |
| `view_count` | Số lượt xem |
| `practice_count` | Số lượt luyện |
| `last_practiced_at` | Lần học gần nhất |
| `parent_mark` | new/practicing/familiar |

---

## 4. Media role và fallback

Một thẻ có thể có nhiều media asset với các role:

| Role | Mục đích |
|---|---|
| `illustration` | Ảnh/ảnh động minh họa |
| `mouth_video` | Video/animation khẩu hình |
| `pronunciation_audio` | Âm phát âm mẫu |
| `sfx` | Âm thanh minh họa hoặc phản hồi ngắn |

Fallback rule:

```text
custom active media
  -> default active media
  -> missing state
```

Service resolve media phải trả về:

- media dùng cho màn học;
- thông tin media thiếu;
- cảnh báo nếu có file custom hỏng/missing;
- fallback đã dùng nếu có.

---

## 5. File storage structure đề xuất

```text
app-storage/
  media/
    images/
      custom/
      generated/
    videos/
      custom/
      generated/
    audio/
      custom/
      generated/
    thumbnails/
  temp/
    imports/
    camera/
  exports/
```

Quy tắc:

- File tạm nằm trong `temp`.
- File đã lưu bền vững nằm trong `media`.
- Thumbnail nằm riêng trong `thumbnails`.
- Khi một media bị xóa, DB cập nhật trước rồi cleanup file an toàn sau.
- Không dùng tên file gốc làm ID duy nhất; dùng generated ID.

---

## 6. Media import pipeline

Luồng import ảnh/video/audio:

```text
User chọn/quay file
  -> Validate loại file
  -> Validate size/duration nếu biết
  -> Copy vào temp
  -> Preview
  -> Xử lý nếu cần: resize ảnh, tạo thumbnail, nén video nếu bật
  -> Copy/move vào durable storage
  -> Tạo media_assets record
  -> Gắn media vào learning item
  -> Cleanup temp
```

Nếu lỗi ở bất kỳ bước nào:

- không tạo mapping hỏng;
- không thay thế media cũ;
- cleanup temp nếu có thể;
- trả lỗi dễ hiểu cho khu phụ huynh.

---

## 7. Video import rule MVP

MVP ưu tiên giới hạn video thay vì nén phức tạp.

Rule đề xuất:

- video nên ngắn;
- cảnh báo nếu video quá dài;
- không tự import video quá lớn nếu có nguy cơ ảnh hưởng app;
- tạo thumbnail cho video;
- chỉ dùng bản video đã lưu trong app storage, không phụ thuộc file gốc trong thư viện máy.

Video compression có thể để Phase 2 nếu thực tế phát sinh vấn đề storage/performance.

---

## 8. Repository boundaries

Repository chịu trách nhiệm:

- CRUD entity;
- transaction khi một hành động cần ghi nhiều bảng;
- mapping DB row sang domain model;
- không chứa UI logic;
- không trực tiếp render hoặc playback media.

Repository đề xuất:

| Repository | Trách nhiệm |
|---|---|
| `learningItemRepository` | CRUD thẻ học |
| `deckRepository` | CRUD bộ học và thứ tự thẻ |
| `mediaAssetRepository` | CRUD media metadata |
| `progressRepository` | Practice session/event/progress |
| `categoryRepository` | Chủ đề học |
| `settingsRepository` | Settings bền vững |

---

## 9. Transaction bắt buộc

Các hành động sau nên dùng transaction:

1. Tạo thẻ + gắn media ban đầu.
2. Thay media cho thẻ.
3. Xóa thẻ + gỡ khỏi deck + cập nhật media mapping.
4. Tạo deck + thêm nhiều thẻ.
5. Reorder deck items.
6. Kết thúc session + ghi progress summary.

---

## 10. Data migration

MVP vẫn cần migration cơ bản:

- có bảng schema version;
- migration chạy khi app mở;
- migration idempotent nếu có thể;
- không xóa dữ liệu user nếu chưa có backup/migration rõ.

---

## 11. Seed data

MVP nên có seed data cho bộ học mẫu:

- Gia đình;
- Nhu cầu cơ bản;
- Đồ vật quen thuộc;
- Con vật;
- Hành động.

Seed data phải tránh ghi đè nội dung phụ huynh đã sửa.

---

## 12. Orphan file cleanup

Cần có service cleanup:

- xóa temp file cũ;
- tìm media file không còn record active;
- đánh dấu record missing nếu file không còn tồn tại;
- không xóa file đang được dùng bởi media active.

Cleanup không chạy trong lúc trẻ đang học/autoplay.
