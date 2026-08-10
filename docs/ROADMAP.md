# KidEDU — Roadmap tổng quát cho dự án solo

- **Trạng thái:** Kế hoạch triển khai dẫn xuất từ SOT, không thay thế SOT
- **Baseline:** 2026-07-23
- **Cập nhật phạm vi Beta:** 2026-08-05
- **Mốc code được audit:** `afc6774`
- **Mô hình thực hiện:** Một người phát triển, Android-first, local-first
- **Các mốc:** MVP → Beta → v1.0 → v2.0

---

## 1. Mục tiêu roadmap

Roadmap này ưu tiên một đường đi thực tế cho dự án solo:

1. Hoàn thiện một MVP Candidate dùng được thật trên thiết bị.
2. Đưa MVP Candidate cho nhóm nhỏ kiểm thử ở giai đoạn Beta.
3. Ổn định và phát hành Android v1.0.
4. Chỉ mở rộng v2.0 sau khi v1.0 ổn định và có phản hồi thực tế.

Các nguyên tắc không thay đổi:

- Không backend, đăng nhập online, cloud sync hoặc AI scoring trong MVP/v1.0.
- Trẻ học bằng thẻ và bộ thẻ tự chạy.
- Phụ huynh kiểm soát nội dung sau Parent Gate.
- Dữ liệu và media ưu tiên lưu local.
- Backup/restore và Privacy & Data Controls vẫn thuộc phạm vi Phase 0–1.
- Không đánh đổi an toàn dữ liệu, playback và trải nghiệm trẻ để chạy theo lịch.

Các timebox, test budget và release gate dưới đây là đề xuất vận hành cho dự án solo,
không phải quyết định nghiệp vụ mới của SOT. Solo owner chốt hoặc re-baseline chúng ở
tuần 1 mà không được tự thay đổi scope sản phẩm đã khóa.

---

## 2. Điểm xuất phát hiện tại

KidEDU không bắt đầu từ số 0. Repo hiện đã có phần lớn module T-000 đến T-013:

- Child Mode, học từng thẻ và Auto Play.
- Parent Gate và Parent Zone.
- CRUD thẻ, bộ học và sắp xếp thẻ.
- Media personalization.
- Progress và learning settings.
- SQLite, migration, repository và seed metadata.
- Backup/restore `.kidedu`.
- Privacy & Data Controls.
- 5 Maestro smoke flow.

Automated baseline hiện đạt:

- TypeScript strict.
- ESLint.
- 27 test suites.
- 147 tests.

Con số test không đồng nghĩa coverage đã rộng. Audit collect-all hiện khoảng 43.16%
lines và 34.10% branches; routes/components cùng các vùng native quan trọng như
`LearningMediaPlayer`, `PersonalizedMediaSection` và `backupService` vẫn thiếu coverage
trực tiếp. Năm file Maestro mới là flow đã được viết, chưa có bằng chứng execution pass
trên signed build.

Các khoảng trống lớn nhất:

1. `bundledDefaultMedia` đang rỗng; 29 thẻ seed chưa có media mặc định thật.
2. Auto Play vẫn có thể chạy thẻ chỉ có text, chưa đúng rule explicit opt-in trong SOT.
3. Native picker/camera/mic/player, backup/restore và privacy actions chưa được chứng minh
   đầy đủ trên Android thật.
4. Một số data semantics cần thống nhất: learning status, progress mark, item tạm ẩn
   trong deck và session bị dừng đột ngột.
5. Chưa có CI, signed preview evidence và full device regression.
6. UI/accessibility, release assets, privacy policy và store package chưa hoàn tất.

Vì code nền đã khá đầy đủ, roadmap tập trung vào content, hardening, kiểm thử và phát hành
thay vì xây lại architecture.

---

## 3. Tổng quan bốn mốc

| Mốc  | Mục tiêu                     |   Thời lượng solo tham chiếu | Kết quả                                                        |
| ---- | ---------------------------- | ---------------------------: | -------------------------------------------------------------- |
| MVP  | MVP Candidate để test nội bộ |                    8–10 tuần | Signed internal build, core flow dùng được offline             |
| Beta | Test kín với người dùng thật |                Thêm 4–6 tuần | Beta ổn định, đủ content phát hành, không còn lỗi nghiêm trọng |
| v1.0 | Phát hành Android production | Thêm 2–4 tuần + review ngoài | Store-ready release và quy trình hotfix                        |
| v2.0 | Mở rộng có chọn lọc          |           3–6 tháng sau v1.0 | Một hướng mở rộng lớn, vẫn kiểm soát được với dự án solo       |

Ước lượng từ hiện tại tới bản sẵn sàng submit v1.0 là khoảng 14–20 tuần nếu một người tự
làm cả code, QA, content và release. Thời gian duyệt hoặc yêu cầu kiểm thử của store là
dependency bên ngoài và phải được kiểm tra từ tuần đầu tiên của MVP.

Phải re-baseline lịch nếu một trong các điều kiện sau xảy ra:

- hết tuần 2 vẫn chưa có signed build hoặc golden deck;
- chưa có Android device thật để test native;
- tốc độ sản xuất content không đủ cho release set đã chốt;
- store yêu cầu thời gian closed testing/review dài hơn buffer hiện có.

---

## 4. Mốc MVP — MVP Candidate / Internal Alpha

### Mục tiêu

Có một bản KidEDU Candidate hoàn chỉnh về luồng kỹ thuật, cài được trên Android thật và
đủ an toàn để tự test hằng ngày. Đây là mốc internal alpha, chưa có nghĩa toàn bộ
MVP/Phase 0–1 trong SOT đã đạt release acceptance; việc đó được khóa ở Beta.

### Phạm vi

#### Trải nghiệm học

- Child Home, danh sách từ và màn học từng thẻ.
- Một golden deck có media thật để test end-to-end.
- Readiness filter/tạm ẩn nội dung seed chưa có media để 25+ thẻ placeholder không xuất
  hiện như nội dung học hoàn chỉnh.
- Auto Play đúng timeline:
  - phát hết video/audio mẫu;
  - chờ trẻ nói 5 giây;
  - chuyển thẻ sau khoảng nghỉ;
  - pause/resume/replay/exit;
  - 1 vòng, 3 vòng và lặp liên tục.
- Progress được ghi đúng và không scoring.

#### Parent Zone

- Parent Gate bảo vệ route quản lý.
- Tạo/sửa/ẩn/xóa thẻ.
- Tạo/sửa/ẩn/xóa/reorder bộ học.
- Chọn/quay ảnh, video và media thuộc release scope.
- Xóa custom media quay về default hoặc missing state an toàn.
- Cài đặt tốc độ và số vòng lặp có tác dụng thật.

#### Local-first và P1

- SQLite migration/seed không ghi đè dữ liệu user.
- Backup, preview và replace-all restore.
- Privacy summary, permission state, clear history, delete custom media và reset-all.
- Privacy summary không đếm asset `deleted/missing` như media đang dùng.
- Session còn `active` sau force-kill được recovery thành trạng thái phù hợp.
- Không có network dependency trong core flow.

#### Chất lượng nền

- CI chạy typecheck, lint và test.
- Signed EAS preview build cài được trên Android.
- Minimum integration/fault tests cho `backupService` orchestration trước native
  round-trip.
- Error/loading/empty states cho các luồng chính.
- Không render video trong list; media/temp/player/timer được cleanup.

### Kế hoạch 10 tuần đề xuất

Đây là lịch mặc định. Mốc 8 tuần chỉ khả thi khi golden content, Android device và signed
build sẵn sàng sớm; không đạt 8 tuần bằng cách bỏ qua backup/privacy/device gate.

| Tuần | Trọng tâm duy nhất             | Output                                                               |
| ---: | ------------------------------ | -------------------------------------------------------------------- |
|    1 | Scope freeze và baseline build | Quyết định, CI, signed preview, device/performance/store constraints |
|    2 | Golden content + readiness     | Deck 4–6 thẻ thật, media/binary budget, ẩn seed chưa sẵn sàng        |
|    3 | Data integrity                 | Status/progress thống nhất, hidden deck item an toàn, migration test |
|    4 | Native media                   | Picker, camera, mic, thumbnail, fallback và cleanup trên device      |
|    5 | Auto Play + progress           | Timeline, lifecycle, stale-session recovery và soak ngắn             |
|    6 | Backup                         | Service tests, native round-trip, low-space và rollback              |
|    7 | Privacy                        | Permission refresh, summary semantics và ba destructive actions      |
|    8 | UI + accessibility             | Visual pass, contrast, touch target, TalkBack và text scaling        |
|    9 | E2E + performance              | Maestro, device matrix, Auto Play/media soak và regression           |
|   10 | Buffer và MVP cut              | Sửa lỗi, known issues và signed internal candidate                   |

Đây là các theme tuần, không phải lý do chạy nhiều risk song song. Trong từng tuần vẫn
giữ WIP bằng một. Nếu hoàn thành sớm, dùng thời gian dư cho content và test; không kéo
feature của Beta vào MVP.

### Exit criteria MVP

- `pnpm check` đạt.
- Signed preview build cài và chạy offline trên Android thật.
- Golden flow đạt:

```text
Fresh install
→ học thẻ có media thật
→ vào Parent Zone
→ tạo thẻ custom
→ tạo deck
→ chạy Auto Play
→ xem progress
→ tạo backup
→ reset và restore
```

- Không có crash hoặc data loss trong core flow.
- Custom media xóa được và fallback đúng.
- Backup lỗi không thay đổi dữ liệu hiện tại.
- Privacy actions giữ/xóa đúng phạm vi.
- Không còn P0; P1 còn lại được ghi rõ để xử lý ở Beta.

### Chưa làm ở MVP

- Full content library.
- Public store release.
- Backend, account, cloud hoặc AI.
- Feature mới ngoài SOT.

---

## 5. Mốc Beta — Closed testing

### Mục tiêu

Biến bản MVP nội bộ thành bản đủ ổn định để phụ huynh/tester bên ngoài dùng thử mà không
cần developer đứng cạnh.

### Phạm vi

#### Content

- Mở rộng từ golden deck thành release content set.
- Tất cả 5 nhóm seed có nội dung đại diện.
- Chỉ hiển thị trong Child Mode các thẻ đạt readiness rule đã chốt.
- Mọi media public có nguồn, quyền sử dụng/consent, duration, MIME và thumbnail hợp lệ.
- Duyệt phát âm và sensory safety.

Với dự án solo, nên phát hành ít thẻ nhưng hoàn chỉnh thay vì để đủ 29 thẻ mà nhiều thẻ
chỉ có placeholder. Tạm ẩn thẻ chưa sẵn sàng là cách rollout nội bộ. Trước Beta, solo
owner phải chọn một trong hai hướng:

1. hoàn thiện bộ seed hiện hành theo `01`; hoặc
2. duyệt một release set nhỏ hơn và cập nhật `01` cùng `CHANGELOG.md` nếu quyết định đó
   thực sự thay đổi phạm vi BIZ-011.

Không được mặc định thay đổi bộ học mẫu chỉ bằng roadmap.

#### Hoạt động cuối bộ đã duyệt cho Beta

Beta bổ sung ba hoạt động local-first dùng nội dung của bộ vừa học:

1. Mini test nghe và chọn hình.
2. Ghép hình hoàn chỉnh.
3. Lật thẻ tìm cặp.

Mini test hiển thị 2/4/6 hình theo tuổi, có tối đa 5 câu ngẫu nhiên và chỉ ghi trạng thái đã làm/chưa làm ở cấp bộ. Ghép hình tự tăng 2–4 mảnh; lật thẻ tự tăng 2–5 cặp. Cả ba không thu âm, không dùng AI chấm phát âm, không có điểm tổng hoặc trạng thái đạt/rớt.

Trước khi implement lại review activities phải có migration forward-only cho tuổi hồ sơ và puzzle template, backup compatibility cho field nullable mới, rồi tách implementation theo `T-014A` đến `T-014E` trong file `08`.

#### Native hardening

- Test nhiều Android device/vendor.
- Permission granted/denied/limited.
- Background/foreground, app restart và screen lock.
- Low storage, missing file và media gần budget.
- Auto Play soak, audio overlap và memory behavior.
- Backup corrupt/incompatible/interrupted/low-space.
- Startup recovery cho orphan file và stale session.
- Dùng pass/fail budget đã chốt từ tuần 1: minimum device cụ thể, thời lượng/số lần
  chuyển Auto Play, memory behavior và kích thước backup stress.

#### UX và accessibility

- So sánh lại 5 màn reference.
- Kiểm tra contrast, touch target, TalkBack, focus order và font scale lớn.
- Ghi ngưỡng accessibility đo được trong checklist thay vì chỉ đánh giá bằng mắt.
- Parent error copy rõ, không hiện technical error cho trẻ.
- Không có toggle hoặc nút “giả” chưa có behavior.

#### Test và distribution

- Maestro flow có fixture ổn định và có thể chạy lặp lại.
- Component/integration tests cho player, media form, query states, backup/privacy service.
- Closed-test build có versioning, release notes và feedback channel.
- Điều kiện tài khoản/store, số tester, thời lượng closed test và review lead time đã
  được kiểm tra từ tuần 1 MVP và đưa vào lịch Beta.

### Exit criteria Beta

- Tất cả acceptance Required của Phase 0–1 đạt trên signed Beta build.
- Toàn bộ automated suite được duy trì đạt.
- Hai full regression run liên tiếp và device smoke đạt trên matrix/budget đã chốt.
- Không còn P0/P1.
- Không có data loss, playback blocker hoặc permission surprise trong closed testing.
- Số tester, số ngày và số core-flow completion đạt yêu cầu store hiện hành hoặc pilot
  target đã chốt, lấy điều kiện lớn hơn.
- Backup round-trip được lặp lại thành công với ảnh/video và audio nếu custom audio nằm
  trong release scope.
- Privacy policy, content/license register và store declarations đã có bản draft khớp
  với binary.
- Mini test, ghép hình và lật thẻ hoạt động offline trên signed Beta build; từ mục tiêu/audio thuộc đúng bộ, hình nhiễu ngoài bộ vẫn là asset local hợp lệ, và không gây regression Auto Play/progress/privacy.
- Các issue Beta được phân loại:
  - phải sửa trước v1.0;
  - có thể hoãn;
  - ý tưởng cho v2.0.

### Thời lượng

4–6 tuần sau MVP Candidate là baseline trước khi bổ sung ba hoạt động cuối bộ. Phải re-baseline sau khi có task breakdown/estimate; không được rút ngắn regression, device test hoặc accessibility pass để giữ mốc cũ. Nếu store yêu cầu thời gian closed testing dài hơn, kéo dài Beta.

---

## 6. Mốc v1.0 — Android production release

### Mục tiêu

Phát hành phiên bản Android đầu tiên ổn định, local-first và đúng toàn bộ scope Phase 0–1.

### Phạm vi

- Feature freeze: chỉ sửa bug và release blocker.
- Release content set đã duyệt; không còn thẻ public chỉ có placeholder.
- Production-signed AAB/APK từ đúng commit đã test.
- Audit generated artifact: target SDK đáp ứng yêu cầu store tại thời điểm submit,
  permission/manifest không có quyền ngoài scope và dependency/license được rà soát.
- Clean-install và upgrade-install regression.
- Backup compatibility từ bản Beta gần nhất.
- Final UI/accessibility/performance/device pass.
- Icon, adaptive icon, splash, screenshots, store copy và release notes.
- Privacy policy, support contact, audience/content rating và data declarations.
- Store pre-launch report và production-access requirement không còn blocker.
- Disclosure rõ:
  - dữ liệu/media lưu local;
  - app không tự upload;
  - KidEDU không thay thế chuyên gia;
  - tệp `.kidedu` dùng kiểm tra toàn vẹn nhưng không phải tệp mã hóa.
- Kế hoạch rollout, hotfix và forward-fix migration.

### Exit criteria v1.0

- 100% acceptance Required có bằng chứng.
- `pnpm check`, E2E và final device smoke đạt trên production-signed build.
- Không còn P0/P1; P2 chỉ được giữ lại khi có quyết định chấp nhận rủi ro.
- Store package khớp permission, dependency và data flow thực tế.
- Migration/upgrade test đạt, có forward-fix plan và khuyến nghị manual backup khi phù
  hợp; roadmap không tự thêm cơ chế auto-backup trước migration.
- Có thể phát hành theo staged rollout và tạo hotfix mà không phá backup/schema.

### Thời lượng

2–4 tuần sau Beta, bao gồm feature freeze, release candidate, submission và buffer sửa
lỗi. Thời gian review bên ngoài không nằm trong timebox này. Ngày public production còn
phụ thuộc quy trình review/closed-testing hiện hành của store, nên không cam kết ngày
tuyệt đối trước khi kiểm tra tài khoản phát hành.

---

## 7. Mốc v2.0 — Mở rộng có chọn lọc

### Nguyên tắc

v2.0 không phải “thêm tất cả”. Với dự án solo, chỉ chọn một theme lớn cho một chu kỳ
release.

### Hướng v2.0 được khuyến nghị

Ưu tiên tiếp tục local-first:

1. Nâng cấp Auto Play:
   - mở rộng loại mini test/game sau khi có dữ liệu Beta;
   - đảo thứ tự khi ôn;
   - trải nghiệm lặp lại tốt hơn.
2. Nhiều hồ sơ trẻ trên cùng thiết bị.
3. Bộ học mẫu nâng cao và content management tốt hơn.
4. Backup compatibility/migration được giữ xuyên suốt.

Đây là hướng phù hợp nhất với một người vì tận dụng architecture hiện tại và không tạo
gánh nặng vận hành server.

### Chỉ nghiên cứu khi có bằng chứng nhu cầu

- Chia sẻ bộ học riêng tư.
- Backend, account online hoặc cloud sync.
- Chuyên gia/giáo viên giao bài.

Các hướng trên cần proposal, cập nhật SOT, privacy model, chi phí vận hành và migration
plan riêng. Không gom chúng vào cùng một v2.0.

AI scoring không mặc định thuộc v2.0. Chỉ nghiên cứu sau khi có tiêu chí chuyên môn, dữ
liệu phù hợp và owner duyệt thay đổi nghiệp vụ.

### Entry gate v2.0

- Có dữ liệu phản hồi v1.0 chứng minh theme đã chọn giải quyết vấn đề thật.
- Scope v2.0 được cập nhật trong SOT trước khi implement.
- Migration từ v1.x, backup compatibility và rollback/forward-fix được thiết kế trước.
- Không làm suy giảm core offline learning hoặc tăng độ phức tạp vượt khả năng duy trì solo.

### Exit criteria v2.0

- Acceptance của đúng một theme v2.0 đã chọn đạt.
- Upgrade từ v1.x và backup round-trip đạt, không mất dữ liệu.
- Core offline learning, Auto Play, Parent Zone và privacy không regression.
- Automated test, device evidence và release artifact đạt gate tương đương v1.0.
- Chi phí vận hành/bảo trì vẫn nằm trong khả năng của một người.

### Thời lượng

Discovery 2–4 tuần sau khi v1.0 ổn định, sau đó 3–6 tháng cho một theme v2.0. Nếu chọn
backend/cloud, phải lập roadmap mới; không dùng ước lượng này.

---

## 8. Cách vận hành phù hợp dự án solo

### WIP limit

- Chỉ một feature hoặc một risk lớn ở trạng thái `in progress`.
- Không đồng thời sửa Auto Play, media và backup.
- Content có thể chạy song song ở mức chuẩn bị, nhưng không làm gián đoạn task code đang
  mở.

### Nhịp tuần

```text
Đầu tuần: chọn một outcome
→ giữa tuần: implement + test
→ cuối tuần: device smoke + cập nhật roadmap/known issues
```

Mỗi tuần phải tạo một output demo được, không chỉ “đã code 70%”.

### Phân bổ thời gian tham chiếu

- 50% implementation/fix.
- 30% test, device và hardening.
- 20% content, tài liệu và release work.

Trong tuần content-heavy, content trở thành outcome chính thay vì cố làm song song với
feature code. Luôn giữ khoảng 20% capacity chưa cam kết để xử lý regression, dependency
và lỗi native; tuần 10 là release buffer rõ ràng.

### Definition of Done

Một task chỉ Done khi:

- acceptance đạt;
- `pnpm check` đạt;
- có test phù hợp;
- task UI đã visual check theo `09` và ảnh reference;
- task native/media đã có device evidence;
- mutation dữ liệu có success/error/rollback;
- known risk và SOT impact được ghi rõ.

---

## 9. Thứ tự ưu tiên từ hôm nay

### Làm ngay trước MVP

1. Chốt release content set và tạo golden deck.
2. Tạo signed Android preview build.
3. Thêm CI và dependency/version check.
4. Sửa text-only Auto Play eligibility.
5. Thống nhất learning status/progress mark.
6. Bảo toàn item tạm ẩn khi edit deck.
7. Thêm stale-session recovery.
8. Chốt implement hay ẩn toggle âm khen/SFX.
9. Test native media.
10. Test native backup/privacy.

### Làm trong Beta

1. Hoàn thiện content cho đủ 5 nhóm.
2. Implement mini test nghe và chọn hình theo bộ.
3. Implement ghép hình hoàn chỉnh và lật thẻ tìm cặp.
4. Migration tuổi hồ sơ + puzzle template, backup compatibility và trạng thái mini test đã làm/chưa làm.
5. Mở rộng automated/component tests theo rủi ro.
6. Chạy device/vendor/low-storage/background matrix.
7. Accessibility và sensory-safety pass.
8. Closed testing và sửa toàn bộ P0/P1.
9. Chuẩn bị store/privacy/release package.

### Chỉ làm sau v1.0

- Multi-profile.
- Các loại mini test/game khác ngoài ba hoạt động Beta đã duyệt.
- Content pack nâng cao.
- Mọi proposal backend/cloud/expert/AI.

---

## 10. Các quyết định solo owner cần chốt

1. Golden deck gồm những từ nào?
2. Hoàn thiện toàn bộ seed hiện hành hay duyệt release set nhỏ hơn và cập nhật SOT?
3. UX explicit opt-in/readiness rule cho thẻ text-only là gì?
4. Per-asset media budget, MIME allowlist và tổng bundled-media/AAB budget là bao nhiêu?
5. Custom pronunciation audio là release blocker hay optional?
6. Âm khen/SFX được implement hay ẩn khỏi v1.0?
7. Giữ playback rate hiện tại hay thay đổi sau device test?
8. Semantics chính thức cho viewed/replayed/completed/interrupted và progress mark là gì?
9. Backup compatibility, maximum stress size và disclosure không mã hóa được chốt ra sao?
10. Parent Gate relock ở thời điểm nào?
11. Android device/OS tối thiểu là gì; iOS phát hành cùng v1.0 hay chỉ giữ compatibility?
12. Tài khoản/store yêu cầu closed testing và review lead time nào?
13. Theme duy nhất của v2.0 là Auto Play, multi-profile hay một hướng khác?

Nếu một quyết định thay đổi business, architecture, stack hoặc design system, phải cập
nhật đúng SOT và `CHANGELOG.md` sau khi được duyệt.

---

## 11. Tài liệu nguồn

- `docs/README.md`
- `docs/01-kidedu-business-sot.md`
- `docs/02-kidedu-mobile-architecture-sot.md`
- `docs/03-business-auto-play-deck-sot.md`
- `docs/04-business-parent-content-management-sot.md`
- `docs/05-tech-mobile-stack-sot.md`
- `docs/06-tech-local-data-media-sot.md`
- `docs/07-tech-performance-cache-memory-sot.md`
- `docs/08-Agent-task-splitting-sot.md`
- `docs/09-design-system-sot.md`
- `docs/10-minigame-discussion.md`
- `docs/11-minitest-discussion.md`
- `docs/CHANGELOG.md`
- `maestro/README.md`

Roadmap này không thay đổi quyết định SOT; vì vậy chưa cần cập nhật `CHANGELOG.md`.
