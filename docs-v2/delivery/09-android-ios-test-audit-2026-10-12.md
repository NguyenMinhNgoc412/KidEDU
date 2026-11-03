# Android/iOS test audit — 2026-10-12

Implements: `PRD-NFR-008`, `TA-ADR-014`, `TA-ADR-015`; task [C19](./tasks/C19-android-ios-test-audit.md).

Owner selected automated testing first. Host is Windows; Expo SDK 57.0.27 / React Native 0.86.3. Only synthetic local data is used.

## Platform evidence

| Environment                  | Evidence                                                                             | Status                |
| ---------------------------- | ------------------------------------------------------------------------------------ | --------------------- |
| Mobile Jest/RNTL/Node SQLite | `pnpm check`, 51 suites / 260 tests                                                  | Passed                |
| Backend                      | `pnpm check:api`, typecheck/lint/build and 10 suites / 36 tests                      | Passed                |
| PostgreSQL integration       | `pnpm --filter @kidedu/api test:db`, 3 suites / 5 tests                              | Passed                |
| Full-access browser E2E      | `pnpm test:web:full`, live LAN API                                                   | Passed                |
| Parent/API browser E2E       | `pnpm test:web:api`, live LAN API                                                    | Passed                |
| Prototype browser E2E        | `pnpm test:web`, activity → observation → transfer → finish                          | Passed                |
| Android 16 emulator          | AVD booted, `adb devices` online and boot_completed=1                                | App execution blocked |
| iPhone native                | No Mac/iOS simulator or connected device-control tool; owner deferred manual testing | Not run               |

Android emulator initially has no Expo Go installed. Automatic approval review rejected the command to download/install the SDK 57 Expo Go APK with “blocked by policy”; no further installation attempted. Existing Maestro binary is absent. Repository Maestro flows assume unauthenticated legacy home entry and do not prove the current login-first application.

## Bugs found and corrected

- SDK 57 upgraded root TypeScript to 6. Backend inherited it but retained deprecated Node resolution without compatibility configuration, failing typecheck (TS5107).
- TypeScript 6 inferred the API package rootDir, rejecting imported mobile HTTP-client contract test files (TS6059). Explicit workspace rootDir fixes test typecheck; production src rootDir remains unchanged.
- Full-access smoke hardcoded localhost while the device setup binds API/identity to Wi-Fi IP. Test origins are now configurable, with existing localhost defaults retained.
- Prototype smoke selected a title appearing in both mounted navigation screens, causing Playwright strict-mode failure. It now waits for the unique lesson action. An initial full-access navigation timed out during cold Metro web compilation; after warming the server the same flow passed. No application logic or UI was changed to hide test failures.

Raw execution logs are ignored local artifacts: `artifacts/device-audit-mobile.log`, `device-audit-api.log`, `device-audit-api-db.log`, `device-audit-web-api.log`, `device-audit-web-full.log`, `device-audit-web-prototype.log`. Prettier, changed smoke-script ESLint and documentation link checks were also run.

## Functional coverage and gaps

| Capability                                  | Available automated evidence                                             | Native gap                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Login, restore, logout, invalid credentials | Auth component/unit tests; API/browser probes                            | SecureStore, iOS keyboard/autofill, device network                                        |
| Subscription access and expiry              | Entitlement policy/provider/timer tests; synthetic server projection     | Apple/Google sandbox purchase/restore/refund not implemented/proven                       |
| Parent Gate and account switch              | Hold/lifecycle tests, repository namespace isolation, browser navigation | Native background/process kill and cache isolation                                        |
| Learning/session/progress                   | Session engine, SQLite transaction/outbox/retry tests; prototype E2E     | All media activity renderers and signed production loader remain incomplete               |
| Family media                                | Import/permission/cleanup/resolver/account-scope tests                   | OS picker, camera/microphone, native decode/thumbnail, real files                         |
| Backup/privacy                              | Codec/round-trip/repository/action tests                                 | OS share/document picker, permissions and native deletion                                 |
| Accessibility/performance                   | Component/layout checks only                                             | VoiceOver/TalkBack, large text, reduce motion, low storage and weak hardware              |
| Packs/security/notifications                | Contract/domain checks only                                              | Signed encrypted packs/activation, corruption recovery, reminder device proof remain open |

The local prepared-lesson fixture only accepts localhost/loopback/Android emulator origins. A LAN iPhone URL intentionally does not enable it under C15. Full access is a synthetic entitlement, not proof of complete production lesson availability. No production readiness or all-native-functions pass is claimed.

## Migration and SOT impact

No database schema migration, production data mutation or product/architecture change. Revert C19-specific config/script edits to roll back. Existing native release gates remain open.
