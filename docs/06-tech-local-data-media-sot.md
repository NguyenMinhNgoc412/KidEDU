# KidEDU SOT 06 — Local Data & Media Architecture

**Trạng thái:** SOT kỹ thuật chi tiết  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-08-06
**Phạm vi:** Local database, file storage, media pipeline, backup/restore và privacy data controls local  
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

| Data                   | Source of truth                | Ghi chú                       |
| ---------------------- | ------------------------------ | ----------------------------- |
| Learning item metadata | SQLite                         | Không lưu trong Zustand       |
| Deck metadata          | SQLite                         | Bao gồm thứ tự thẻ trong deck |
| Progress               | SQLite                         | Ghi nhận cơ bản               |
| Settings nhỏ           | KV store hoặc SQLite           | Tùy loại setting              |
| Media metadata         | SQLite                         | Trỏ tới file path/asset key   |
| Media file             | File system hoặc bundled asset | Không lưu binary trong DB     |
| Privacy data summary   | Derived query từ SQLite        | Không tạo bảng/bản sao riêng  |

---

## 3. Entity model đề xuất

### 3.1. `children`

Dùng cho hồ sơ trẻ. MVP có thể tạo một child mặc định.

| Field             | Ý nghĩa                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `id`              | ID hồ sơ trẻ                                                         |
| `name`            | Tên trẻ                                                              |
| `avatar_asset_id` | Ảnh đại diện nếu có                                                  |
| `age_years`       | Tuổi nguyên không âm; nullable, thiếu tuổi thì mini test dùng 2 hình |
| `created_at`      | Ngày tạo                                                             |
| `updated_at`      | Ngày cập nhật                                                        |

### 3.2. `categories`

Chủ đề học.

| Field        | Ý nghĩa                         |
| ------------ | ------------------------------- |
| `id`         | ID category                     |
| `name`       | Tên nhóm, ví dụ Gia đình        |
| `sort_order` | Thứ tự hiển thị                 |
| `is_default` | Có phải nhóm mặc định hay không |

### 3.3. `learning_items`

Thẻ học.

| Field             | Ý nghĩa                 |
| ----------------- | ----------------------- |
| `id`              | ID thẻ                  |
| `title`           | Từ/cụm từ               |
| `category_id`     | Nhóm/chủ đề             |
| `status`          | active/hidden/archived  |
| `learning_status` | new/practicing/familiar |
| `note`            | Ghi chú phụ huynh       |
| `created_at`      | Ngày tạo                |
| `updated_at`      | Ngày cập nhật           |

### 3.4. `learning_item_media`

Mapping media theo từng thẻ.

| Field                 | Ý nghĩa                                                |
| --------------------- | ------------------------------------------------------ |
| `id`                  | ID mapping                                             |
| `learning_item_id`    | Thẻ học                                                |
| `media_asset_id`      | Media asset                                            |
| `role`                | illustration, mouth_video, pronunciation_audio, sfx    |
| `priority`            | custom ưu tiên hơn default                             |
| `is_active`           | Có đang dùng hay không                                 |
| `puzzle_template_key` | Mẫu cắt ghép hình tùy chọn; null dùng fallback an toàn |
| `created_at`          | Ngày tạo                                               |

### 3.5. `media_assets`

Metadata file media.

| Field                | Ý nghĩa                                        |
| -------------------- | ---------------------------------------------- |
| `id`                 | ID media                                       |
| `type`               | image, animated_image, video, audio, thumbnail |
| `source`             | default, custom, generated                     |
| `uri`                | Local file URI hoặc bundled asset key          |
| `thumbnail_asset_id` | Thumbnail nếu có                               |
| `duration_ms`        | Thời lượng nếu là video/audio                  |
| `size_bytes`         | Dung lượng file nếu biết                       |
| `mime_type`          | Loại file                                      |
| `status`             | active, missing, deleted, processing, failed   |
| `created_at`         | Ngày tạo                                       |
| `updated_at`         | Ngày cập nhật                                  |

### 3.6. `decks`

Bộ học.

| Field         | Ý nghĩa                |
| ------------- | ---------------------- |
| `id`          | ID bộ học              |
| `title`       | Tên bộ                 |
| `description` | Mô tả ngắn             |
| `status`      | active/hidden/archived |
| `created_at`  | Ngày tạo               |
| `updated_at`  | Ngày cập nhật          |

### 3.7. `deck_items`

Thứ tự thẻ trong bộ.

| Field              | Ý nghĩa     |
| ------------------ | ----------- |
| `id`               | ID dòng     |
| `deck_id`          | Bộ học      |
| `learning_item_id` | Thẻ học     |
| `sort_order`       | Thứ tự phát |

### 3.8. `practice_sessions`

Phiên học.

| Field        | Ý nghĩa                                                              |
| ------------ | -------------------------------------------------------------------- |
| `id`         | ID phiên                                                             |
| `child_id`   | Hồ sơ trẻ                                                            |
| `mode`       | single_item, auto_play_deck, mini_test, puzzle_game hoặc memory_game |
| `deck_id`    | Bộ học nếu có                                                        |
| `started_at` | Bắt đầu                                                              |
| `ended_at`   | Kết thúc                                                             |
| `status`     | completed/cancelled/interrupted                                      |

### 3.9. `practice_events`

Event trong phiên học.

| Field              | Ý nghĩa                                   |
| ------------------ | ----------------------------------------- |
| `id`               | ID event                                  |
| `session_id`       | Phiên học                                 |
| `learning_item_id` | Thẻ                                       |
| `event_type`       | viewed, replayed, completed_item, skipped |
| `created_at`       | Thời điểm                                 |

Mini test không ghi event cho đáp án, số lần sai hoặc phát lại. Trạng thái “đã làm mini test” của một bộ được suy ra từ `practice_sessions` có `mode = mini_test`, đúng `child_id`/`deck_id` và `status = completed`; phiên đóng giữa lượt là `cancelled` và không tính đã làm.

### 3.10. `learning_progress`

Tổng hợp tiến độ theo trẻ và thẻ.

| Field               | Ý nghĩa                 |
| ------------------- | ----------------------- |
| `id`                | ID progress             |
| `child_id`          | Hồ sơ trẻ               |
| `learning_item_id`  | Thẻ                     |
| `view_count`        | Số lượt xem             |
| `practice_count`    | Số lượt luyện           |
| `last_practiced_at` | Lần học gần nhất        |
| `parent_mark`       | new/practicing/familiar |

---

## 4. Media role và fallback

Một thẻ có thể có nhiều media asset với các role:

| Role                  | Mục đích                             |
| --------------------- | ------------------------------------ |
| `illustration`        | Ảnh/ảnh động minh họa                |
| `mouth_video`         | Video/animation khẩu hình            |
| `pronunciation_audio` | Âm phát âm mẫu                       |
| `sfx`                 | Âm thanh minh họa hoặc phản hồi ngắn |

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

Review resolver chỉ dùng audio/hình local đã resolve. Từ mục tiêu mini test cần cả `pronunciation_audio` và `illustration`; hình nhiễu có thể lấy từ learning item khác ngoài bộ nhưng phải là ảnh local hợp lệ, khác đáp án và không trùng trong câu. Ghép hình đọc `puzzle_template_key` của illustration đang được resolve; nếu thiếu hoặc không hợp lệ thì dùng template an toàn mặc định cho số mảnh hiện tại.

### 4.1. Migration cho review activities

Trước khi implement đặc tả `10`/`11`, schema cần migration forward-only bổ sung `children.age_years` nullable và `learning_item_media.puzzle_template_key` nullable. Không tạo bảng mới: hai cột nằm trong các bảng đã thuộc snapshot 11 bảng, vì vậy backup manifest/validator phải được version hóa để chấp nhận dữ liệu mới và vẫn xử lý backup cũ thiếu hai field bằng giá trị `null`.

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
    restores/
  temp/
    imports/
    camera/

app-cache/
  kidedu/
    backups/
```

Quy tắc:

- File tạm nằm trong `temp`.
- File đã lưu bền vững nằm trong `media`.
- Thumbnail nằm riêng trong `thumbnails`.
- Backup đang tạo, tệp export hoàn tất chờ share sheet và bản copy từ document picker nằm trong `app-cache/kidedu/backups` hoặc cache do picker quản lý; media restore đã kiểm tra được ghi vào `media/restores/<operation-id>` trước khi DB commit.
- Khi một media bị xóa, DB cập nhật trước rồi cleanup file an toàn sau.
- Không dùng tên file gốc làm ID duy nhất; dùng generated ID.

### 5.1. Media học mặc định bundled

Trong MVP, video học mặc định cốt lõi phải được đóng gói bằng static asset của app và resolve
thành URI local trước khi phát. Không lưu hoặc phát trực tiếp URL `http://`/`https://` trong
Learning hay Auto Play.

Mỗi video khẩu hình bundled bắt buộc:

- MP4 H.264, tối thiểu HD 1280 × 720 và tối đa 15 giây;
- có thumbnail JPEG/WebP riêng; list chỉ render thumbnail;
- có asset key versioned, `duration_ms`, `size_bytes` và metadata resolution;
- thuộc một seed item hợp lệ và dùng `require(...)` tĩnh để Metro đưa file vào build;
- qua default-media preflight trước production build.

Fresh install phải phát được bộ video bundled khi thiết bị ở chế độ máy bay. Nếu file không
resolve được, UI fallback về missing state an toàn thay vì thử URL remote hoặc crash.

Sau MVP có thể dùng CDN cho nội dung mở rộng, nhưng app phải tải, kiểm tra version, size và
checksum vào durable local storage trước khi cho học. Auto Play không stream video remote.

---

## 6. Media import pipeline

Luồng import ảnh/video/audio:

```text
User chọn/quay file
  -> Validate loại file
  -> Validate size/duration/resolution nếu biết
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
- video cá nhân hóa phải có cạnh dài tối thiểu 1280 px và cạnh ngắn tối thiểu 720 px, áp dụng cho cả video ngang và dọc;
- luồng quay yêu cầu chất lượng cao nhất thiết bị hỗ trợ; video chọn từ thư viện dùng passthrough, không hạ độ phân giải;
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

| Repository               | Trách nhiệm                     |
| ------------------------ | ------------------------------- |
| `learningItemRepository` | CRUD thẻ học                    |
| `deckRepository`         | CRUD bộ học và thứ tự thẻ       |
| `mediaAssetRepository`   | CRUD media metadata             |
| `progressRepository`     | Practice session/event/progress |
| `categoryRepository`     | Chủ đề học                      |
| `settingsRepository`     | Settings bền vững               |

---

## 9. Transaction bắt buộc

Các hành động sau nên dùng transaction:

1. Tạo thẻ + gắn media ban đầu.
2. Thay media cho thẻ.
3. Xóa thẻ + gỡ khỏi deck + cập nhật media mapping.
4. Tạo deck + thêm nhiều thẻ.
5. Reorder deck items.
6. Kết thúc session + ghi progress summary.
7. Replace-all logical data khi restore một bản sao lưu đã được kiểm tra.
8. Xóa toàn bộ lịch sử học và reset trạng thái tiến độ.
9. Gỡ toàn bộ media custom/generated cùng mapping/avatar liên quan.
10. Reset toàn bộ dữ liệu và reseed nội dung mặc định.

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

---

## 13. Backup & restore local P1

### 13.1. Định dạng `.kidedu`

Tệp backup là custom binary container `.kidedu` v1, không phải ZIP, và được đọc/ghi theo chunk 512 KB. Thứ tự byte cố định:

```text
fixed header
  -> raw payloads liền nhau
  -> JSON manifest
  -> fixed footer
```

- Header nhận diện định dạng và format version.
- Raw payload chỉ gồm binary media custom/generated đang được tham chiếu; logical snapshot của 11 bảng nằm trong JSON manifest.
- Manifest chứa logical snapshot, schema version nguồn, thời điểm tạo, thống kê dữ liệu và relative logical path + offset + size + CRC32 của từng media payload.
- Footer chứa manifest offset, manifest length và CRC32 để tìm và kiểm tra manifest mà không cần load toàn bộ tệp.

CRC32 dùng để phát hiện tệp bị thiếu/hỏng trong quá trình lưu hoặc chuyển, không phải mã hóa, chữ ký số hoặc cơ chế chống sửa có chủ đích.

Không copy file SQLite thô và không đưa bảng `schema_versions` vào snapshot. Version schema nguồn chỉ là metadata để app đích quyết định khả năng tương thích; migration của database đích vẫn do app đích quản lý.

### 13.2. Logical snapshot

Snapshot gồm đúng 11 bảng dữ liệu hiện tại:

1. `children`;
2. `categories`;
3. `learning_items`;
4. `media_assets`;
5. `learning_item_media`;
6. `decks`;
7. `deck_items`;
8. `practice_sessions`;
9. `practice_events`;
10. `learning_progress`;
11. `settings`.

Snapshot phải giữ ID và quan hệ khóa ngoại. Bundled default asset vẫn dùng asset key; binary đã đóng gói trong app không được copy lại vào backup. Media custom/generated dùng entry path tương đối trong container thay cho URI tuyệt đối của thiết bị nguồn.

### 13.3. Quy tắc đường dẫn và tính toàn vẹn

- Không ghi `file://` URI tuyệt đối từ thiết bị nguồn vào media entry của backup.
- Entry path phải là đường dẫn tương đối đã chuẩn hóa; từ chối path tuyệt đối hoặc path có traversal như `..`.
- Manifest ghi offset, kích thước và CRC32 để app kiểm tra trước restore.
- Từ chối entry trùng path, range chồng lấn/vượt giới hạn tệp, sai kích thước, sai CRC32 hoặc version không tương thích trước khi thay đổi DB.
- Khi restore, mỗi media được copy sang durable storage bằng tên generated mới; `media_assets.uri` được rewrite sang URI local mới.
- Document picker phải dùng `copyToCacheDirectory: true`; chỉ mở bản cache bằng `FileHandle`, không đọc trực tiếp Android `content://`.

### 13.4. Export pipeline

```text
Đọc logical rows theo thứ tự ổn định
  -> Ghi fixed header vào file backup trong app cache
  -> Stream từng payload bằng chunk 512 KB và tính CRC32
  -> Ghi JSON manifest
  -> Ghi fixed footer với manifest offset/length/CRC32
  -> Flush/đóng và hoàn tất container .kidedu
  -> Kiểm tra lại container đã ghi
  -> Giữ tệp hoàn tất trong app cache để mở share sheet theo thao tác của phụ huynh
```

Nếu export lỗi hoặc bị hủy, xóa tệp chưa hoàn tất và không đưa nó vào danh sách có thể chia sẻ.

### 13.5. Restore pipeline và rollback

```text
Chọn tệp .kidedu
  -> Copy vào staging
  -> Validate header/footer/version/manifest/path/range/size/CRC32
  -> Parse logical snapshot và kiểm tra quan hệ
  -> Hiển thị preview
  -> Parent xác nhận replace-all
  -> Copy media mới vào durable storage
  -> Rewrite media URI
  -> Replace 11 bảng trong một DB transaction
  -> Commit
  -> Invalidate query cache và cleanup media cũ/staging
```

Quy tắc an toàn:

1. Không mutation DB trước khi phụ huynh xác nhận.
2. Không bắt đầu transaction trước khi toàn bộ tệp và media cần restore đã qua kiểm tra.
3. Mọi thao tác xóa/insert của 11 bảng phải nằm trong cùng một transaction và theo thứ tự tôn trọng khóa ngoại.
4. Nếu copy media hoặc DB transaction lỗi, rollback DB, xóa media mới chưa được tham chiếu và giữ nguyên media/dữ liệu cũ.
5. Chỉ cleanup media cũ sau khi transaction commit; cleanup lỗi được xử lý như orphan cleanup, không làm mất bản restore đã commit.
6. Luôn cleanup bản cache của picker, container export và staging sau thành công, lỗi, hủy hoặc khi rời màn hình nếu có thể.

Backup/restore không chạy đồng thời với phiên học hoặc Auto Play và không phụ thuộc backend/cloud.

---

## 14. Privacy & Data Controls P1

### 14.1. Tổng quan dữ liệu

Repository cung cấp derived summary, tối thiểu gồm:

- số `learning_items`;
- số `decks`;
- số `practice_sessions`, `practice_events` và `learning_progress`;
- số `media_assets` có `source IN ('custom', 'generated')`;
- tổng `size_bytes` đã biết của nhóm media đó.

Summary chỉ đọc metadata; không scan, decode hoặc load binary media vào JS memory. Dung lượng là giá trị đã ghi nhận, có thể thấp hơn kích thước thực nếu asset cũ thiếu `size_bytes`.

### 14.2. Xóa lịch sử học

Trong một write transaction và qua cùng write queue của repository:

```text
DELETE practice_events
  -> DELETE learning_progress
  -> DELETE practice_sessions
  -> UPDATE learning_items SET learning_status = 'new'
```

Không thay đổi category, thẻ, deck, media hoặc settings.

### 14.3. Xóa media cá nhân hóa

Trong một write transaction:

1. Thu thập URI `file://` của mọi asset `custom/generated`, bao gồm thumbnail.
2. Gỡ `children.avatar_asset_id` nếu trỏ tới asset sẽ xóa.
3. Xóa `learning_item_media` trỏ tới asset custom/generated.
4. Gỡ quan hệ thumbnail giữa các asset cần xóa theo thứ tự an toàn khóa ngoại.
5. Xóa metadata asset custom/generated; không xóa asset `default`.
6. Chạy kiểm tra khóa ngoại trước commit nếu runtime hỗ trợ.
7. Sau commit mới cleanup các URI đã thu thập và thư mục media cá nhân hóa theo best-effort.

Thẻ và deck không bị xóa. Media resolver tự quay về asset default hoặc missing state.

### 14.4. Reset toàn bộ dữ liệu app

Reset dùng một transaction duy nhất:

```text
Thu thập URI custom/generated hiện tại
  -> Xóa 11 bảng dữ liệu theo thứ tự FK
  -> Reseed child/category/item/default media/deck/settings hiện hành
  -> Dùng canonical default learning settings, không giữ setting cũ
  -> PRAGMA foreign_key_check
  -> Commit
  -> Cleanup file media/cache cá nhân hóa best-effort
```

Không xóa `schema_versions`, không hạ schema version và không đóng/mở lại SQLite giữa transaction. Helper seed dùng cho reset phải tái sử dụng cùng định nghĩa seed hiện hành nhưng cho phép ép canonical settings; không được tạo nested transaction.

Reset chỉ xóa dữ liệu trong vùng app quản lý. Tệp backup đã được phụ huynh lưu qua share sheet ra ngoài app và permission của hệ điều hành nằm ngoài transaction này.

### 14.5. An toàn mutation và cache

- Một thời điểm chỉ chạy một privacy mutation; không chạy khi Learning/Auto Play đang active.
- Nếu DB transaction lỗi, rollback và không cleanup URI cũ.
- Cleanup URI cụ thể chỉ chạy sau commit; lỗi cleanup không được phục hồi mapping đã xóa.
- Trước khi repository được expose cho UI ở lần mở app tiếp theo, app quét các thư mục custom/generated/thumbnail/restore/cache do KidEDU quản lý và xóa file không còn active DB reference. Việc này phục hồi trường hợp process dừng sau DB commit nhưng trước cleanup.
- Sweep không đọc hoặc xóa shared storage ngoài vùng app và phải bảo vệ cả avatar cùng thumbnail avatar đang được tham chiếu.
- Sau thành công, reset/invalidate toàn bộ TanStack Query cache liên quan.
- Sau reset-all, xóa UI/session state ngắn hạn, khóa Parent Gate và điều hướng về Child Mode.
- Permission snapshot là dữ liệu runtime đọc từ hệ điều hành, không persist vào SQLite hoặc backup.
