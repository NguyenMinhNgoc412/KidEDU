# KidEDU SOT — CHANGELOG

Tất cả thay đổi quan trọng của bộ Source of Truth được ghi tại file này.

Format dùng theo hướng đơn giản:

- ngày thay đổi;
- version tài liệu;
- nhóm thay đổi;
- các file bị ảnh hưởng;
- lý do thay đổi.

---

<<<<<<< Updated upstream
=======
## [0.6.7] — 2026-08-23

### Changed

- Chốt Child Home dùng category tile cyan/yellow/pink/green/orange có tương phản theo từng nền và bottom navigation ba mục.
- Chốt Parent Home dùng danh sách quản lý kiểu mobile có icon, chevron và bottom navigation thay cho lưới nút dashboard.
- Màn học từng thẻ và Auto Play luôn tách vùng minh hoạ khỏi vùng video khẩu hình; vùng minh hoạ tạm dùng ảnh hiện có và có thể thay bằng ảnh động/GIF sau này trong cùng layout.
- Video khẩu hình dùng toàn bộ khung hình làm vùng chạm play/pause, không hiển thị nút hoặc icon đè lên miệng.
- Làm rõ pause video độc lập với nút “Tạm dừng bộ học” của Auto Play.

### Affected files

- `09-design-system-sot.md`

### Reason

Owner cung cấp reference mobile mới và yêu cầu tăng độ hoàn thiện UI/UX, làm màu Child Mode tươi rõ hơn nhưng vẫn sensory-safe, đồng thời không che khẩu hình bằng playback overlay.

## [0.6.6] — 2026-08-23

### Changed

- Làm tươi palette Gentle Growth bằng nền kem sáng, xanh lá rõ hơn và nhóm pastel peach/leaf/sky/yellow/lavender cho Child Mode.
- Làm rõ nguyên tắc màu tươi nhưng vẫn sensory-safe, tránh neon, độ bão hòa cao và trang trí gây phân tán.
- Đồng bộ card, button, input và media container theo phong cách mobile tactile với tonal layer, viền mềm và shadow nhẹ.

### Affected files

- `09-design-system-sot.md`

### Reason

Owner yêu cầu giao diện KidEDU trông hoàn thiện, chuyên nghiệp và tươi vui hơn để thu hút trẻ em nhưng không gây quá tải giác quan.

## [0.6.5] — 2026-08-06

### Changed

- Owner duyệt tổng thể đặc tả mini test trong file `11` và chuyển tài liệu từ Draft thành đặc tả nghiệp vụ chi tiết.
- Mini test dùng 2/4/6 hình theo tuổi, tối đa 5 câu ngẫu nhiên, cho phép hình nhiễu local ngoài bộ và chỉ nhận lựa chọn sau khi audio kết thúc.
- Chốt phản hồi sai rung nhẹ, đúng nổi/phóng nhẹ + âm thanh; kết thúc chúc mừng rồi hiện “Làm lại”/“Trò chơi”/“Học tiếp”.
- Lịch sử chỉ ghi bộ đã học và mini test đã làm/chưa làm, không lưu đáp án hoặc số lần sai/phát lại.
- Bổ sung architecture/data/performance/design/task split cho review activities, gồm migration tuổi hồ sơ, puzzle template nullable và backup compatibility.
- Cập nhật README, roadmap và hướng dẫn agent để bắt buộc đọc đặc tả `10`/`11` khi triển khai.

### Affected files

- `README.md`
- `AGENTS.md`
- `docs/README.md`
- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `03-business-auto-play-deck-sot.md`
- `04-business-parent-content-management-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `08-Agent-task-splitting-sot.md`
- `09-design-system-sot.md`
- `10-minigame-discussion.md`
- `11-minitest-discussion.md`
- `ROADMAP.md`

### Reason

Owner hoàn tất thảo luận lại mini-game/mini test và yêu cầu đồng bộ toàn bộ tài liệu trước khi tiếp tục implementation.

---

## [0.6.4] — 2026-08-06

### Changed

- Bắt đầu thảo luận lại Draft mini test trong file `11`.
- Chốt số hình lựa chọn theo tuổi: 3 tuổi có 2 hình, 4 tuổi có 4 hình và trên 4 tuổi có 6 hình.
- Chốt trẻ dưới 3 tuổi hoặc hồ sơ chưa nhập tuổi dùng mặc định 2 hình lựa chọn.
- Chốt không giảm số lựa chọn khi bộ hiện tại thiếu hình; được lấy hình từ bộ khác để làm phương án nhiễu, còn từ mục tiêu/đáp án/audio vẫn phải thuộc bộ vừa học.
- Chốt hình nhiễu ngoài bộ được chọn ngẫu nhiên từ bất kỳ hình local hợp lệ nào, không phụ thuộc trẻ đã học bộ đó; tiếp tục loại hình trùng hoặc mơ hồ.
- Chốt khi mở câu mini test, các hình lựa chọn xuất hiện đồng thời với lúc audio mẫu bắt đầu phát.
- Chốt audio tự phát một lần khi mở câu; hình hiển thị ngay nhưng chỉ nhận lựa chọn sau khi audio kết thúc.
- Chốt câu hỏi chỉ hiển thị hình và audio, không hiển thị chữ hoặc tên từ dưới hình.
- Chốt nút “Phát lại” nằm dưới khu vực hình và tạm khóa trong lúc audio đang phát để tránh chồng âm thanh.
- Chốt phản hồi mini test khi chọn chưa đúng: hình vừa chọn rung ngang nhẹ như lắc đầu, không hiện chữ hoặc phát âm báo lỗi và tiếp tục cho trẻ chọn lại.
- Chốt khi chọn đúng, mini test hiển thị phản hồi hình ảnh ngắn rồi tự chuyển câu, không có nút “Tiếp tục”.
- Chốt mỗi câu đúng phát file âm thanh chúc mừng hiện có; chỉ chuyển câu sau khi hiệu ứng và âm thanh kết thúc để không chồng audio câu kế tiếp.
- Chốt hiệu ứng câu đúng làm hình được chọn nổi lên và phóng nhẹ, không thêm viền sáng hoặc hiệu ứng mạnh.
- Chốt mỗi lượt mini test có tối đa 5 câu chọn ngẫu nhiên từ các từ hợp lệ trong bộ vừa học và không lặp từ mục tiêu khi có đủ lựa chọn.
- Chốt bộ có dưới 5 từ mục tiêu hợp lệ thì giảm số câu theo số từ hiện có, không lặp từ để cố đủ 5 câu.
- Chốt thẻ mục tiêu mini test phải có cả hình và audio phát âm local; thẻ thiếu media bị loại riêng, không khóa mini test của toàn bộ bộ nếu còn thẻ hợp lệ khác.
- Chốt mini test chỉ mở khi bộ có ít nhất hai thẻ mục tiêu hợp lệ; bộ có 0–1 thẻ thì không tạo mini test và hiển thị giải thích ngắn.
- Chốt màn hoàn thành mini test không có điểm số và hiển thị ba nút: “Làm lại” tạo lượt ngẫu nhiên mới, “Trò chơi” mở menu mini-game của bộ hiện tại, “Học tiếp” về chọn bộ học.
- Chốt sau câu cuối hiển thị bước chúc mừng ngắn trước, sau đó mới hiện menu ba nút.
- Chốt bước chúc mừng cuối lượt phát lại file âm thanh hiện có sau âm thanh của câu đúng cuối cùng, không chồng hai âm thanh; menu chỉ hiện sau khi hoàn tất.
- Chốt nút đóng mini test giữa lượt quay về popup cuối bộ với ba lựa chọn ban đầu.
- Chốt đóng mini test giữa lượt có hiệu lực ngay, không hiện popup xác nhận hoặc phát cảnh báo.
- Chốt lịch sử chỉ ghi ở cấp bộ: đã học và đã làm/chưa làm mini test; không lưu lựa chọn từng câu, số lần sai hoặc phát lại, và thoát giữa lượt không tính là đã làm test.

### Affected files

- `11-minitest-discussion.md`

### Reason

Owner yêu cầu mini test điều chỉnh độ khó theo tuổi thay vì cố định hai lựa chọn như helper hiện tại.

---

## [0.6.3] — 2026-08-06

### Changed

- Owner duyệt tổng thể đặc tả mini-game trong file `10` và chuyển tài liệu từ Draft thành đặc tả nghiệp vụ chi tiết.
- Ghép hình tự tăng 2 → 3 → 4 mảnh, dùng tối đa ba hình khác nhau chọn từ bộ, kéo từ khay dưới vào khung trống phía trên và không tự chuyển màn.
- Hình ghép dùng mẫu cắt được gán phù hợp hoặc fallback an toàn; không có ảnh mờ, số/chữ gợi ý hoặc âm thanh hoàn thành.
- Lật thẻ tự tăng 2 → tối đa 5 cặp theo số hình hợp lệ; cặp đúng thu nhỏ, mờ dần, biến mất và phát file chúc mừng hiện có.
- Chuẩn hóa “Tiếp tục”/“Chơi lại”/“Học tiếp” và nút đóng quay thẳng về menu trò chơi không cần xác nhận.

### Affected files

- `README.md`
- `01-kidedu-business-sot.md`
- `03-business-auto-play-deck-sot.md`
- `10-minigame-discussion.md`

### Reason

Owner thảo luận lại mini-game vì implementation ban đầu lệch ý tưởng giải trí nhẹ và duyệt luồng chi tiết mới trước khi sửa code.

---

## [0.6.2] — 2026-08-05

### Added

- Tạo hai tài liệu Draft riêng để thảo luận lại mini-game và mini test trước khi tiếp tục implement.
- Ghi rõ implementation hiện tại chỉ dùng để đối chiếu, không tự trở thành quyết định sản phẩm.
- Tập hợp các câu hỏi owner cần chốt về cơ chế chơi, độ khó, phản hồi, chuyển màn và lịch sử.

### Changed

- Bổ sung vào Draft mini-game: ghép hình tự tăng số mảnh theo màn, màn 2 mảnh dùng đúng 2 mảnh và hình dạng mảnh có thể bám theo vật thể thay vì luôn là ô vuông.
- Chốt trong Draft mini-game tiến trình ghép hình chỉ gồm 2 → 3 → 4 mảnh rồi kết thúc để giữ hoạt động ngắn và mang tính giải trí.
- Chốt trong Draft mini-game mỗi lượt dùng ba hình khác nhau được chọn ngẫu nhiên từ đúng bộ, tương ứng với các màn 2, 3 và 4 mảnh; không lặp hình trong cùng lượt.
- Chốt trong Draft mini-game bộ có ít hơn ba hình vẫn được chơi số màn tương ứng: một hình chơi màn 2 mảnh, hai hình chơi màn 2 và 3 mảnh.
- Chốt trong Draft mini-game không tự chuyển sau khi ghép xong: hiển thị “Tiếp tục” để sang màn kế tiếp hoặc “Học tiếp” để thoát về màn chọn bộ; màn cuối không còn nút “Tiếp tục”.
- Chốt trong Draft mini-game màn ghép cuối hiển thị cả “Chơi lại” và “Học tiếp”.
- Chốt trong Draft mini-game “Chơi lại” tạo lượt mới với bộ hình được chọn lại ngẫu nhiên, ưu tiên khác lượt trước và cho phép dùng lại khi bộ không đủ hình thay thế.
- Chốt trong Draft mini-game cơ chế kéo từng mảnh vào đúng vị trí trong khung hình; thả chưa đúng thì mảnh quay lại vị trí ban đầu bằng chuyển động nhẹ.
- Chốt trong Draft mini-game khung ghép nằm phía trên, khay chứa toàn bộ mảnh nằm phía dưới và cả hai phải hiển thị trọn trong một màn hình không cuộn.
- Chốt trong Draft mini-game khung ghép chỉ có các vùng đặt mảnh trống, không hiển thị ảnh hoàn chỉnh mờ làm gợi ý.
- Chốt trong Draft mini-game mảnh ghép và vùng đặt không hiển thị số/chữ gợi ý, chỉ dùng hình ảnh và hình dạng mảnh.
- Chốt trong Draft mini-game ứng dụng tự cắt ảnh theo bộ mẫu hình dạng có sẵn cho các mức 2, 3 và 4 mảnh, không cần chuẩn bị asset mảnh riêng cho từng hình.
- Chốt trong Draft mini-game mỗi hình được gán trước mẫu cắt phù hợp thay vì chọn mẫu ngẫu nhiên, nhằm giữ phần nhận diện chính và tránh làm mất nội dung quan trọng.
- Chốt trong Draft mini-game hình chưa được gán mẫu riêng dùng mẫu cắt an toàn mặc định cho mức 2, 3 hoặc 4 mảnh; fallback không được cắt bỏ hay che mất vùng ảnh.
- Chốt trong Draft mini-game lật thẻ tự tăng cấp theo tiến trình 2 → 3 → 4 → 5 cặp, không cho người chơi chọn số cặp thủ công.
- Chốt trong Draft mini-game điều hướng sau mỗi màn lật thẻ giống ghép hình: cấp giữa có “Tiếp tục”/“Học tiếp”, cấp cuối có “Chơi lại”/“Học tiếp”; chơi lại bắt đầu từ 2 cặp với hình chọn lại ngẫu nhiên.
- Chốt trong Draft mini-game mỗi cấp lật thẻ chọn lại toàn bộ hình ngẫu nhiên từ bộ; trong cùng cấp, một hình chỉ tạo đúng một cặp.
- Chốt trong Draft mini-game cấp lật thẻ cao nhất phụ thuộc số hình hợp lệ trong bộ; từ 2 đến 4 hình dừng ở số cặp tương ứng, từ 5 hình chơi đủ 5 cặp và dưới 2 hình thì khóa game.
- Chốt trong Draft mini-game mặt sau tất cả thẻ lật dùng logo KidEDU thống nhất và không để lộ hình mặt trước.
- Chốt trong Draft mini-game cặp thẻ đúng đồng thời thu nhỏ và mờ dần rồi biến mất, kèm âm thanh khen ngắn cho cặp đó.
- Chốt trong Draft mini-game phát thêm âm thanh khi hoàn thành toàn bộ màn lật thẻ; âm thanh này phát sau âm thanh của cặp cuối và không được chồng hai âm cùng lúc.
- Chốt trong Draft mini-game dùng cùng file chúc mừng hiện có cho âm thanh cặp đúng và âm thanh hoàn thành màn, không thêm asset âm thanh riêng.
- Chốt trong Draft mini-game nút đóng trong lúc ghép hình/lật thẻ quay về menu chọn trò chơi của bộ hiện tại; chỉ “Học tiếp” mới quay về màn chọn bộ học.
- Chốt trong Draft mini-game đóng giữa lượt có hiệu lực ngay, không hiện popup xác nhận hoặc cảnh báo.
- Chốt trong Draft mini-game hoàn thành hình ghép chỉ dùng hiệu ứng hình nổi lên, không phát âm thanh chúc mừng; âm thanh chúc mừng chỉ dùng trong lật thẻ.
- Bổ sung vào Draft mini-game: cặp lật đúng biến mất và phát âm thanh chúc mừng nhẹ theo từng cặp.

### Affected files

- `README.md`
- `10-minigame-discussion.md`
- `11-minitest-discussion.md`

### Reason

Owner nhận thấy implementation có khả năng đang xa ý tưởng ban đầu và yêu cầu quay lại bước thảo luận. Thay đổi này chỉ tổ chức tài liệu, chưa thay đổi quyết định nghiệp vụ trong `01`/`03` và chưa yêu cầu sửa code.

---

## [0.6.1] — 2026-08-05

### Changed

- Mini test Beta chỉ phát audio phát âm local, có nút phát lại và cho trẻ chọn lại không giới hạn sau phản hồi nhẹ; không phát video khẩu hình hoặc tự chỉ đáp án.
- Ghép hình hiển thị ảnh hoàn chỉnh nổi lên rồi chuyển lần lượt sang ảnh khác của cùng bộ.
- Lật thẻ dùng từ 2 đến 5 cặp, không phát mẫu ở từng cặp và chỉ phát âm thanh chúc mừng nhẹ khi hoàn thành.
- Kết thúc Auto Play hiển thị popup ba lựa chọn: về chọn bộ học, mini test hoặc trò chơi.

### Affected files

- `01-kidedu-business-sot.md`
- `03-business-auto-play-deck-sot.md`
- `04-business-parent-content-management-sot.md`

### Reason

Owner duyệt luồng ôn tập nhẹ, ưu tiên audio và hình minh họa để giảm thời gian chờ cùng kích thích giác quan.

---

## [0.6.0] — 2026-08-05

### Added

- Chốt BIZ-017 “Mini test cuối bộ” theo dạng phát mẫu và cho trẻ chọn một trong hai hình.
- Chốt BIZ-018 “Mini-game theo bộ học” gồm ghép hình hoàn chỉnh và lật thẻ tìm cặp.
- Bổ sung điều kiện nội dung hợp lệ, phản hồi không trừng phạt, kết quả lựa chọn mô tả và quy tắc không dùng game để đánh giá ngôn ngữ.
- Bổ sung cài đặt phụ huynh cho mini test cuối bộ và phạm vi xóa/backup lịch sử liên quan.

### Changed

- Chuyển ba hoạt động cuối bộ đã duyệt từ hướng mở rộng sau v1.0 vào phạm vi Beta.
- Cho phép tự so sánh lựa chọn hình với đáp án cố định nhưng tiếp tục cấm AI chấm phát âm, điểm tổng và trạng thái đạt/rớt.
- Yêu cầu re-baseline thời lượng Beta sau khi có task breakdown, không rút ngắn hardening hoặc regression.

### Affected files

- `README.md`
- `01-kidedu-business-sot.md`
- `03-business-auto-play-deck-sot.md`
- `04-business-parent-content-management-sot.md`
- `ROADMAP.md`

### Reason

Owner chốt phạm vi Beta gồm mini test nghe và chọn hình, ghép hình hoàn chỉnh và lật thẻ tìm cặp để củng cố các từ trong bộ học mà không thêm AI chấm phát âm.

---

>>>>>>> Stashed changes
## [0.5.2] — 2026-07-27

### Added

- Bổ sung release rule và preflight cho video học mặc định bundled: MP4 H.264, HD 720p trở lên, có thumbnail, duration, size và asset key versioned.
- Bổ sung production build gate yêu cầu ít nhất một video khẩu hình bundled.

### Changed

- Chốt video học cốt lõi của MVP phát từ local bundled asset, không stream URL cloud trực tiếp trong Learning/Auto Play.
- Làm rõ nội dung CDN sau MVP phải được tải và kiểm tra vào local storage trước khi học.

### Affected files

- `06-tech-local-data-media-sot.md`
- `assets/default-media/README.md`

### Reason

Đảm bảo fresh install hoạt động offline, timeline học không phụ thuộc buffering mạng và media phát hành có metadata/dung lượng kiểm soát được.

---

## [0.5.1] — 2026-07-27

### Changed

- Yêu cầu video khẩu hình cá nhân hóa đạt tối thiểu HD 1280 × 720.
- Luồng quay dùng chất lượng cao nhất thiết bị hỗ trợ thay cho mức Medium; video chọn từ thư viện được giữ nguyên chất lượng bằng passthrough.

### Affected files

- `04-business-parent-content-management-sot.md`
- `06-tech-local-data-media-sot.md`

### Reason

Đảm bảo khẩu hình trong video cá nhân hiển thị đủ rõ khi trẻ học, đồng thời không thêm bước nén video vào MVP.

---

## [0.5.0] — 2026-07-21

### Added

- Đưa BIZ-016 “Quyền riêng tư & kiểm soát dữ liệu” vào P1.
- Bổ sung tổng quan dữ liệu local và trạng thái quyền camera, micro, thư viện ảnh/video mà không tự hiện permission prompt.
- Bổ sung ba thao tác có xác nhận riêng: xóa lịch sử học, xóa toàn bộ media cá nhân hóa và đặt lại toàn bộ dữ liệu app.
- Bổ sung module `privacy`, repository aggregate/mutation transaction, post-commit file cleanup và query/session reset.
- Bổ sung startup recovery sweep cho file app-owned không còn DB reference, bao gồm bảo vệ avatar/thumbnail và giới hạn concurrency cleanup.
- Bổ sung task `T-013 — Privacy & Data Controls P1` cùng acceptance và yêu cầu test/device smoke.

### Changed

- Làm rõ reset-all phải reseed nội dung/cài đặt mặc định hiện hành, khóa Parent Gate và quay về Child Mode.
- Làm rõ xóa/reset trong app không thể xóa backup đã lưu ngoài app hoặc tự thu hồi permission do hệ điều hành quản lý.

### Affected files

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `04-business-parent-content-management-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `08-codex-task-splitting-sot.md`

### Reason

Owner duyệt làm Privacy & Data Controls ở P1 để phụ huynh hiểu và chủ động kiểm soát dữ liệu local của trẻ trước khi dự án cân nhắc backend hoặc các luồng chia sẻ khác.

---

## [0.4.0] — 2026-07-20

### Added

- Đưa BIZ-012 “Sao lưu & khôi phục local” vào P1 trước backend.
- Bổ sung luồng nghiệp vụ tạo tệp, preview, xác nhận replace-all và giữ nguyên dữ liệu cũ khi restore lỗi.
- Bổ sung module `backup`, custom binary container `.kidedu` v1 streaming theo chunk 512 KB, logical snapshot 11 bảng, relative media path, offset/size/CRC32 và restore transaction/rollback.
- Bổ sung `expo-document-picker` `~14.0.8` và `expo-sharing` `~14.0.8` cho chọn/chuyển tệp thủ công.
- Bổ sung task `T-012 — Local backup & restore P1` cùng acceptance và yêu cầu test/device smoke.

### Changed

- Chuyển export/backup media khỏi danh sách tối ưu sau MVP và quy định budget, chunked I/O, staging cleanup, disk/memory safety cho P1.
- Làm rõ share sheet chỉ dùng chuyển tệp local theo thao tác phụ huynh; không mở rộng sang cloud sync, backend, tài khoản online hoặc chia sẻ công khai.

### Affected files

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `04-business-parent-content-management-sot.md`
- `05-tech-mobile-stack-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `08-codex-task-splitting-sot.md`

### Reason

Owner duyệt làm BIZ-012 ở P1 để phụ huynh có cách bảo vệ và chuyển dữ liệu local trước khi dự án cân nhắc backend hoặc đồng bộ online.

---

## [0.3.3] — 2026-07-15

### Added

- Bổ sung font loading bằng `expo-font` và `@expo-google-fonts/plus-jakarta-sans` để app dùng đúng Plus Jakarta Sans theo design system.
- Bổ sung `expo-blur` cho Parent Gate/modal backdrop theo design system.

### Changed

- Làm rõ ngoại lệ typography: riêng từ/cụm từ mục tiêu trong màn Child study và Auto Play được phép viết hoa để tăng tập trung và khớp ảnh reference.

### Affected files

- `05-tech-mobile-stack-sot.md`
- `09-design-system-sot.md`

### Reason

Đồng bộ implementation UI với design system Gentle Growth, đồng thời giải quyết mâu thuẫn giữa quy tắc tránh All-Caps và ảnh reference màn học.

---

## [0.3.2] — 2026-07-15

### Added

- Bổ sung `expo-video-thumbnails` vào media stack để tạo thumbnail tĩnh cho video khẩu hình custom.

### Affected files

- `05-tech-mobile-stack-sot.md`

### Reason

Đồng bộ tech stack với media pipeline local-first: danh sách chỉ hiển thị thumbnail, không render video trực tiếp.

---

## [0.3.1] — 2026-07-04

### Changed

- Cập nhật timeline Auto Play: phát hết video/audio mẫu trước khi chuyển sang lượt trẻ nói.
- Cố định giai đoạn trẻ nói theo là 5 giây trong MVP.
- Cố định khoảng sau khi trẻ nói trước khi sang thẻ tiếp theo là 1 giây; nếu bật phản hồi thì phản hồi nằm trong khoảng này.
- Làm rõ preset tốc độ không được rút ngắn thời gian trẻ nói theo.

### Affected files

- `03-business-auto-play-deck-sot.md`

### Reason

Đồng bộ SOT với yêu cầu vận hành Auto Play mới: không chuyển sang phần trẻ nói khi video mẫu chưa phát hết và đảm bảo trẻ luôn có đủ 5 giây để nói theo.

---

## [0.3.0] — 2026-07-04

### Added

- Thêm `09-design-system-sot.md` làm SOT cho design system và visual direction.
- Thêm quy tắc bắt buộc đọc `09-design-system-sot.md` và mở ảnh trong `screenshots/` khi làm task giao diện/UI/UX.
- Thêm nhiệm vụ `T-011 — Design system alignment pass` trong `08-codex-task-splitting-sot.md`.
- Bổ sung mapping ảnh reference cho Child Mode, Child word list, Child study, media upload và Parent word list.

### Changed

- Cập nhật workflow chia task Codex để task UI luôn có input design system + screenshots.
- Cập nhật prompt template Codex để nhắc rõ yêu cầu đọc `09` và ảnh reference khi task có UI.

### Affected files

- `README.md`
- `AGENTS.md`
- `08-codex-task-splitting-sot.md`
- `09-design-system-sot.md`
- `screenshots/`

### Reason

Chuẩn hóa cách Codex triển khai giao diện theo design system Gentle Growth và ảnh tham chiếu, tránh tự tạo phong cách UI lệch khỏi định hướng sản phẩm.

---

## [0.2.0] — 2026-07-01

### Changed

- Đổi entry point của bộ SOT từ `00-sot-index.md` sang `README.md`.
- Tách lịch sử thay đổi SOT sang file `CHANGELOG.md`.
- Cập nhật quy tắc đọc tài liệu: mọi task phải đọc `README.md` trước.
- Cập nhật hướng dẫn Codex để không còn trỏ tới `00-sot-index.md`.

### Removed

- Loại bỏ vai trò canonical entry point của `00-sot-index.md` để tránh trùng lặp với README.

### Affected files

- `README.md`
- `CHANGELOG.md`
- `08-codex-task-splitting-sot.md`
- `kidedu-sot-pack.zip`

### Reason

Dùng `README.md` làm điểm vào chính giúp bộ tài liệu giống cấu trúc dự án chuẩn hơn. Dùng `CHANGELOG.md` giúp theo dõi lịch sử thay đổi SOT rõ ràng, tránh nhồi lịch sử vào file index hoặc file nghiệp vụ/kỹ thuật.

---

## [0.1.0] — 2026-07-01

### Added

- Tạo bộ SOT đầu tiên cho KidEDU mobile MVP.
- Tách business và technical documentation thành các file riêng.
- Tách các nghiệp vụ/kỹ thuật phức tạp thành file riêng để dễ giao task cho Codex.

### Files

- `01-kidedu-business-sot.md`
- `02-kidedu-mobile-architecture-sot.md`
- `03-business-auto-play-deck-sot.md`
- `04-business-parent-content-management-sot.md`
- `05-tech-mobile-stack-sot.md`
- `06-tech-local-data-media-sot.md`
- `07-tech-performance-cache-memory-sot.md`
- `08-codex-task-splitting-sot.md`
