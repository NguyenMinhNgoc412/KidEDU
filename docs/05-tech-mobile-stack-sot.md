# KidEDU SOT 05 — Mobile Tech Stack

**Trạng thái:** SOT kỹ thuật chi tiết  
**Dự án:** KidEDU  
**Ngày cập nhật:** 2026-07-01  
**Phạm vi:** Mobile app MVP / Phase 0–1  
**Nguyên tắc:** Chốt một stack chính, hạn chế nhiều lựa chọn song song để Codex dễ implement.

---

## 1. Kết luận stack

KidEDU mobile MVP dùng:

```text
React Native + Expo + TypeScript
Expo Router
SQLite local data
Local file storage
Expo Video / Audio / Image
Zustand
TanStack Query
FlashList
Reanimated
Maestro
```

Ưu tiên Android trước, nhưng không viết code khóa cứng Android nếu có thể giữ cross-platform.

---

## 2. Core framework

| Mục | Chốt dùng | Lý do |
|---|---|---|
| Mobile framework | React Native + Expo | Phổ biến, hệ sinh thái mạnh, build mobile nhanh, phù hợp MVP |
| Language | TypeScript strict | Giảm lỗi khi data/media/business state phức tạp dần |
| Navigation | Expo Router | File-based routing, dễ chia screen, phù hợp app có child zone và parent zone |
| Runtime | Hermes | Mặc định tốt cho React Native hiện đại |
| Build | EAS Build | Chuẩn để build internal/release với Expo |
| Package manager | pnpm | Nhanh, workspace-friendly nếu sau này mở rộng |

---

## 3. Data, state và cache

| Nhu cầu | Chốt dùng | Ghi chú |
|---|---|---|
| Local relational data | `expo-sqlite` | Source of truth cho metadata, deck, item, progress |
| Key-value nhỏ | `expo-sqlite/kv-store` | Settings nhỏ, unlock state, persisted UI preference nhỏ |
| UI/session state | `zustand` | Player state, selected deck, parent UI state, temporary session state |
| Query/read cache | `@tanstack/react-query` | Cache kết quả đọc từ repository, invalidate sau mutation |
| Form state | `react-hook-form` | Form parent area |
| Validation | `zod` | Validate input trước khi ghi dữ liệu hoặc lưu media |

Quy tắc:

- Dữ liệu thật nằm ở local data layer, không nằm trong global store.
- Zustand chỉ giữ state ngắn hạn và UI/session state.
- TanStack Query dùng làm cache đọc và điều phối invalidation.
- Settings nhỏ mới dùng KV store; không lưu file media hoặc object lớn vào KV.

---

## 4. Media stack

| Nhu cầu | Chốt dùng | Ghi chú |
|---|---|---|
| Render ảnh/ảnh động/thumbnail | `expo-image` | Có cache policy, phù hợp ảnh nhiều |
| Video playback | `expo-video` | Dùng cho video khẩu hình/default/custom |
| Audio playback | `expo-audio` | Dùng cho audio phát âm, SFX, reinforcement sound |
| Chọn ảnh/video | `expo-image-picker` | Chọn từ thư viện hoặc camera flow cơ bản |
| Quay video/chụp ảnh | `expo-camera` | Dùng khi cần capture trực tiếp |
| File system | `expo-file-system` | Lưu file media vào app storage |
| Bundled default assets | `expo-asset` | Nội dung mẫu đóng gói trong app |
| Xử lý ảnh | `expo-image-manipulator` | Resize/crop/compress ảnh và thumbnail |
| Nén video | `react-native-compressor` | Để Phase 2 hoặc khi video upload gây nặng rõ rệt |

Quy tắc:

- Không lưu media dạng base64.
- Không render video trong danh sách; danh sách chỉ hiển thị thumbnail.
- Chỉ có một video active tại một thời điểm trong màn hình học/autoplay.
- Video cá nhân hóa nên giới hạn ngắn để tránh app phình bộ nhớ và storage.

---

## 5. UI, animation và list performance

| Nhu cầu | Chốt dùng | Ghi chú |
|---|---|---|
| List lớn/grid | `@shopify/flash-list` | Dùng cho danh sách thẻ, bộ học, media |
| Animation UI | `react-native-reanimated` | Animation nhẹ, mượt, tránh block JS thread |
| Vector/SVG | `react-native-svg` | Icon/shape minh họa nếu cần |
| Icon | `lucide-react-native` | Gọn, dễ dùng, phổ biến |
| Safe area | `react-native-safe-area-context` | Bắt buộc cho mobile layout |
| Gesture nếu cần | `react-native-gesture-handler` | Dùng khi cần drag/sort/gesture phức tạp |

Quy tắc:

- Animation để hỗ trợ chú ý, không biến app thành trò chơi quá kích thích.
- Reanimated dùng cho transition, progress indicator, micro-interaction.
- Ảnh động minh họa ưu tiên lightweight format; không dùng nhiều animation nặng cùng lúc.

---

## 6. Testing stack

| Nhu cầu | Chốt dùng | Ghi chú |
|---|---|---|
| Unit test | Jest + `jest-expo` | Test service, resolver, timing, repository mapping |
| Component test | React Native Testing Library | Test component và hook |
| E2E mobile | Maestro | YAML flow, dễ viết, phù hợp Android/iOS |
| Lint/format | ESLint + Prettier | Bắt buộc để code đồng nhất |

Test bắt buộc cho MVP:

1. Auto Play timing/resolver.
2. Media fallback rule.
3. Repository CRUD chính.
4. Parent Gate.
5. Progress recording.
6. E2E: phụ huynh tạo thẻ, thêm vào bộ, trẻ học Auto Play.

---

## 7. Không dùng ở MVP

| Không dùng | Lý do |
|---|---|
| Firebase/Supabase | Chưa cần backend/auth/cloud sync |
| MySQL/PostgreSQL | Cần server, không phù hợp MVP local-first |
| Redux Toolkit | Zustand đủ nhẹ cho UI/session state hiện tại |
| Realm/WatermelonDB | Mạnh nhưng tăng complexity, SQLite đủ dùng |
| Heavy UI kit | App cần UI riêng cho trẻ nhỏ, kiểm soát performance tốt hơn |
| FFmpeg mobile | Nặng, chỉ cân nhắc nếu nén/cắt video phức tạp trở thành bắt buộc |
| AI speech scoring | Không thuộc MVP, dễ sai với trẻ chậm nói, tăng chi phí |
| Backend API | Không thuộc MVP |

---

## 8. Dependency install blueprint

Khi setup, dùng phiên bản stable mới nhất theo Expo tại thời điểm implement.

```bash
pnpm dlx create-expo-app@latest kidedu
cd kidedu
pnpm dlx expo install expo-router expo-sqlite expo-file-system expo-image expo-video expo-audio expo-image-picker expo-camera expo-asset expo-image-manipulator react-native-reanimated react-native-safe-area-context react-native-svg react-native-gesture-handler
pnpm add zustand @tanstack/react-query react-hook-form zod @shopify/flash-list lucide-react-native
pnpm add -D jest-expo @testing-library/react-native @types/jest eslint prettier typescript
```

Nếu một package có native dependency được quản lý bởi Expo, ưu tiên `expo install` để tránh lệch version native.

---

## 9. Rule khi thay đổi stack

Không tự đổi stack nếu chưa được duyệt.

Muốn đổi library phải ghi rõ:

1. library hiện tại;
2. library đề xuất thay thế;
3. lý do;
4. ảnh hưởng tới code đã có;
5. ảnh hưởng tới build;
6. ảnh hưởng tới performance/memory;
7. migration plan.
