# C17 — Expo SDK 57

Implements: `TA-ADR-014`, `TA-ADR-015`, `PRD-NFR-004`, `PRD-NFR-008`.

Authorization: owner yêu cầu trực tiếp nâng dự án lên Expo 57 ngày 2026-10-12.

Dependency: mobile dependency/config baseline hiện tại; Node.js 22.22+, pnpm 10.14.

Scope: nâng Expo SDK 54 → 57 và đồng bộ Expo modules, React/React Native, Router, animation và test dependencies theo SDK compatibility matrix; sửa incompatibility cần thiết.

Acceptance: lockfile tái lập được; dependency check, typecheck, lint, Jest và Metro export Android/iOS/web thành công. Native device verification là release gate riêng, không được suy ra từ Metro export.

Tests: `pnpm doctor`, `pnpm check`, `pnpm exec expo export --platform all`; Expo Doctor kiểm tra config/native dependencies.

Migration: không thay database/content schema. Native binary phải rebuild từ config cho SDK 57; build script hiện tại dùng prebuild regeneration.

Rollback: khôi phục các thay đổi riêng của C17 trên dependency/lockfile/config/source và cài lại dependency SDK 54, rebuild native binary. Giữ nguyên các thay đổi có sẵn của owner.

Out of scope: đổi UI/domain/API/backend stack, EAS OTA, crypto/IAP implementation, store release và production data migration.

## Verification notes

- Expo dependency check đạt; Expo Doctor đạt 21/21 checks. Lockfile frozen install thành công.
- Metro export Android/iOS/web thành công; native compilation/device testing chưa chạy.
- Typecheck, lint, default-media check và Jest: 51 suites / 260 tests đạt sau khi sửa pnpm transform paths.
- OpenAPI generator 7.10.1 còn khai báo peer TypeScript `^5.x`; SDK 57 dùng TypeScript 6.0.3. Đã chạy generator ra artifact riêng và xác nhận SHA-256 giống hệt `src/api/generated.ts`; không sửa generated contract hoặc nới peer range để che cảnh báo.
- Không thay PB/PRD hoặc architecture invariant. Mobile detailed spec, README/index và changelog ghi baseline SDK; các gate native/release vẫn mở.
