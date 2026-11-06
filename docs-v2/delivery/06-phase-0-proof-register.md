# Phase 0 — Proof and decision register

> C50 target update 2026-11-05 — C50 cập nhật scope 2026-11-05: AI và free/basic thuộc v1; PRD-TBD-08 là release gate AI, PRD-TBD-09 đã đóng theo PRD-SUB-006. Các kết quả Phase 0 cũ là historical evidence, không chứng minh capability mới.

| Thuộc tính | Giá trị                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| Trạng thái | `In progress` — chưa đạt exit gate                                                                    |
| Owner      | Product/Technical owner                                                                               |
| Implements | `PRD-CONT-001`, `PRD-PRIV-003`, `TA-ADR-007..009`, `TA-ADR-012`, `TA-ADR-016..017`, `TA-ADR-020..024` |
| Depends on | [Roadmap](./01-roadmap.md), ba SOT, các spec liên quan                                                |
| Cập nhật   | 2026-11-05                                                                                            |

## Phạm vi và acceptance

Phase 0 thu thập bằng chứng để owner duyệt SOT/ADR trước khi triển khai Phase 1. Mỗi proof phải ghi thiết bị/môi trường, phiên bản, input không chứa PII, thao tác lặp lại, kết quả đo, lỗi và quyết định. Một POC chạy local không thay cho thử nghiệm staging, store sandbox hoặc thiết bị thật. Không tạo resource production trong phase này.

## Bằng chứng đã có trong repo

| Hạng mục                  | Kết quả                                                                                                                                         | Giới hạn                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline mobile           | `package.json` dùng Expo SDK 54, React Native 0.81.5, Expo Router; có Reanimated và SVG.                                                        | Chưa chứng minh crypto native, IAP hoặc lifecycle trên Development Build.                                                                                   |
| Kiểm kê public corpus     | `node scripts/phase0-corpus-inventory.cjs`: 32 file, 6,356,654 bytes; 29 JPEG (1,169,377 bytes), 2 MP4 (5,147,488 bytes), 1 MP3 (39,789 bytes). | Đây là asset legacy hiện có, không phải depth/readiness corpus v1 hay pack-size estimate. Không có canonical target audio theo từng item trong thư mục này. |
| Bundled-media preflight   | `pnpm check:default-media` pass: 2 video, 32 file, 6.06 MiB.                                                                                    | Chỉ kiểm registry/file/metadata theo preflight; chưa có FFmpeg codec/loudness, provenance, quyền dùng, human QA hoặc device playback.                       |
| Research privacy boundary | `docs-v2/giao-trinh/` trong `.gitignore`; `git ls-files docs-v2/giao-trinh` trả về rỗng.                                                        | Chưa phải audit lịch sử Git hoặc artifact ngoài repo. Không đọc nội dung nghiên cứu có PII.                                                                 |
| P0-11 code prototype      | Route `/prototype` chỉ trong development có luồng Today → overview → activity → parent observation → transfer với dữ liệu giả.                  | Đã rà soát tĩnh theo spec/screenshot; chưa có product design review, usability notes, screen-reader/large-text hoặc device evidence; P0-11 chưa pass.       |

Rà soát tĩnh P0-11 ngày 2026-09-30 theo design specs 01–04 và screenshot 01/03 đã ghi trong [task P0-11](./tasks/P0-11-critical-flow-prototype.md). Nút thoát Child Zone đã nâng lên 56pt; kiểm tra lại typecheck, ESLint và 3 test reducer đều pass. Bằng chứng này chưa thay thế thử trên thiết bị và review usability.

Web local ngày 2026-09-30: `pnpm test:web` đi hết luồng prototype trên Chromium 390×844, không có page exception hoặc horizontal overflow. Đây không phải evidence iOS/Android thật; P0-11 vẫn chưa pass.

## Proof cần hoàn tất

2026-10-12 — C15/C16 theo yêu cầu sửa review: PreparedLesson fixture + atomic observation/outbox/checkpoint, transfer và parent history đã có; browser 320/390/768px dùng Expo web SQLite thật kiểm restore sau reload, không network trong activity, retry duplicate giữ ID. Node SQLite kiểm rollback/close-reopen/concurrent writes. Account media path/resolver/sweep có unit evidence. Xem [review cập nhật](./08-sot-ui-review-2026-10-12.md). Những bằng chứng này chỉ bổ sung P0-11/local persistence; P0-01 native crypto, live provider, staging/store và các proof bên dưới vẫn chưa pass.

| ID    | Proof và acceptance tối thiểu                                                                                                                                   | Môi trường / bằng chứng cần lưu                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| P0-01 | Expo Development Build: tạo/unwrap key trong OS secure storage, AEAD encrypt/decrypt, process kill, logout/account switch và expiry không mở được pack cũ.      | iOS + Android thật; log redacted, test matrix; đóng `TA-TBD-001/003/006`.      |
| P0-02 | StoreKit 2 và Play Billing sandbox: mua, restore, duplicate/out-of-order notification, refund/revoke, account mismatch; server verify và reconcile entitlement. | Store sandbox + app server staging; transaction IDs đã redact; `TA-ADR-017`.   |
| P0-03 | Supabase Auth: login/refresh/logout, JWKS rotation và map provider subject → internal ID; không để mobile gọi Data API.                                         | Staging project và contract tests; `TA-ADR-012/016/022`.                       |
| P0-04 | Cloud Run: cold start, deploy revision no-traffic, rollback và latency activation nhỏ.                                                                          | Isolated staging, image digest, p50/p95 và runbook; `TA-ADR-020/023`.          |
| P0-05 | Prisma qua Supavisor transaction pooler: đo concurrent requests/connections và max-instance budget; migration dùng direct URL riêng.                            | Staging DB; connection/latency/error graph; `TA-ADR-012/020`.                  |
| P0-06 | Daily encrypted logical dump vào R2 và restore vào DB mới; kiểm row count/checksum, RPO/RTO và quyền truy cập.                                                  | Staging DB/bucket, restore log; `TA-TBD-002`.                                  |
| P0-07 | R2 presigned upload/download: TTL, ownership, hash/size, expired URL và resume; không log URL.                                                                  | Private staging bucket, request tests; `TA-ADR-007/016`.                       |
| P0-08 | Local notification: allow/deny, edit/cancel, timezone, reboot, logout, cold tap qua bootstrap/Parent Gate.                                                      | iOS + Android thật, device matrix; `TA-ADR-021`.                               |
| P0-09 | Media candidate: Veo mouth clip, Vietnamese human/TTS audio, deterministic FFmpeg output, Reanimated/SVG + Lottie reduce-motion; human listening/playback QA.   | Provenance/rights + reviewer sign-off + device results; `TA-ADR-024`.          |
| P0-10 | Representative curriculum fixtures → measure per-lesson/pack/media sizes and readiness by activity.                                                             | Approved anonymized fixtures and size distribution; `TA-TBD-008`.              |
| P0-11 | Critical flow prototype Today → lesson → observation → parent transfer using Gentle Growth tokens and accessibility settings.                                   | Design review and usability notes, no live child PII; `PRD-UX-*`, `PRD-ACT-*`. |

## Quyết định owner và dependency

- Ba SOT còn `In review`. Product owner cần duyệt theo thứ tự Product Brief → PRD → Technical Architecture; approval phải được ghi trong file sở hữu. `PB-TBD-01..06` gồm tên/domain, trial, giá, số hồ sơ trẻ, media quota/retention và review chuyên môn.
- `PRD-TBD-01..07` còn mở; Phase 0 cần ưu tiên content depth, session limit, export/deletion, lịch phát hành và notification cadence. `PRD-TBD-08` là gate AI v1 theo C50; `PRD-TBD-09` đóng theo PRD-SUB-006.
- `TA-TBD-001..003`, `005..012` còn mở; POC ở trên là evidence đầu vào, không tự chốt giá trị trong detailed spec.
- Cost envelope cần được owner duyệt sau khi cập nhật calculator/quote hiện hành cho ingress, SMTP, store, staging và backup. [Cost model](./05-cost-model.md) là ước tính ngày 2026-09-08, không phải báo giá hiện tại.
- Phase 0 exit chỉ đạt khi proof reports có kết quả, không còn architecture blocker, cost envelope và ADR được owner duyệt. Trạng thái hiện tại: **chưa đạt**.

## Migration, rollback và ngoài phạm vi

Không đổi schema/API/runtime; rollback là bỏ script kiểm kê và file register. Không provision provider, xuất bản media, thêm AI Custom Library hoặc dùng dữ liệu nghiên cứu định danh.
