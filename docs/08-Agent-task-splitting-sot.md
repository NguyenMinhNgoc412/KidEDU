# KidEDU SOT 08 — Codex Task Splitting Guide

**Trạng thái:** Hướng dẫn chia task implement  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-07-21  
**Phạm vi:** Mobile app MVP / Phase 0–1

---

## 1. Quy tắc chung khi giao Codex

Mỗi task Codex phải:

1. Đọc `README.md` trước.
2. Đọc `01-kidedu-business-sot.md` để hiểu nghiệp vụ.
3. Đọc `02-kidedu-mobile-architecture-sot.md` để hiểu kiến trúc tổng quan.
4. Đọc file chi tiết liên quan tới task.
5. Không tự thêm feature mới.
6. Nếu cần thay đổi SOT, ghi rõ file nào cần sửa và lý do.
7. Kết thúc task phải có checklist test hoặc cách verify.

Nếu task có giao diện/UI/UX, Codex phải làm thêm:

8. Đọc `09-design-system-sot.md` trước khi code UI.
9. Mở ảnh reference liên quan trong `screenshots/`.
10. Ghi rõ ảnh nào đã dùng làm reference trong báo cáo hoàn thành.
11. Verify UI bằng screenshot hoặc manual visual check nếu môi trường cho phép.

Mapping ảnh reference:

| Màn hình/chức năng                             | Ảnh cần mở                              |
| ---------------------------------------------- | --------------------------------------- |
| Child home / chọn nhóm                         | `screenshots/01-home-childmode.JPG`     |
| Child word list / danh sách từ cho trẻ         | `screenshots/02-Child-Word-List.JPG`    |
| Child study / màn học từng thẻ / autoplay card | `screenshots/03-child-study-screen.JPG` |
| Parent create item / media upload              | `screenshots/04-media-upload.JPG`       |
| Parent word list / quản lý từ                  | `screenshots/05-parent-word-list.JPG`   |

---

## 2. Task size guideline

Một task tốt nên:

- có phạm vi nhỏ;
- tạo được output test được;
- không đụng quá nhiều module cùng lúc;
- không gom UI + DB + media + autoplay trong một task quá lớn;
- có acceptance criteria rõ.

---

## 3. Thứ tự implement đề xuất

### T-000 — Project setup

Đọc:

- `02-kidedu-mobile-architecture-sot.md`
- `05-tech-mobile-stack-sot.md`

Output:

- Expo React Native TypeScript project.
- Routing skeleton.
- Lint/format/test setup.
- Basic app shell.

Không làm:

- business feature đầy đủ;
- media upload;
- backend.

---

### T-001 — App shell & navigation zones

Đọc:

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `04-business-parent-content-management-sot.md`
- `09-design-system-sot.md`
- `screenshots/01-home-childmode.JPG`

Output:

- Child zone routes.
- Parent zone routes.
- Parent Gate screen skeleton.
- Navigation không lẫn thao tác quản lý vào màn trẻ.

Acceptance:

- Mở app vào child experience.
- Vào parent area phải qua Parent Gate.
- Child home bám visual reference Gentle Growth.

---

### T-002 — Local database schema & repositories

Đọc:

- `06-tech-local-data-media-sot.md`

Output:

- Schema migration ban đầu.
- Repository cơ bản cho category, item, deck, media, progress, settings.
- Seed data mẫu.

Acceptance:

- App tạo DB được.
- Seed data không ghi đè dữ liệu user.
- CRUD repository có unit test.

---

### T-003 — Learning item display

Đọc:

- `01-kidedu-business-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `09-design-system-sot.md`
- `screenshots/02-Child-Word-List.JPG`
- `screenshots/03-child-study-screen.JPG`

Output:

- Màn học từng thẻ.
- Media resolver dùng custom trước, default sau.
- Phát ảnh/video/audio ở mức cơ bản.

Acceptance:

- Trẻ xem được một thẻ.
- Phát lại được.
- Không crash khi thiếu một media.
- Màn học và danh sách từ bám reference Child Mode.

---

### T-004 — Parent item management

Đọc:

- `04-business-parent-content-management-sot.md`
- `06-tech-local-data-media-sot.md`
- `09-design-system-sot.md`
- `screenshots/04-media-upload.JPG`
- `screenshots/05-parent-word-list.JPG`

Output:

- Danh sách thẻ.
- Tạo/sửa/xóa/tạm ẩn thẻ.
- Status “cần bổ sung”.

Acceptance:

- Phụ huynh tạo thẻ mới được.
- Thẻ xuất hiện ở danh sách học.
- Xóa/tạm ẩn hoạt động đúng.
- Form thêm thẻ và danh sách từ bám reference Parent Zone.

---

### T-005 — Deck management

Đọc:

- `01-kidedu-business-sot.md`
- `04-business-parent-content-management-sot.md`
- `06-tech-local-data-media-sot.md`
- `09-design-system-sot.md`
- `screenshots/05-parent-word-list.JPG`

Output:

- Danh sách bộ học.
- Tạo/sửa/xóa bộ học.
- Thêm/xóa/sắp xếp thẻ trong bộ.

Acceptance:

- Bộ học có thứ tự thẻ ổn định.
- Bộ rỗng không bắt đầu Auto Play.
- Xóa bộ không xóa thẻ gốc.
- UI quản lý bộ học giữ cùng visual DNA với Parent Zone.

---

### T-006 — Auto Play Deck MVP

Đọc:

- `03-business-auto-play-deck-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `09-design-system-sot.md`
- `screenshots/03-child-study-screen.JPG`

Output:

- Màn Auto Play.
- Timeline phát từng thẻ.
- Pause/resume/replay/exit.
- Preset tốc độ.
- Ghi progress event cơ bản.

Acceptance:

- App tự phát lần lượt các thẻ.
- Có khoảng dừng cho trẻ nói theo.
- Không cần trẻ bấm để chuyển bài.
- Cleanup timer/player đúng khi thoát.
- Màn Auto Play giữ single-focus layout như Child study reference.

---

### T-007 — Media personalization pipeline

Đọc:

- `04-business-parent-content-management-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `09-design-system-sot.md`
- `screenshots/04-media-upload.JPG`

Output:

- Chọn/quay media cơ bản.
- Preview.
- Validate.
- Save vào app storage.
- Gắn media custom vào thẻ.
- Xóa media custom để fallback default.

Acceptance:

- Thẻ ưu tiên dùng media custom sau khi lưu.
- Xóa custom quay về default nếu có.
- Không lưu base64 vào state/DB.
- Temp file được cleanup.
- Media uploader dùng drop-zone/rounded style theo design system.

---

### T-008 — Progress MVP

Đọc:

- `01-kidedu-business-sot.md`
- `03-business-auto-play-deck-sot.md`
- `06-tech-local-data-media-sot.md`

Output:

- Ghi lượt học thẻ.
- Ghi phiên Auto Play.
- Hiển thị progress cơ bản ở khu phụ huynh.
- Cho phụ huynh đánh dấu trạng thái.

Acceptance:

- Progress cập nhật sau phiên học.
- Không có scoring tự động.
- Không ghi trùng quá nhiều event.

---

### T-009 — Performance & memory pass

Đọc:

- `07-tech-performance-cache-memory-sot.md`

Output:

- Review list/media/autoplay.
- Đảm bảo chỉ một video active.
- Thumbnail-only list.
- Cleanup player/timer/listener.
- Background pause behavior.

Acceptance:

- Không render video trong list.
- Auto Play không preload toàn bộ deck.
- App không crash khi file missing.
- Manual test trên thiết bị Android thật nếu có.

---

### T-010 — E2E flows

Đọc:

- `05-tech-mobile-stack-sot.md`
- `08-codex-task-splitting-sot.md`

Output:

- E2E flow: mở app, vào parent area, tạo thẻ, tạo deck, chạy Auto Play.
- E2E flow: thay media custom và học thẻ đó.

Acceptance:

- Flow chạy được ở local emulator/device.
- Test không phụ thuộc dữ liệu user thật.

---

### T-011 — Design system alignment pass

Đọc:

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `04-business-parent-content-management-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `09-design-system-sot.md`
- Toàn bộ ảnh trong `screenshots/`

Output:

- Cập nhật theme tokens theo Gentle Growth.
- Child home bám `01-home-childmode`.
- Child word list bám `02-Child-Word-List`.
- Child study/autoplay bám `03-child-study-screen`.
- Parent create item/media upload bám `04-media-upload`.
- Parent word list bám `05-parent-word-list`.
- Component dùng radius, spacing, typography, màu và icon style thống nhất.

Acceptance:

- Không làm thay đổi nghiệp vụ hoặc architecture.
- Không thêm backend/cloud/login/AI scoring.
- UI phân biệt rõ Child Mode và Parent Zone nhưng cùng visual DNA.
- Không render video/audio trong list.
- Text không tràn trên mobile.
- Có screenshot/manual visual check sau khi sửa.

---

### T-012 — Local backup & restore P1

Đọc:

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `04-business-parent-content-management-sot.md`
- `05-tech-mobile-stack-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `09-design-system-sot.md`
- `screenshots/05-parent-word-list.JPG`

Nên chia implementation thành các bước test độc lập: format/validation, logical repository, file pipeline, restore transaction/rollback, rồi UI Parent Zone.

Output:

- Route “Sao lưu & khôi phục” trong Parent Zone.
- Custom binary container `.kidedu` v1 theo thứ tự header → payloads → manifest → footer, chứa snapshot 11 bảng, relative media path, offset/size và CRC32.
- Export/import streaming/chunked, không dùng ZIP/native archive module nặng và không giữ binary lớn trong JS memory.
- Chọn tệp bằng document picker và chuyển tệp thủ công bằng share sheet của hệ điều hành.
- Preview tệp trước restore và xác nhận riêng cho replace-all.
- Restore transaction, rewrite media URI, rollback, cleanup staging/orphan và refresh query cache.
- Unit/integration test cho format, validation, repository snapshot, transaction và failure paths.
- Manual device smoke cho picker/share sheet, media gần budget và thiếu dung lượng.

Acceptance:

- Tạo được backup khi offline và tệp hoàn tất có thể được phụ huynh tự lưu/chuyển.
- Snapshot chứa đủ 11 bảng dữ liệu; không copy `schema_versions` hoặc SQLite database thô.
- Không ghi URI tuyệt đối của thiết bị nguồn; restore tạo URI durable mới trên thiết bị đích.
- Chọn tệp chỉ validate và hiển thị preview, chưa mutation dữ liệu.
- Tệp sai version, cấu trúc, size, path, range hoặc CRC32 bị từ chối trước xác nhận.
- Restore chỉ bắt đầu sau xác nhận replace-all và ghi 11 bảng trong một transaction.
- Restore lỗi giữ nguyên dữ liệu/media cũ và cleanup staging/media mới chưa dùng.
- Không có backend, cloud sync, tài khoản online hoặc chia sẻ công khai.
- UI giữ visual DNA Parent Zone, trạng thái pending chống double-tap và lỗi dùng ngôn ngữ dễ hiểu.

---

### T-013 — Privacy & Data Controls P1

Đọc:

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `04-business-parent-content-management-sot.md`
- `05-tech-mobile-stack-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `09-design-system-sot.md`
- `screenshots/05-parent-word-list.JPG`

Nên chia implementation thành các bước test độc lập: repository aggregate/mutations, permission snapshot, cleanup service, hook/cache lifecycle, rồi UI Parent Zone.

Output:

- Route “Quyền riêng tư & dữ liệu” trong Parent Zone.
- Giải thích local-only và tổng quan số thẻ/bộ/lịch sử/media cá nhân hóa.
- Trạng thái camera, micro, thư viện ảnh/video và hành động mở Cài đặt hệ thống; không tự request quyền khi mở màn.
- Xóa lịch sử học, xóa toàn bộ media cá nhân hóa và reset toàn bộ dữ liệu bằng ba thao tác tách biệt.
- Transaction, rollback, post-commit file cleanup, mutex và query cache refresh.
- Reset-all reseed canonical defaults, khóa Parent Gate và quay về Child Mode.
- Unit/component test và Maestro/manual smoke cho confirm, permission refresh và file cleanup thật.

Acceptance:

- Màn hình chỉ nằm sau Parent Gate và bám visual DNA Parent Zone.
- Summary dùng metadata aggregate, không đọc binary media.
- Mở màn không hiện permission prompt; trạng thái refresh khi quay lại từ Cài đặt.
- Mỗi action phá hủy mô tả đúng phạm vi, có xác nhận riêng và chống double-tap.
- Clear history xóa session/event/progress, reset trạng thái thẻ về `new`, giữ content/media/settings.
- Delete personalized media gỡ custom/generated media/avatar/thumbnail, giữ content/progress/settings và fallback default.
- Reset-all xóa dữ liệu user, reseed default content/settings trong một transaction, khóa Parent Gate và về Child Mode.
- DB failure rollback và không xóa file cũ; file cleanup chỉ chạy sau commit.
- Tệp backup ngoài app và permission hệ điều hành không bị tuyên bố là đã xóa/reset.
- Không có backend, analytics/telemetry, cloud sync hoặc tài khoản online.

---

## 4. Prompt template cho Codex

```text
Bạn đang implement KidEDU.
Trả lời bằng tiếng Việt.
Đọc các file SOT sau trước khi làm:
- README.md
- 01-kidedu-business-sot.md
- 02-kidedu-mobile-architecture-sot.md
- <file chi tiết liên quan>

Nếu task có giao diện/UI/UX, đọc thêm:
- 09-design-system-sot.md
- <ảnh screenshots liên quan>

Task:
<ghi task cụ thể>

Yêu cầu:
- Không thêm feature mới ngoài SOT.
- Nếu cần thay đổi nghiệp vụ/architecture, dừng lại và nêu đề xuất trước.
- Implement nhỏ gọn, test được.
- Nếu có UI, bám 09-design-system-sot.md và ảnh screenshots tương ứng.
- Sau khi làm xong, tóm tắt file đã sửa, cách test và rủi ro còn lại.
```

---

## 5. Quy tắc update SOT sau task

Sau mỗi task, nếu có thay đổi:

| Loại thay đổi                            | File cần update                                  |
| ---------------------------------------- | ------------------------------------------------ |
| Thay đổi nghiệp vụ                       | `01` và file business chi tiết liên quan         |
| Thay đổi architecture tổng quan          | `02`                                             |
| Thay đổi tech stack                      | `05`                                             |
| Thay đổi schema/media pipeline           | `06`                                             |
| Thay đổi lazy load/cache/memory          | `07`                                             |
| Thay đổi cách chia task                  | `08`                                             |
| Thay đổi design system hoặc UI reference | `09`, `README.md` nếu thêm/xóa ảnh hoặc file SOT |
| Thêm/xóa file SOT                        | `README.md` và `CHANGELOG.md`                    |

Không update tài liệu lung tung nếu code change không ảnh hưởng quyết định SOT.
