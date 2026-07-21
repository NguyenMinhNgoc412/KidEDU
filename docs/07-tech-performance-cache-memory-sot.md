# KidEDU SOT 07 — Performance, Lazy Load, Cache & Memory Management

**Trạng thái:** SOT kỹ thuật chi tiết  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-07-21  
**Phạm vi:** Lazy loading, state management, cache strategy, quản lý bộ nhớ cho media, backup/restore và data cleanup  
**Liên quan:** `02-kidedu-mobile-architecture-sot.md`, `05-tech-mobile-stack-sot.md`, `06-tech-local-data-media-sot.md`

---

## 1. Mục tiêu

KidEDU dùng nhiều ảnh, ảnh động, video và audio. Vì vậy performance và memory là yêu cầu kỹ thuật lõi, không phải tối ưu phụ.

Mục tiêu:

1. Màn hình học mở nhanh.
2. Auto Play chuyển thẻ mượt.
3. Danh sách thẻ/bộ học không giật khi nhiều item.
4. App không giữ quá nhiều video/ảnh trong RAM.
5. App xử lý tốt thiết bị Android cấu hình thấp.
6. App không crash khi media missing hoặc file lớn.

---

## 2. Lazy load strategy

### 2.1. Route lazy load

- Chia route theo child zone và parent zone.
- Không load parent management screens khi trẻ chỉ học.
- Không load form/media management cho tới khi phụ huynh mở.

### 2.2. Data lazy load

- Màn danh sách chỉ load metadata cần hiển thị.
- Chi tiết thẻ mới load full media metadata.
- Auto Play chỉ load deck detail khi bắt đầu phiên hoặc khi vào màn play.
- Progress detail chỉ load khi phụ huynh mở trang tiến độ.

### 2.3. Media lazy load

Quy tắc quan trọng:

```text
Danh sách: chỉ load thumbnail
Màn học: load media của current item
Auto Play: preload current item + next item
Previous item: release khi đã chuyển qua item mới ổn định
```

Không preload toàn bộ video trong một deck dài.

### 2.4. Animation lazy load

- Không chạy nhiều ảnh động cùng lúc trong list.
- Ảnh động trong list nên hiển thị thumbnail tĩnh nếu list lớn.
- Chỉ chạy animation của item đang focus hoặc màn học hiện tại.

---

## 3. State management strategy

### 3.1. Source of truth

| Loại state                | Nơi lưu                                          |
| ------------------------- | ------------------------------------------------ |
| Metadata thẻ/bộ/progress  | SQLite                                           |
| Settings nhỏ              | KV store hoặc SQLite                             |
| Query/read result         | TanStack Query cache                             |
| UI/session state tạm thời | Zustand                                          |
| Form state                | React Hook Form                                  |
| Media playback runtime    | Local component/hook hoặc playback service state |

### 3.2. Zustand dùng cho gì

Dùng Zustand cho:

- selected child profile nếu MVP có nhiều hồ sơ;
- current deck/session UI state;
- parent gate unlock state tạm thời;
- playback UI state tạm thời;
- modal/bottom sheet state nếu cần;
- setting UI đang chỉnh nhưng chưa lưu.

Không dùng Zustand để:

- lưu toàn bộ danh sách thẻ;
- lưu binary media;
- thay thế database;
- giữ toàn bộ progress lâu dài;
- giữ object video/audio player không cleanup.

### 3.3. TanStack Query dùng cho gì

Dùng TanStack Query cho:

- danh sách thẻ;
- chi tiết thẻ;
- danh sách bộ;
- chi tiết bộ;
- progress summary;
- media metadata;
- settings read.

Sau mutation phải invalidate query liên quan.

Ví dụ:

| Mutation     | Query cần invalidate                        |
| ------------ | ------------------------------------------- |
| Tạo thẻ      | item list, category summary                 |
| Sửa thẻ      | item detail, item list, deck detail nếu cần |
| Thay media   | item detail, media list, deck play resolver |
| Tạo deck     | deck list                                   |
| Reorder deck | deck detail, deck list                      |
| Ghi progress | progress summary, item progress             |

---

## 4. Cache strategy

### 4.1. Query cache

- Cache metadata, không cache file binary.
- Set stale time dài hơn cho category/default deck ít đổi.
- Set stale time ngắn hơn cho progress và parent management data.
- Sau khi mutation thành công, invalidate đúng query thay vì reload toàn app.

### 4.2. Image cache

- Dùng image component có cache policy.
- List chỉ dùng thumbnail.
- Ảnh lớn chỉ hiển thị ở màn học/preview.
- Ảnh phụ huynh upload nên resize trước khi lưu nếu quá lớn.

### 4.3. Video cache/preload

- Không cache video trong JS memory.
- Không preload toàn bộ deck.
- Auto Play chỉ chuẩn bị current và next item.
- Khi chuyển qua item mới, release player/resource của item cũ.
- Video preview trong parent area không tự phát hàng loạt.

### 4.4. Audio cache/preload

- Audio ngắn có thể chuẩn bị trước cho current và next item.
- Không phát nhiều audio chồng nhau trừ khi có chủ đích.
- Khi chuyển thẻ, dừng audio cũ trước khi phát audio mới.

### 4.5. Temp cache

- File import/camera tạm phải được cleanup.
- Temp cũ quá hạn phải xóa khi app khởi động hoặc khi vào parent area.
- Không chạy cleanup khi Auto Play đang phát.

---

## 5. Memory management rules

### 5.1. Video memory

Bắt buộc:

1. Chỉ một video active trên màn hình học/autoplay.
2. Không render video player trong list card.
3. Khi rời màn hình học, pause và release video resource.
4. Khi app background, pause playback.
5. Khi đổi item, dừng video cũ trước khi video mới phát.
6. Không giữ reference tới player cũ sau khi unmount.

### 5.2. Image memory

Bắt buộc:

1. Dùng thumbnail cho list.
2. Resize ảnh phụ huynh upload nếu quá lớn.
3. Không dùng ảnh full-resolution làm thumbnail.
4. Không chạy nhiều ảnh động nặng cùng lúc.
5. Với ảnh động, ưu tiên file nhẹ và duration ngắn.

### 5.3. Audio memory

Bắt buộc:

1. Dừng audio cũ trước khi phát audio mới.
2. Release audio object khi rời màn hình.
3. Không loop âm thanh nền trong MVP.
4. Âm thanh khen/SFX phải ngắn.

### 5.4. JS memory

Bắt buộc:

1. Không đưa file binary/base64 vào JS state.
2. Không truyền object media lớn qua navigation params.
3. Chỉ truyền ID qua route, rồi màn hình tự query metadata.
4. Cleanup timer trong Auto Play khi pause/stop/unmount.
5. Cleanup listener/subscription khi component unmount.
6. Tránh tạo function/object mới hàng loạt trong item renderer nếu list lớn.

---

## 6. List performance

Dùng FlashList cho:

- danh sách thẻ;
- danh sách bộ;
- danh sách media;
- danh sách chọn thẻ để thêm vào bộ.

Quy tắc:

1. Luôn có stable key.
2. Item component phải nhẹ.
3. Không để item tự giữ state không reset khi data đổi.
4. Không render video/audio player trong item list.
5. Ưu tiên thumbnail, title, status badge.
6. Action nặng mở sang màn detail hoặc modal riêng.

---

## 7. Auto Play performance

Auto Play phải có preload policy rõ:

```text
Before session:
  load deck metadata + ordered item ids

For current item:
  resolve media + prepare playback

For next item:
  preload lightweight metadata + thumbnail/audio if safe

For previous item:
  release playback resource
```

Không làm:

- preload toàn bộ video;
- tạo nhiều player cùng lúc;
- chạy animation phức tạp khi video đang phát;
- ghi progress quá dày theo từng frame/tick.

Progress nên ghi theo event nghiệp vụ:

- session started;
- item viewed;
- item replayed;
- item completed;
- session completed/cancelled.

---

## 8. Media size budget đề xuất

MVP nên có rule mềm/cảnh báo để bảo vệ app.

| Media             | Rule đề xuất                                        |
| ----------------- | --------------------------------------------------- |
| Video cá nhân hóa | Ngắn, tập trung khẩu hình, cảnh báo nếu dài/quá lớn |
| Ảnh minh họa      | Resize nếu quá lớn                                  |
| Ảnh động          | Dùng ít, nhẹ, không nhấp nháy mạnh                  |
| Audio             | Ngắn, rõ tiếng, không nhạc nền dài                  |
| Thumbnail         | Luôn nhỏ hơn ảnh gốc                                |

Nếu media vượt budget, app nên cảnh báo phụ huynh trước khi lưu.

---

## 9. Backup/restore performance và storage safety

Backup có thể chứa nhiều video/audio, vì vậy P1 áp dụng các quy tắc bắt buộc sau:

1. Đọc và ghi container `.kidedu` theo chunk cố định 512 KB; không load toàn bộ tệp hoặc toàn bộ media vào JS memory.
2. Không chuyển binary sang base64, Zustand, TanStack Query cache hoặc navigation params.
3. Xử lý tuần tự từng media hoặc dùng mức concurrency rất thấp; không checksum/copy nhiều video lớn song song.
4. Manifest phải khai báo kích thước từng entry và tổng kích thước để kiểm tra budget trước restore.
5. Trước khi export/restore, kiểm tra dung lượng trống nếu platform cung cấp và luôn chừa safety margin cho staging + media mới.
6. Từ chối entry vượt budget, path/offset/range không hợp lệ, trùng logical path, kích thước thực không khớp hoặc CRC32 sai trước khi mutation DB.
7. Không chạy backup/restore trong lúc Learning hoặc Auto Play đang active.
8. Disable thao tác lặp khi đang chạy; một thời điểm chỉ có một export hoặc restore.
9. Cleanup container dở dang, staging và media mới chưa được tham chiếu khi hủy/lỗi.
10. Chỉ cleanup media cũ sau DB commit; nếu cleanup bị gián đoạn, orphan cleanup xử lý ở lần an toàn tiếp theo.
11. Sau restore thành công, reset/invalidate metadata query cache; không cache binary backup.
12. Nếu app background hoặc process bị dừng giữa restore, DB transaction không được ở trạng thái ghi một phần; staging/orphan còn lại phải được cleanup best-effort ở lần chạy an toàn tiếp theo.

UI chỉ hiển thị phần trăm khi service có progress theo bytes thật. Nếu không, dùng trạng thái theo giai đoạn để tránh progress giả.

### 9.1. Privacy/data deletion safety

1. Tổng quan dữ liệu chỉ dùng aggregate query trên metadata; không đọc binary để tính lại dung lượng khi mở màn.
2. Không request camera/micro/thư viện chỉ để hiển thị trạng thái; dùng permission query không tương tác.
3. Mỗi thời điểm chỉ có một clear-history, delete-personalized-media hoặc reset-all đang chạy.
4. Disable các nút phá hủy khi mutation đang chạy hoặc khi summary cho biết không có dữ liệu tương ứng.
5. DB transaction phải commit trước khi xóa file; không xóa file song song với mutation DB.
6. Cleanup nhiều URI theo tuần tự hoặc concurrency thấp để tránh I/O spike trên Android yếu.
7. Reset-all không giữ snapshot/media trong React state và không reload app process chỉ để làm mới cache.
8. Sau mutation, reset/invalidate query cache thay vì giữ các list/detail/progress cũ trong memory.
9. Không scan toàn bộ shared storage của thiết bị; chỉ cleanup các URI/thư mục trong vùng app quản lý.
10. Permission snapshot được refresh khi màn hình focus lại vì phụ huynh có thể vừa quay về từ Cài đặt hệ thống.
11. Recovery sweep chạy trước khi repository được expose cho UI để không đua với import/restore; chỉ list metadata/tên file và xóa theo batch nhỏ, không đọc binary.

---

## 10. App lifecycle rules

Khi app vào background:

- pause video;
- pause audio;
- pause Auto Play timer;
- không tự chuyển bài trong background.

Khi app quay lại foreground:

- giữ thẻ hiện tại;
- cho phụ huynh/trẻ bấm tiếp tục;
- không tự phát âm thanh bất ngờ nếu không phù hợp.

Khi màn hình unmount:

- cleanup player;
- cleanup timer;
- cleanup listener;
- không ghi progress trùng lặp.

---

## 11. Performance acceptance checklist

Trước khi coi một task media/autoplay/list là xong, phải kiểm tra:

1. Không render video trong list.
2. List dùng thumbnail.
3. Route chỉ load phần cần thiết.
4. Màn học chỉ có một video active.
5. Auto Play preload tối đa current + next.
6. Timer được cleanup khi pause/stop/unmount.
7. Audio không chồng tiếng ngoài ý muốn.
8. App không crash khi file media missing.
9. App pause khi background.
10. Progress không ghi quá nhiều event không cần thiết.
11. Form parent area không giữ file base64 trong state.
12. Media import cleanup temp sau khi lưu/lỗi.
13. Backup/restore stream theo chunk và không giữ binary lớn trong JS memory.
14. Tệp sai version/size/checksum bị từ chối trước DB mutation.
15. Restore lỗi không làm thay đổi dữ liệu/media hiện tại và cleanup staging.
16. Backup/restore được smoke test trên thiết bị thật với media gần budget mục tiêu.
17. Privacy summary không đọc binary hoặc hiện permission prompt.
18. Clear/delete/reset chống double-tap, transaction rollback đúng và chỉ cleanup file sau commit.
19. Permission status refresh sau khi quay lại từ Cài đặt hệ thống.
20. Reset-all khóa Parent Gate, làm mới query cache và không để media cá nhân hóa còn được resolve.

---

## 12. Khi nào cần tối ưu sâu hơn

Chỉ thêm tối ưu nặng khi có bằng chứng từ thiết bị thật.

Có thể cân nhắc sau MVP:

- video compression bắt buộc;
- background media cleanup nâng cao;
- image CDN/cache nếu sau này có backend;
- profiling bằng native tooling;
- giới hạn storage theo từng hồ sơ trẻ.

Không thêm native module nặng chỉ vì “có thể cần” nếu chưa có vấn đề thực tế.
