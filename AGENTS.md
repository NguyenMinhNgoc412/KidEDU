# AGENTS.md

Hướng dẫn cho Codex/agent khi làm việc trong repo KidEDU.

## Ngôn ngữ làm việc

- Luôn trả lời người dùng bằng tiếng Việt.
- Tài liệu, ghi chú, mô tả thay đổi và giải thích kỹ thuật nên viết bằng tiếng Việt rõ ràng, có dấu.
- Chỉ dùng tiếng Anh cho tên biến, tên hàm, tên file, API endpoint, câu lệnh terminal, log kỹ thuật hoặc thuật ngữ bắt buộc.

## Quy tắc xin phép trước khi mở rộng

Khi muốn thêm bất kỳ thứ gì mới ngoài phạm vi người dùng yêu cầu trực tiếp, agent phải hỏi người dùng trước.

Các trường hợp bắt buộc phải hỏi trước:

- Thêm tính năng mới.
- Thêm màn hình mới.
- Thêm role người dùng mới.
- Thêm API mới.
- Thêm bảng database mới.
- Thêm dependency/package mới.
- Đổi stack công nghệ.
- Đổi cấu trúc thư mục lớn.
- Thay đổi luồng sản phẩm chính.
- Thêm AI, cloud sync, payment, subscription hoặc cơ chế xử lý dữ liệu nhạy cảm.

Khi hỏi, agent phải giải thích ngắn gọn:

- Muốn thêm gì.
- Vì sao cần thêm.
- Lợi ích cho dự án.
- Rủi ro hoặc chi phí đi kèm nếu có.

Chỉ được thực hiện sau khi người dùng đồng ý rõ ràng.

Nếu thay đổi chỉ là sửa lỗi nhỏ, chỉnh chính tả, làm rõ tài liệu, format code, hoặc hoàn thiện đúng phần người dùng đã yêu cầu thì có thể làm ngay.

## Quy tắc đọc và cập nhật tài liệu

Trước khi thay đổi hoặc sửa bất kỳ phần nào của dự án, agent luôn phải đọc tài liệu theo thứ tự:

1. Đọc `docs/README_Index.md` trước để nắm thứ tự module, sprint, dependency map và file workflow chi tiết cần mở.
2. Đọc cả 2 tài liệu workflow tổng:
   - `docs/KidEDU_Frontend_Workflow.md`
   - `docs/KidEDU_Backend_Workflow.md`
3. Nếu chuẩn bị code backend theo module, đọc tiếp file module tương ứng được liệt kê trong `docs/README_Index.md`.
4. Với backend module, đọc `docs/00_Common_Conventions.md` trước file module nếu file đó tồn tại.
5. Nếu cần kiểm tra thứ tự sprint/API/dependency backend, đọc `docs/99_Roadmap_API_Checklist.md` nếu file đó tồn tại.

Mục đích là để mọi thay đổi đều bám sát thứ tự triển khai, định hướng sản phẩm, kiến trúc frontend, kiến trúc backend, nguyên tắc local-first, Child Mode, Parent Mode, privacy và roadmap MVP.

Sau khi sửa xong, agent phải cập nhật lại tài liệu tương ứng để người dùng có thể đọc lại sau này:

- Nếu sửa frontend, cập nhật `docs/KidEDU_Frontend_Workflow.md`.
- Nếu sửa backend, cập nhật `docs/KidEDU_Backend_Workflow.md`.
- Nếu thay đổi ảnh hưởng cả frontend và backend, cập nhật cả 2 file.
- Nếu thay đổi là quy tắc làm việc chung cho agent, cập nhật `AGENTS.md`.
- Nếu thay đổi nhỏ không làm thay đổi workflow, kiến trúc, API, UI, dữ liệu hoặc cách chạy dự án, agent vẫn phải nói rõ trong câu trả lời cuối rằng không cần cập nhật thêm tài liệu workflow nào.

## Tổng quan dự án

KidEDU là ứng dụng hỗ trợ phụ huynh luyện giao tiếp và ngôn ngữ tại nhà cho trẻ chậm nói. Sản phẩm không được trình bày như công cụ chẩn đoán hoặc thay thế chuyên gia âm ngữ trị liệu.

Nguyên tắc sản phẩm:

- MVP tập trung vào `Parent / Caregiver` và `Child Profile`.
- Trẻ không có tài khoản đăng nhập riêng.
- Chuyên gia trị liệu không phải app role trong MVP; phụ huynh có thể mở dashboard hoặc xuất báo cáo để chuyên gia xem.
- Video của phụ huynh phải theo hướng local-first; cloud sync chỉ bật khi phụ huynh đồng ý.
- AI nếu có chỉ là tính năng hỗ trợ luyện tập, không phải kết luận y khoa.

## Trạng thái repo hiện tại

Repo hiện tại có tài liệu lập kế hoạch và bản Web/PWA demo đầu tiên:

- `docs/README_Index.md`
- `docs/KidEDU_Frontend_Workflow.md`
- `docs/KidEDU_Backend_Workflow.md`
- `src/`
- `public/`
- `package.json`

Chưa có backend server hoặc mobile project. Bản hiện tại là Web/PWA demo chạy bằng React, TypeScript và Vite.

## Lệnh chạy dự án

Lệnh chạy bản Web/PWA hiện tại:

```bash
npm install --cache .npm-cache
npm run dev
npm run build
npm run preview
```

Trong bản hiện tại, `npm run dev` sẽ build rồi serve thư mục `dist` bằng `scripts/serve-dist.mjs`.

Trên Windows PowerShell nếu `npm` bị chặn bởi execution policy, dùng `npm.cmd`:

```bash
npm.cmd install --cache .npm-cache
npm.cmd run dev
npm.cmd run build
```

Hiện chưa có script test tự động.

Khi scaffold Expo/mobile sau này, cập nhật phần này bằng lệnh thật sự của mobile project.
Không thêm lệnh giả định vào README/AGENTS nếu package scripts chưa tồn tại.

Ví dụ nếu sau này chọn Expo:

```bash
npm install
npm run start
npm run lint
npm run test
```

## Hướng stack ưu tiên

Frontend MVP nên ưu tiên một trong hai hướng:

- Mobile-first: React Native / Expo, TypeScript, Expo Router hoặc React Navigation.
- Demo nhanh Web/PWA: React/Next.js, TypeScript, Tailwind CSS.

Backend MVP có thể đi theo:

- Node.js NestJS hoặc Python FastAPI.
- PostgreSQL cho database server.
- Object storage cho video mẫu hệ thống.
- Local storage/local DB trên client cho video phụ huynh và cache offline.

Nếu chưa có quyết định mới từ người dùng, ưu tiên mobile-first với Expo vì sản phẩm dành cho trẻ và phụ huynh dùng hằng ngày.

## Nguyên tắc frontend

Child Mode:

- Mỗi màn hình chỉ nên có một mục tiêu chính.
- Nút lớn, ảnh lớn, ít chữ, không có menu phức tạp.
- Không hiện settings, upload, dashboard, mua gói, đăng xuất trong Child Mode.
- Các hành động của phụ huynh phải nằm sau Parent Gate.
- Không hiện lỗi kỹ thuật cho trẻ; fallback sang nội dung local/cache nếu có.

Parent Mode:

- Quản lý hồ sơ trẻ.
- Quản lý video phụ huynh.
- Xem dashboard tiến độ.
- Cài đặt bài học và quyền riêng tư.
- Có chế độ xem tư vấn gọn để phụ huynh đưa cho chuyên gia xem trực tiếp.

Lesson Player:

- Ưu tiên video theo thứ tự: local parent video, cloud parent video, cached system video, online system video.
- Mặc định lặp 1 lần tốc độ thường, các lần sau chậm hơn nếu phù hợp.
- Không auto-repeat quá nhiều làm trẻ quá tải.
- Ghi learning events local trước, sync backend sau.

## Nguyên tắc backend

MVP backend nên bắt đầu từ các module:

- Auth cho phụ huynh.
- Child profile.
- Categories và word items.
- Learning sessions và learning events.
- Basic progress summary.
- Optional cloud sync cho video phụ huynh.

Backend không nên:

- Lưu đường dẫn local tuyệt đối của thiết bị như dữ liệu server dùng được.
- Bắt buộc upload video phụ huynh lên cloud.
- Tạo role chuyên gia trong MVP nếu người dùng chưa yêu cầu rõ.
- Dùng video/recording của trẻ để train AI khi chưa có consent rõ ràng.

API demo nên ưu tiên:

```http
POST /auth/login
POST /children
GET  /categories
GET  /categories/:categoryId/words?childId=:childId
POST /learning-sessions
POST /learning-sessions/:sessionId/events
```

## Riêng tư và an toàn dữ liệu trẻ em

- Dữ liệu trẻ và media riêng phải private mặc định.
- URL media cloud nên là signed URL có thời hạn.
- Phụ huynh phải có quyền xóa dữ liệu cloud và local.
- Xin quyền camera/microphone/photo library bằng ngôn ngữ dễ hiểu.
- Không public/chia sẻ công khai dữ liệu trẻ.
- Không ghi nội dung UI làm phụ huynh hiểu app là công cụ chẩn đoán y khoa.

## Quy tắc code

- Luôn đọc `docs/README_Index.md` trước khi code để biết thứ tự từng phần cần làm.
- Sau đó đọc `docs/KidEDU_Frontend_Workflow.md` và `docs/KidEDU_Backend_Workflow.md` trước khi sửa hoặc thêm bất kỳ phần nào của dự án.
- Khi code backend theo module, đọc đúng file module được chỉ trong `docs/README_Index.md`, kèm `docs/00_Common_Conventions.md` nếu file này tồn tại.
- Giữ thay đổi nhỏ, đúng phạm vi người dùng yêu cầu.
- Ưu tiên TypeScript cho frontend.
- Tách Child Mode và Parent Mode rõ ràng trong routing/state.
- Tách data mẫu, service media, tracking event và UI component.
- Local-first/offline-first là yêu cầu sản phẩm, không phải nice-to-have.
- Khi thêm dependency, phải hỏi người dùng trước, giải thích lý do và chỉ thêm sau khi được đồng ý.
- Sau khi thay đổi code hoặc tài liệu, cập nhật lại workflow tương ứng trong `docs/` nếu nội dung thay đổi ảnh hưởng tới cách hiểu hoặc cách chạy dự án.

## Kiểm tra trước khi kết thúc task

Nếu repo đã có scripts, chạy các lệnh phù hợp:

```bash
npm run lint
npm run test
npm run build
```

Nếu chưa có scripts, nói rõ trong final response rằng repo chưa scaffold nên chưa có lệnh test/build để chạy.

Với UI, kiểm tra tối thiểu:

- Text không bị tràn trên mobile.
- Nút Child Mode đủ lớn để bấm.
- Không có settings/upload/dashboard lộ ra trong Child Mode.
- Video/audio có fallback khi thiếu network.
- Parent Gate bảo vệ thao tác của phụ huynh.

## Khi tạo cấu trúc dự án mới

Đề xuất thứ tự:

1. Hỏi người dùng chọn hướng mobile-first hay web/PWA nếu chưa có quyết định.
2. Scaffold frontend theo quyết định của người dùng.
3. Đưa prototype hiện tại vào route/component demo.
4. Sửa lỗi encoding tiếng Việt.
5. Tách mock data thành file riêng.
6. Thêm Child Mode và Parent Mode.
7. Thêm local storage cho progress và video phụ huynh.
8. Sau đó mới kết nối backend.

Nếu muốn làm khác thứ tự trên, agent phải giải thích lý do và chờ người dùng đồng ý.

## Tài liệu nên tham chiếu

- `docs/README_Index.md`: thứ tự module backend, sprint, dependency map và cách dùng bộ workflow chi tiết.
- `docs/KidEDU_Frontend_Workflow.md`: quy tắc UX, Child Mode, Parent Mode, offline-first.
- `docs/KidEDU_Backend_Workflow.md`: role, API, media local-first, progress, báo cáo.
