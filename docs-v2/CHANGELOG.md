# Documentation v2 Changelog

## 2026-11-09 — Local testing và drag acceptance

- Sửa tải ảnh C50: chuẩn bị unique session artwork trước board, concurrency tối đa ba; dùng nguồn local chung cho SVG/Expo Image, web giữ blob URL để tránh Metro tải lại. Identity được kiểm lại sau await; server authorization vẫn độc lập. Full browser flow xác nhận 12 artwork resources và 0 byte tải thêm giữa vòng; regression/giới hạn/migration tại C50 mục 26. Không đổi product/stack/schema hoặc bật production pack.

- Sửa lỗi kéo đúng ô nhưng không nhận khi cầm lệch hình: dùng tâm khung hình cùng hệ tọa độ window với target, giữ translation đến khi đo xong để tránh origin bị dịch trong lúc kéo nhanh. Callback gesture cũ không tác động lần kéo mới; fallback dùng release page coordinates khi không đo được. Regression/evidence/rollback tại C50 mục 25, không đổi schema/quota/inventory.
- Sửa cấu hình test sau đổi Wi-Fi: cập nhật hai local service origins trong `.env`, restart Metro để loại bundle còn IP cũ. Local authenticated API và browser fullaccess/account-switch smoke đạt; thêm runbook API, không đổi credential hoặc dữ liệu gia đình.

## 2026-11-07 — Fullaccess local QA

- Theo phản hồi owner, memory mismatch tự úp nhanh hơn: 1,2s → 0,6s; giữ 2,4s cho screen reader và các pause/unmount guards. Không đổi checkpoint/quota hoặc thời gian feedback trò chọn hình.

- Thêm feedback đúng/sai tại tile nghe chọn, finite 900ms presentation trước chuyển lượt và cuối game. SQLite commit ngay; pause/background hủy delayed frame, không replay effect. Giữ Reduce Motion/khích lệ và accessible announcement. PRD/design và C50 mục 24 cập nhật; không đổi API/quota hoặc thêm judgement score.

- Sửa bóng khuyết theo yêu cầu owner: bỏ các bóng vẽ chung/sai vật, bổ sung 12 contour và dùng chung geometry/crop tĩnh cho hình kéo và bóng. Năm PNG trace alpha, bảy hình scene có vector clipping riêng; silhouette tô đặc theo theme, giữ drag/accessibility/lifecycle. PRD-GAME-003/design và C50 mục 23 ghi acceptance/evidence; không đổi backend/quota hoặc publish corpus mới.

- Theo yêu cầu owner, synthetic fullaccess có entitlement dài hạn, bỏ Parent Gate hold và mở phiên thử mới trong ngày. Guarded local-only endpoint retire metadata phiên completed nhưng giữ owned inventory/learning history; SQLite archive day index để nhận session mới, không đổi schema. Account switch và production/tài khoản thường giữ boundary. PRD/API contract/OpenAPI/generated client và C50 mục 22 cập nhật; không bật AI hoặc coi các capability còn thiếu là đã triển khai.

## 2026-11-06 — C50 local daily-game engine

- Owner sửa UX: board cố định, Back rõ ràng và chặn vuốt thoát; hình/thẻ lớn responsive, cặp sai tự úp. Hoàn tất tự đồng bộ, chỉ server ACK mới mở quà; nhận xong tự về Trò chơi đã hết lượt. Cập nhật PRD-GAME-003/REWARD-001, wireframes và accessibility; mobile Node 82 suites/383 tests, native 8 suites/23 tests, browser phone/tablet/landscape đạt. Evidence/rollback và giới hạn device QA tại C50 mục 21; không đổi schema hoặc mở AI.

- Owner hoãn AI, tiếp tục manual/free-learning và toàn bộ phần ngoài AI. Nối durable local daily-game → completion sync → reward recovery/claim → album sáu mảnh; thêm pin hộp SQLite, parent profile editor và UI ít nhiễu. Local adapter bị chặn ngoài APP_ENV local; production content/activation còn gate. Sửa rapid-input commit race, SVG warning và empty album. Evidence, migration/rollback và remaining tại C50 mục 20; không ghi C50 complete/release-ready.

- Nối account-specific daily SQLite provider vào AppProviders và thêm session coordinator/account runtime: action commit local, boundary flush/reconcile, đóng prepared leases khi đổi child/account. Access/reset assertion bên trong transaction rollback cả checkpoint/outbox nếu hết quyền lúc ghi. Full mobile Node 79 suites/370 tests và native component 5 suites/12 tests đạt. Signed-pack preparation adapter và production daily-route cutover còn thiếu; preview vẫn không lưu tiến độ. Evidence/rollback tại C50 mục 19.

- Sửa entry local gây nhầm: thay card chứa daily CTA disabled + preview CTA phụ bằng nút chính “Vào chơi thử”, vẫn đi qua Parent Gate. Không expose preview ngoài local boundary; daily production CTA chưa ready giữ khóa. Native hub tests và web toàn luồng qua entry mới đạt; C50 mục 18 cập nhật.

- Thêm bản thử local ba trò tại `/parent/game-preview`, mở từ tab Trò chơi qua Parent Gate hoặc menu phụ huynh. Dùng C50 engine với kéo thả bóng, năm lựa chọn và năm cặp; không gọi daily mutations, không quota/reward. Native interaction tests và browser touch-drag flow đạt; phần nghe bản thử do người lớn đọc, chưa production gameplay. Xem C50 mục 18.

- Sửa môi trường test C50: API Docker cũ thiếu daily-game routes (404), database local thiếu ba migration. Sao lưu local trước thay đổi, áp dụng migration additive và cập nhật image; status/inventory authenticated smoke đạt HTTP 200. Thêm `scripts/local-daily-game-smoke.cjs` và hướng dẫn API local; evidence tại C50 mục 17. Không bật gameplay hoặc AI production.

- Nối bốn tab và chuyển album cũ sang Bộ sưu tập; entry Cùng luyện giữ trong Tập nói. Tách owned-inventory reads khỏi catalog/subscription/plan; parent tab đi qua Parent Gate. Thêm SQLite server-wins reconciliation giữ bản local khi conflict. Chưa mở daily-game renderer/content pipeline; evidence và remaining tại C50 mục 16.

- Thêm dedicated-account SQLite daily checkpoint/outbox và boundary flush; giữ payload đang chờ ACK và tiến độ mới để retry không ghi đè. Real SQLite rollback/reopen/isolation/lost ACK tests đạt; chưa nối native coordinator. Evidence tại C50 mục 15.
- Sau owner cấu hình key local, Gemini internal synthetic live smoke trả đúng năm từ, không publish. Secret file Git-ignored; không mở billing. Một live smoke không thay human evaluation/production readiness.

- Thêm reward reservation/inventory/receipt transaction và guarded daily-game HTTP/OpenAPI/generated client; default content resolver unavailable, không tiêu lượt khi thiếu published content. Checkpoint retry lost ACK và claim cross-device idempotency có regression coverage; migration chỉ database test. Evidence/rollback tại C50 mục 13.
- Owner chọn Gemini AI Studio free cho internal synthetic experiment, GPT-5.6 Luna dự kiến khi phát hành. Thêm standalone smoke harness không nối app/runtime; live synthetic smoke đã chạy thành công sau owner cấu hình key; không publish. Quota/budget/dispatcher còn gate; cost/terms references cập nhật, không tự bật billing. Xem C50 mục 14.

- Thêm domain engine local cho ba trò theo prepared plan: wrong answer không mất lượt, restore checkpoint, round-bound actions và delayed memory-close guard. Không API trong activity loop, observation hoặc reward authority. Chưa cutover UI/persistence; evidence/remaining tại C50 mục 12.

## 2026-11-05 — C50 quyết định bổ sung và policy foundation

- P2 thêm persistence daily session với unique child/day, transaction ownership lock, tier/plan pin và checkpoint CAS/monotonic validation; migration chỉ áp dụng database test riêng. Chưa expose HTTP/cutover mobile hoặc cấp entitlement/reward. Evidence và rollback tại C50 mục 11.

- P1 thêm prepared daily-game plan/checkpoint schema v1 và semantic restore validator; kiểm độ dài basic/full, ba lựa chọn nghe, sequence và reference/version, không observation. Chưa nối daily-session persistence hoặc game UI; sáu contract tests đạt.

- P1 profile slice: nullable parent-entered gender, additive Prisma migration, guarded/versioned Family API và OpenAPI/generated client; form development yêu cầu chọn rõ. Chặn phản hồi cũ sau account/child switch. Thêm native-component test configuration; migration và concurrent profile writes đã kiểm trên PostgreSQL test riêng, chưa deploy production hoặc hoàn tất daily-game runtime. Evidence/rollback tại C50 mục 9.

- Owner đổi reset từ 08:00 sang 00:00 theo `Asia/Ho_Chi_Minh`; hủy quà chưa nhận khi reset, giữ receipt đã xác nhận và đồng bộ cùng phiên giữa thiết bị.
- Free là năm bộ hiện có (Gia đình, Nhu cầu cơ bản, Đồ vật quen thuộc, Con vật, Hành động); trial không tạo bộ. Nhập giới tính cùng tên, không suy diễn; chỉ nhận món mới, khóa loại hết và hiển thị số còn lại.
- AI tạo khoảng năm từ theo gợi ý phụ huynh; chưa đóng quota/fee/provider/dispatcher. Đồng bộ PB/PRD/TA, ADR-0010, task, test/release/subscription và AGENTS; không thay baseline stack hoặc tự publish content.

## 2026-11-05 — C50 owner-approved scope

- Tạo task tổng C50 P0–P10, dependency/acceptance/tests/migration/rollback/out-of-scope và decision gates. Đây là documentation/planning, không runtime/provisioning.
- Chuyển bốn tab, nhận xét chỉ Tập nói; một phiên ba trò/ngày reset 08:00, free/paid khác độ dài; hết lượt vẫn mở tab với CTA disabled. Một quà sau ba trò, bốn hộp chọn một, catalog gender-fixed mở rộng.
- Free/basic lâu dài + paid/full và tạo bộ thủ công/AI v1; thay post-release và trial-only policy. Quota/pricing/provider/dispatcher chưa tự chốt. Cập nhật ba SOT, spec/design/architecture/contracts/delivery/cost/release gates, README và AGENTS; ADR-0010 supersedes ADR-0009. Giữ lịch sử implementation và dữ liệu C49.

## 2026-11-05

- C49 theo y?u c?u tri?n khai c?a owner: qu? hai lo?i ? m?t box ? receipt b?n v?ng, 18 sticker/ba ch? ?? v? hai tranh/b?n m?nh, local checkpoint + sync inventory. Th?m chu?ng ch?c m?ng g?c 950ms theo c?i ??t ?m hi?u; kh?ng ??i observation, entitlement ho?c SQL. Ph?n audio t? v? c?c m? r?ng C48 ch?a tri?n khai. Xem [C49](delivery/tasks/C49-reward-choice-and-completion-chime.md).

- Owner chỉnh C48 Draft: bé chọn 1 trong 2 loại Mảnh ghép/Sticker, sau đó chạm mở một box random đúng loại. Thay random loại 50/50, ba hộp và tự nhận thưởng; choice/box/reveal có checkpoint để resume đúng bước, mở lặp không cấp thêm. Chỉ cập nhật plan.

- Owner bổ sung C48 Draft: nhiều collection sticker Động vật/Siêu nhân/Công chúa và mảnh ghép hoàn thành tranh, nhận random theo pool sở thích, assignment ổn định qua resume/sync. Preset theo giới tính là gợi ý có thể đổi; nhận mảnh tự hiện preview, chơi ghép trong album là tùy chọn. Chưa triển khai runtime hoặc tạo asset.

- Thêm C48 Draft theo yêu cầu lập plan tiếng đọc từ và thưởng giữa trò: audio theo target/role, playback không chồng tiếng, nhịp tự chuyển C47, receipt thưởng idempotent và một collection pilot. Chỉ lập kế hoạch FE/BE/content/QA; chưa đổi runtime/contract/schema, tạo asset hoặc duyệt production content.

- C47 owner correction: presentation game hoàn tất tự chuyển trò/bài sau feedback ngắn; bỏ bước “Đã tạo cơ hội”/chờ/xác nhận giữa bài, giữ Parent Gate và nhận xét từng bài ở cuối toàn phiên. Bộ 5 từ tự chuyển trò và sau chọn quà; completion tách observation, dùng checkpoint/entitlement boundary hiện có, không schema/API/SQL mới.

- C46 khóa cuộn Screen khi DragPiece nhận gesture; mở lại sau thả/hủy/pause/unmount, lock theo owner để không bị cleanup cũ mở nhầm. Thêm web touch-action và native responder guard; giữ nguyên ScrollView/vị trí và không đổi API/checkpoint.

## 2026-11-04

- C45 owner correction: các presentation game dùng kéo thả trực tiếp, riêng mở/lật thẻ giữ chạm. Bỏ nút chọn/đặt và tap-to-select; sai về nguồn, đúng giữ tại đích; shared drag/drop guards cho pause/unmount/reduce motion. Tìm hình bộ 5 từ thành kéo vào hình mẫu, giữ checkpoint v1. Không SQL/API migration; backend metadata chuẩn bị được chỉnh theo cơ chế kéo.

- C44 theo owner review phụ huynh: bộ mẫu 5 từ dùng ảnh một chủ thể, atlas trong suốt 4 frame và bóng khuyết tương ứng; thêm modal hướng dẫn đầu từng trò, chạm để đóng, giữ board pause khi mở. Không đổi BE/checkpoint; audio và nâng cấp bộ sưu tập để sau, không thay độ khó/timing memory.

- C43 sửa pattern review: lưu progress từng thao tác trong game vào SQLite/checkpoint JSON, khôi phục sau pause/reopen/cloud sync; server giữ phần đã hoàn tất. Thêm artwork timeout/static fallback và retry trong pause; tách renderer/rules/step registry khỏi controller. Không SQL migration, dependency/provider mới hoặc tự tạo observation.

- C42 sửa design review: skip vào màn pause, gấu có viền rõ, chuẩn hóa spacing/radius/game geometry, GameControl chung trạng thái nhấn/khóa với KidButton và tên/announcement screen reader bằng tiếng Việt. Không đổi API/SQL, palette, billing hoặc reward data.

- C41 theo yêu cầu owner: bỏ chữ khỏi ô chơi, memory sai tự úp 350 ms, hình mẫu tìm hình, kéo trực tiếp vào toàn bộ bóng khuyết, sprite nhẹ từ frame có sẵn. Thay quà dạng chữ bằng ba hộp chọn; thêm `gameStickers` checkpoint và album DISTINCT local/server theo child qua tất cả phiên, không giới hạn theo 30 checkpoint resume. Không SQL migration, dependency/provider mới hoặc tự tạo observation.

- Owner xác nhận trẻ chơi trực tiếp, nhiều trò dùng cùng bộ từ trong một bài, có sticker/quà/hành trình. C40 cập nhật PB/PRD/product08, thay giả định neutral-only cho bộ trò mới: bài mẫu 5 từ × 3 trò, lưu hoàn tất trò qua checkpoint local/API JSON; không SQL migration. Chương/album xuyên phiên được lập kế hoạch riêng, chưa triển khai.

- Theo yêu cầu làm đa dạng hoạt động từ product 08, C38/C39 thêm 13 tình huống mẫu với 7 cách chơi: ghép đôi, phân loại, xếp chuỗi, ghép lời, mở ô tìm đồ, kịch tương tác và chia lượt. Tái dùng activity types, hình có sẵn, schema presentation có kiểm tra và runtime local; không chuyển thao tác thành đánh giá năng lực. Giữ chọn bài theo C37 và nhận xét cuối phiên theo C36. Không đổi provider, SQL schema hoặc gate nội dung production/native.

- C37 bổ sung editor bài trong phiên qua Parent Gate: thêm/bớt, chọn/bỏ tất cả và đưa bài lên/xuống; lưu danh sách có thứ tự bằng `PracticeDocument.lessonIds`. Danh sách rỗng không tự biến thành toàn bộ bài. Phiên đã chuẩn bị giữ snapshot; thay đổi dùng cho phiên mới. Không cần SQL migration, không xóa lịch sử hoặc sửa observation đã ghi.

- Theo yêu cầu sửa luồng của owner, C36 chuyển Cùng luyện sang một phiên nhiều bài: học liên tiếp, rồi Parent Gate và nhận xét riêng từng bài ở cuối phiên. PRD/activity/adaptation/IA cập nhật; checkpoint JSON bổ sung danh sách bài, bằng chứng lượt học và review cursor, giữ dữ liệu cũ. Không đổi provider, không tự chấm kết quả hoặc tạo observation transfer chưa diễn ra.

## 2026-11-03

- Owner chọn dùng nội dung mẫu: C33 mở rộng 14 bài phủ 10 loại hoạt động và chuẩn bị media local theo role; C34 thêm editor/binding media gia đình theo trẻ–target–activity, SQLite v3; C35 thêm lịch sử phân trang/lọc mục tiêu/ngữ cảnh. Giữ fixture development-only, dữ liệu gia đình ngoài paywall và gate signed/encrypted production pack/native QA; không đổi provider hay các TBD chuyên môn.

- Theo yêu cầu owner, C29–C31 thêm tab Cùng luyện, hub/goal plan/preparation, Nest practice APIs và hai bảng PostgreSQL tách khỏi LearningPlan; nối checkpoint/observation sync ngoài activity loop. IA chuyển ba tab; không đổi provider/architecture invariant. C32 phân biệt guided flow đã chạy với media/activity/family-binding/production/native coverage còn thiếu; không coi toàn bộ plan đã hoàn tất.

- Theo yêu cầu owner, lập kế hoạch Cùng luyện thành tính năng riêng cạnh Học: đề xuất ba tab, luồng buổi luyện, coverage activity và delivery theo boundary. Đây là plan Draft; IA hai tab hiện tại và runtime chưa đổi, các TBD/content/security release gate vẫn giữ nguyên.

- Theo yêu cầu owner, C26–C28 triển khai catalog mẫu theo goal, hướng dẫn/observation cho yêu cầu một–hai bước, lựa chọn/từ chối và gợi ý luyện tiếp có giải thích. Giữ fixture development-only, checkpoint cũ và các TBD mastery; không đổi schema/API, production corpus, signed activation hoặc entitlement.

- Thêm đề xuất `In review` điều chỉnh bản mô phỏng giáo trình lớp học sang goal/target/lesson, parent observation và transfer theo v2. Đối chiếu các giả định khác SOT về lĩnh vực, bậc, tự chấm, thưởng và quyền truy cập; không đổi SOT, taxonomy, architecture hoặc runtime.

## 2026-10-30

- C25 thêm bộ chọn ba bài trải nghiệm ở khu phụ huynh, lưu lựa chọn theo hồ sơ/account và giữ checkpoint riêng khi đổi bài. SQLite fixture lên v2; không thay kế hoạch server, production corpus hoặc entitlement.

- C24 tích hợp Today → bài học có lưu → ghi nhận → thử trong sinh hoạt thành một luồng giao diện Gentle Growth, bỏ lối vào prototype trùng lặp. Fixture trên LAN riêng cần opt-in development; không thay production readiness, identity hoặc entitlement.

- C23 nối 29 bộ frame mẫu vào learning player, bổ sung ảnh ba/mẹ và hiển thị bundled still trực tiếp. Animation hữu hạn trước canonical speech, có static/reduce-motion/lifecycle fallback; không đổi production entitlement hoặc content publishing gate.

- C21 sửa login treo khi local endpoint không phản hồi: deadline/abort cho identity và app-server request, lỗi an toàn cho retry và regression tests. Không đổi identity authority, API contract hoặc entitlement guard.

- Theo yêu cầu owner, nâng mobile baseline SDK 57 → 58 và đồng bộ Expo/React Native/React/test dependencies theo compatibility matrix chính thức. C20 ghi verification và native rebuild gate; không đổi product scope, provider hoặc architecture invariant.

## 2026-10-12

- C19 kiểm tra tự động sau SDK 57, sửa TypeScript 6 backend test/build compatibility và cấu hình origin cho full-access smoke. Báo cáo tách automated/browser evidence khỏi Android/iPhone native proof; release gate không đổi.

- C18 sửa cấu hình test đăng nhập Expo Go trên thiết bị thật: opt-in LAN bind cho identity/API local và hướng dẫn hai endpoint dùng địa chỉ Wi-Fi máy tính. Không đổi production identity hoặc database schema.

- Theo yêu cầu owner, nâng mobile baseline từ Expo SDK 54 lên SDK 57, đồng bộ React Native/React và Expo native/test dependencies. Ghi compatibility/build gate tại mobile architecture và task C17; không đổi product scope hoặc native crypto/IAP acceptance gate.

- C15 triển khai luồng fixture Today → PreparedLesson → functional communication → SQLite observation/outbox/checkpoint → parent transfer → retry sync/history. Chỉ backend local, không dùng corpus giả làm production Ready; R01 vẫn còn media activities/production loader.
- C16 tách media mới theo account, chặn URI scoped của account khác và giới hạn orphan sweep. Chưa thay encrypted pack/key policy, không khóa dữ liệu gia đình theo subscription.

- Ghi các sửa lỗi C11–C14 từ review: autoplay hữu hạn, hold Parent Gate/lifecycle, touch target/contrast/selected state, auth refresh, Android local build và Today đọc plan theo hồ sơ. Không đổi SOT hoặc tự chốt TBD.
- Production learning tạm khóa vì projection chưa thay thế signed activation/encrypted packs; R01/R02 và native/release proof vẫn mở trong báo cáo review.

- Tổng hợp PB/PRD/TA TBD v1 vào owner-input checklist để owner bổ sung sau; giữ nguyên trạng thái SOT và Post-release boundary.
- Ghi task C10 sửa local entitlement timer cho quyền dài hơn giới hạn timer JavaScript; không thay contract, schema hoặc activation architecture.

## 2026-09-29

- Owner xác nhận giữ taxonomy `targetType` sáu loại và `activityType` mười loại đang dùng trong content contract v1; bổ sung sau phải qua schema version/compatibility review. Quyết định này không đổi trạng thái `In review` của ba SOT hoặc chốt các TBD khác.

## 2026-09-08

- Giữ tên sản phẩm KidEDU.
- Thiết lập ba SOT gốc: Product Brief, PRD và Technical Architecture.
- Chuyển định vị từ MVP thẻ từ/local-first sang Store Release v1.0 hỗ trợ progression giao tiếp tiếng Việt.
- Chốt subscription/trial, không third-party ads, server-authoritative activation và encrypted progressive lesson packs.
- Chốt client-heavy learning domain nhưng có Docker app server riêng làm security/data boundary.
- Chọn mobile React Native/Expo; backend Node.js/NestJS/Fastify/Prisma và PostgreSQL.
- Chốt baseline low-workload production: Cloud Run scale-to-zero chạy Docker app server, Supabase Free cung cấp PostgreSQL + Auth, R2 giữ runtime media/backup; Google Drive chỉ source/master/archive.
- Supabase Free được chấp nhận cho controlled Store Release với quota alerts, daily encrypted logical backup ngoài Supabase và restore drill; nâng Pro hoặc migrate PostgreSQL theo reliability/quota trigger, không chờ tới khi outage.
- Giữ stable KidEDU API contract, OCI image, standard PostgreSQL và provider adapters để chuyển Cloud Run sang VPS, Supabase sang PostgreSQL khác và R2 sang S3/GCS mà không đổi learning domain/mobile contract.
- Thu gọn notification v1 về local-only; không FCM/APNs app push, push token hoặc notification backend. Server state cập nhật qua open/foreground sync.
- Chốt Supabase Auth email/password + Google/Apple, loại phone OTP khỏi v1; default SMTP chỉ dùng development, production email cần provider/domain configuration riêng.
- Loại RevenueCat; backend tích hợp trực tiếp Apple/Google subscription để tránh account/data boundary và 1% MTR.
- Giữ Expo SDK/framework miễn phí; do owner không có Mac, dùng EAS Free chỉ để build/submit iOS, Android build local. Không dùng EAS Update/OTA hoặc paid plan trong baseline.
- Loại Sentry; Firebase chỉ còn dùng Crashlytics cho mobile, backend dùng Cloud Logging/Error Reporting.
- Thêm account inventory và cost model chỉ gồm service thực sự cần.
- Thêm option ladder từ free-tier serverless/EAS Free tới Supabase Pro, VPS cost-optimized, managed DB và HA; quy định provider ports/data migration để thay dịch vụ mà không đổi learning domain/API contract.
- Thêm product, design/wireframe, architecture, contract, delivery specs và ADRs.
- Giữ/reuse Gentle Growth design system và UI foundation hiện có; thay information architecture card/category-centric.
- Đưa research DOCX chứa PII vào `.gitignore` và ghi rõ không được commit/distribute.
- Chốt media production: Veo 3/Veo 3.1 chỉ tạo candidate mouth video; canonical audio ưu tiên giọng người Việt, Google Cloud TTS `vi-VN` tạo candidate; FFmpeg normalize deterministic; Reanimated/SVG + Lottie là animation baseline có static/reduce-motion fallback.
- Cho phép ChatGPT/Gemini/Codex tạo candidate/code/tooling nhưng không auto-publish; ghi rõ ChatGPT Pro/Google AI Pro không phải API automation credit và mọi asset phải có provenance/rights/modality QA.
- Ghi nhận thiết kế AI Custom Library nhưng chuyển toàn bộ sang `Deferred — Post-release`; không thuộc `Must`, v1 stack, account/cost baseline, release gate hoặc implementation backlog trước Store Release v1.0.
- Giữ candidate architecture phase sau: private pack có parent preview, PostgreSQL job/credit ledger, Cloud Tasks/Cloud Run và Gemini + Google Cloud TTS adapters; các thành phần này chưa được provision/implement trong v1.

## 2026-09-07

- Tạo `docs-v2` tách khỏi legacy `docs` để review/so sánh.
- Tổng hợp insight ẩn danh từ giáo trình thực tế và market desk research.
