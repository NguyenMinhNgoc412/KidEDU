# Store Release v1.0 Checklist

| Thuộc tính | Giá trị                    |
| ---------- | -------------------------- |
| Trạng thái | `In review`                |
| Owner      | Product + Engineering + QA |
| Cập nhật   | 2026-09-08                 |

Mọi mục `[BLOCKING]` phải có evidence link/owner, không chỉ tick bằng cảm tính.

## Product/content

- [ ] `[BLOCKING]` Product Brief, PRD, Architecture approved; blocking TBD closed.
- [ ] `[BLOCKING]` Activity `001..010` có content đủ, rubric và E2E.
- [ ] `[BLOCKING]` Default content provenance/license/review hoàn chỉnh.
- [ ] `[BLOCKING]` Video/audio/image/animation profiles, Vietnamese listening/lip-sync QA, static/reduce-motion fallback và FFmpeg reproducibility pass.
- [ ] Store copy không chẩn đoán/hứa điều trị/claim 80%.
- [ ] Trial, price, plans, quota/retention và support policy approved.

## Mobile

- [ ] `[BLOCKING]` Supported OS/device matrix và production signing.
- [ ] `[BLOCKING]` lifecycle, process kill, migration, low storage và account switch pass.
- [ ] `[BLOCKING]` encrypted cache không mở premium sau expiry normal flow.
- [ ] accessibility/large text/reduce motion/screen reader pass.
- [ ] EAS Free iOS Build/Submit, Gradle Android signing, TestFlight/Play staged rollout và store rollback path ready; EAS Update/OTA disabled.
- [ ] `[BLOCKING]` local notification permission, schedule/cancel, privacy copy, deep link và account-switch matrix pass.

## Backend/infrastructure

- [ ] `[BLOCKING]` Docker image non-root/scanned/SBOM; no secret.
- [ ] `[BLOCKING]` Supabase/Cloud Run/R2 staging-prod isolated; least privilege; KMS/Secret Manager configured.
- [ ] `[BLOCKING]` Daily encrypted PostgreSQL logical dump to separate R2 backup bucket và isolated restore drill pass; dump scope/auth recovery report reviewed.
- [ ] DB migration expand-compatible và rollback runbook tested.
- [ ] Cloud Run stable HTTPS ingress, revision rollback, min/max/concurrency/timeout, Supavisor/Prisma pool và cost/quota alerts configured.
- [ ] dashboards, alerts, incident contact/runbooks active.
- [ ] Supabase Auth/JWKS/custom SMTP, Firebase Crashlytics và store server credentials isolated/rotatable; no privileged key in image/mobile.
- [ ] `[BLOCKING]` Supabase Free pause/outage/quota UX tested; DB/egress 70% alert và Pro/PostgreSQL migration runbook ready.
- [ ] R2 presigned transfer, private family bucket, inventory/delete và Drive-to-R2 content publish pass.

## Billing

- [ ] `[BLOCKING]` Apple/Google agreements/products/disclosures complete.
- [ ] `[BLOCKING]` Direct Apple/Google purchase/restore/renew/grace/expire/refund/revoke sandbox pass.
- [ ] `[BLOCKING]` Apple signed notification, Google RTDN/Pub/Sub auth, idempotency và server reconciliation tested.
- [ ] paywall price/period/auto-renew/cancel/restore localized correctly.

## Privacy/security

- [ ] `[BLOCKING]` privacy policy/terms/data safety/app privacy/account deletion approved.
- [ ] `[BLOCKING]` consent, inventory, export/delete end-to-end pass.
- [ ] `[BLOCKING]` family media absent from logs/analytics/crash payload.
- [ ] authorization/BOLA/threat-model/security review passed.
- [ ] research PII not in Git/build/artifact/history audit.

## QA/release

- [ ] `[BLOCKING]` no open P0/P1; P2 risk accepted.
- [ ] critical E2E, content QA, contract compatibility and performance SLO pass.
- [ ] beta feedback triaged; support/FAQ/contact ready.
- [ ] production smoke then staged rollout monitoring/stop criteria ready.
- [ ] changelog/release notes/version/content release recorded.
- [ ] current cost model, store fees, free-tier quotas, budget alerts và Pro/VPS migration triggers reviewed.
