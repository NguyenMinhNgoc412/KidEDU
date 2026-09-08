# Mobile Architecture Specification

| Thuộc tính | Giá trị                                                              |
| ---------- | -------------------------------------------------------------------- |
| Trạng thái | `In review`                                                          |
| Owner      | Mobile                                                               |
| Implements | `TA-ADR-002..010`, `TA-ADR-014..017`, `TA-ADR-021..024`, `PRD-NFR-*` |
| Cập nhật   | 2026-09-08                                                           |

## 1. Stack

React Native + Expo Development Build, TypeScript strict, Expo Router, TanStack Query, Zustand, React Hook Form/Zod, SQLite, Expo FileSystem/Image/Video/Audio/Notifications, Reanimated, `react-native-svg`, `lottie-react-native`, SecureStore, native AES-GCM module, Supabase Auth client, Firebase Crashlytics, direct StoreKit 2/Google Play Billing adapter và Jest/RNTL/Maestro. Expo SDK/framework là open-source dependency. Do owner không có Mac, EAS Free chỉ dùng build/submit iOS; không dùng EAS Update/OTA hoặc paid plan trong baseline.

Supabase client trên mobile chỉ được dùng cho Auth session. Route/screen/repository không gọi Supabase Data API, Realtime hoặc Storage; application data luôn qua generated KidEDU API client để giữ authorization và khả năng migrate provider.

Expo Go không phải target production. SDK/native dependencies được nâng cùng một compatibility matrix và runtime version.

EAS là build executor, không sở hữu product runtime. `app.config`, config plugins, native/prebuild policy, lockfile và build scripts phải version-control; Apple signing/App Store Connect account thuộc owner. Cùng source/config phải tái lập được trên local Mac hoặc macOS CI khác nếu rời EAS.

## 2. Target source layout

```text
apps/mobile/
  app/                      # routes only
  src/
    features/               # account, plan, learning, media, progress...
    domain/                 # pure client learning rules/state machines
    data/
      local/                # SQLite repositories/migrations
      remote/               # generated API client/adapters
      sync/                 # outbox, delta, generation install
    platform/               # secure store, crypto, files, lifecycle, notifications
    ui/                     # design tokens/primitives
packages/
  api-client/               # generated from OpenAPI
  content-schema/           # JSON schema/types for packs
```

Route file chỉ compose screen/use case; không chứa SQL, fetch, entitlement hoặc learning algorithm.

## 3. Dependency rule

```text
UI/routes → feature use cases → domain + repository ports
                              → platform/data adapters
```

Domain không import React Native/Expo/API/SQLite. Remote DTO được map sang domain/local model tại adapter boundary. Không share Prisma model với mobile.

## 4. State ownership

| State                                | Owner                                             |
| ------------------------------------ | ------------------------------------------------- |
| auth credential                      | Supabase Auth session/SecureStore wrapper         |
| activation grant/runtime key         | activation service + secure/in-memory key wrapper |
| server request state                 | TanStack Query                                    |
| durable projection/outbox/checkpoint | SQLite repositories                               |
| learning state machine               | domain session engine + persisted checkpoint      |
| transient UI/sheet/filter            | component/Zustand                                 |
| content/media bytes                  | encrypted pack store/file cache                   |
| local reminder schedule              | notification adapter + durable preference/IDs     |

TanStack Query và Zustand không phải durable source of truth.

## 5. Bootstrap

1. initialize crash/redaction and DB migration;
2. restore Supabase Auth session;
3. load local account namespace/generation/checkpoint;
4. call app-server activation/bootstrap;
5. verify signed grant/server time/deltas;
6. atomically activate valid generation;
7. route login/onboarding/Today/resume/error;
8. start background outbox flush/prefetch.

UI có bounded startup state; không treo splash vô hạn. Migration/activation lỗi có recovery path và correlation ID cho support.

## 6. Learning engine

Input duy nhất là immutable `PreparedLesson` đã readiness-check. Engine sở hữu activity sequence, wait/prompt/replay/pause, checkpoint và emitted domain events. Player là adapter; UI không tự chuyển activity dựa callback rời rạc.

Content update không mutate lesson đang chạy. Session end/restart mới đọc generation mới.

## 7. Entitlement guards

Guard nhiều lớp: route → lesson preparation → repository query → activity loader → media resolver → key unwrap. UI lock/paywall không phải security control. Kiểm tra lại tại session/activity boundary bằng signed grant và server-time anchor.

## 8. Persistence and concurrency

- Mỗi logical mutation dùng SQLite transaction.
- Observation + outbox event commit cùng transaction.
- Download/install chạy coordinator/mutex theo pack; không có hai writer switch generation.
- Account switch đóng player/session/query cache rồi đổi namespace.
- File cleanup chỉ chạy sau DB commit và có orphan retry.

## 9. Lifecycle

AppState adapter phát domain event. Background pause media/timer và checkpoint ngay; không chờ app close. Force-kill recovery dựa durable state. Foreground với process/grant hợp lệ resume không reload; cold start cần activation nhỏ.

## 10. Notification handling

`expo-notifications`/native adapter chỉ schedule local reminder bằng stable ID; app không lấy hoặc gửi push token. Permission chỉ được request từ Parent Mode. Notification response đi qua bootstrap/auth/current-state fetch trước navigation; không tin local route data để chọn child, entitlement hoặc object owner.

Logout/account switch hủy local reminder của namespace cũ và clear pending notification response. Permission/timezone change được reconcile idempotently. Foreground notification không tự phát âm/video hoặc mở paywall.

## 11. Existing code reuse

Giữ theme/primitives, media import/preview/permission, player behaviors, Auto Play timeline, repository/query patterns, backup archive utilities có thể dùng cho export và phần lớn tests. Thay schema `LearningItem/Deck`, seed/local-first provider, status cũ và route category-first. Mỗi phần reuse phải có characterization test trước refactor.

## 12. Error model

Adapter map lỗi về typed categories: auth, forbidden/entitlement, validation, conflict, network, storage, integrity, unsupported-version và internal. Child UI chỉ nhận safe message/action; diagnostic detail đã redact đi qua `CrashReporter`, baseline adapter gửi Firebase Crashlytics.

## 13. Test gate

Unit domain không cần native runtime; integration dùng real SQLite/temp files; component test accessibility/states; Maestro cho critical flows; device test crypto/IAP/media/lifecycle/low-storage. Không mock qua hết repository trong test sync/atomicity.

## 14. Open decisions

- native AES-GCM module sau POC;
- Expo stable upgrade target;
- Supabase Auth deep-link/session strategy với Expo prebuild;
- exact `expo-notifications` local schedule configuration qua Development Build POC;
- SQLCipher hay field-level encryption cho child projection.
