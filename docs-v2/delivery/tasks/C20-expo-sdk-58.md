# C20 — Expo SDK 58

Implements: `TA-ADR-014`, `TA-ADR-015`, `PRD-NFR-004`, `PRD-NFR-008`.

Authorization: owner yêu cầu trực tiếp nâng dự án lên Expo 58 ngày 2026-10-30.

Dependency: C17; Node.js 22.22+, pnpm 10.14 và SDK 58 stable compatibility matrix.

Scope: nâng SDK 57 → 58, đồng bộ Expo/React Native/React và test tooling; sửa incompatibility cần thiết.

Acceptance: frozen lockfile install, dependency check, typecheck, lint, Jest và Metro export Android/iOS/web thành công. Native compilation/device verification phải được ghi riêng.

Tests: `pnpm run doctor`, `pnpm check`, `pnpm exec expo export --platform all --max-workers 1`, Expo Doctor.

Migration: không đổi database/content schema. Rebuild native binary từ source/config SDK 58; native project sinh từ SDK cũ phải được regenerate trước build.

Rollback: khôi phục riêng dependency/lockfile/config/source của C20 về baseline SDK 57, cài lại và rebuild native binary; giữ nguyên thay đổi có sẵn của owner.

Out of scope: UI/domain/API/backend, EAS OTA, native crypto/IAP implementation và store release.

## Verification notes

- `pnpm install --frozen-lockfile` thành công; Expo Doctor đạt 20/20 checks.
- `pnpm run doctor` online gặp `ECONNRESET`; chạy lại với `EXPO_NO_DOTENV=1 EXPO_OFFLINE=1` báo dependencies up to date theo matrix bundled SDK 58, kèm cảnh báo offline validation của Expo CLI.
- `pnpm check`: default-media, typecheck, lint và 51 Jest suites / 260 tests đạt.
- Metro export Android/iOS/web thành công với `--max-workers 1`; output ở `artifacts/sdk58-export/` được ignore. Lần export đầu dùng worker mặc định tiêu thụ nhiều tài nguyên và được dừng để chạy lại.
- Sửa Strict TypeScript API cho TextInput instance refs và AppState; chờ Promise của FileHandle read/write trước khi đọc kết quả hoặc đóng file backup.
- Follow-up: sửa bốn Stack.Screen ở root layout sang tên dynamic route đầy đủ (`category/[categoryId]`, `learning/[itemId]`, `autoplay/[deckId]`, `mini-test/[deckId]`). Các thư mục này không có nested layout; giữ nguyên auth/entitlement guards. Không đổi SOT/schema.
- OpenAPI generator 7.10.1 vẫn cảnh báo peer TypeScript `^5.x`; đã generate artifact riêng, SHA-256 trùng `src/api/generated.ts`.
- Prettier và relative-link scan đạt. README, mobile architecture và changelog cập nhật baseline; không thay PB/PRD hoặc architecture invariant.
- Chưa compile native hoặc test thiết bị thật. Media, backup/restore, lifecycle và subscription/crypto native vẫn cần device/release proof. Không có database migration; rollback theo hướng dẫn phía trên.
