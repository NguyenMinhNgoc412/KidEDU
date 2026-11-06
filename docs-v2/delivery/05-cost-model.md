# Accounts & Operating Cost Model

| Thuộc tính | Giá trị                                                   |
| ---------- | --------------------------------------------------------- |
| Trạng thái | `In review`                                               |
| Owner      | Product + Technical owner                                 |
| Implements | `PB-BIZ-*`, `PRD-SUB-*`, `PRD-NOTIF-*`, `TA-ADR-017..023` |
| Cập nhật   | 2026-11-05                                                |

## 1. Purpose and assumptions

Đây là budget model để quyết định kiến trúc và chuẩn bị phát hành, không phải invoice/quote. Giá provider, thuế và tỷ giá có thể đổi; phải chạy lại calculator trước provisioning và mỗi quý.

Giả định:

- budget exchange rate: **1 USD = 26.000 VND**;
- API workload thấp, burst khi app open/foreground, sync, purchase/restore và store webhook;
- Cloud Run request-based tại Singapore, `min-instances=0`;
- Supabase Free cho PostgreSQL + Auth ở controlled Store Release;
- R2 Standard cho runtime object storage; media tải progressive, cache theo immutable hash, không streaming;
- Google Drive 5 TB đã có chỉ là source/master/archive, không tính là runtime delivery;
- default corpus authoring là workload content riêng, không gọi AI trong learning session;
- chưa gồm VAT/withholding/income tax, refund, support, content production, thiết bị test, công lao động hoặc transactional SMTP chưa chọn.

## 2. Accounts/resources thực sự cần

| Account/resource                  | Vì sao cần                                                                              |                                      Chi phí tham chiếu |
| --------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------: |
| Google account + Cloud billing    | Cloud Run, Artifact Registry, Scheduler, Secret Manager/KMS, Pub/Sub/Play RTDN, logging |  pay-as-you-go; initial usage có thể nằm free allowance |
| Supabase account/projects         | PostgreSQL + parent Auth cho staging/production                                         |         Free initial; Pro từ `25 USD/tháng` khi trigger |
| Cloudflare account/R2             | runtime content/family/export + encrypted DB backup                                     |                      Free allowance, sau đó usage-based |
| Firebase project                  | mobile Crashlytics only                                                                 |                                  khoảng `0` ở low usage |
| Google Play Console               | ký/phát hành Android, Play Billing/Developer API                                        |                                        `25 USD` một lần |
| Apple Developer/App Store Connect | ký iOS, TestFlight, App Store, StoreKit/Server API                                      |                                            `99 USD/năm` |
| Expo/EAS Free account             | build/submit iOS vì owner không có Mac                                                  | `0`; build quota/low-priority queue theo plan hiện hành |
| Production domain                 | website, privacy/support URLs và stable HTTPS API hostname                              |                      domain sẵn có hoặc `12–25 USD/năm` |
| Google Drive 5 TB                 | source/master/archive content                                                           |         existing owner cost; không dùng làm runtime SLA |
| ChatGPT Pro + Google AI Pro       | manual authoring/prompt/asset candidate bằng account owner hiện có                      |    existing subscriptions; không phải server API credit |
| Transactional SMTP                | Supabase Auth email verification/reset production                                       |        `TA-TBD-011`; không dùng default SMTP production |

Production bật MFA/recovery, tách staging/production credential và có break-glass record. Store/database/R2/key secret nằm trong Secret Manager, không chia sẻ qua Drive/repository/chat.

**Không thuộc baseline:** Supabase Edge Functions/Storage/Data API cho application data, RevenueCat, EAS paid/EAS Update, Sentry, FCM/APNs app push, OneSignal, SMS gateway, GCE/VPS hoặc Kubernetes.

## 3. Free-tier allowances and limitations checked 2026-09-08

### Supabase Free

- 2 active projects theo account/organization ownership limit hiện hành;
- 500 MB database mỗi project;
- 50.000 MAU;
- 5 GB egress và 5 GB cached egress;
- 1 GB Supabase Storage, nhưng KidEDU không dùng Storage baseline;
- shared CPU/500 MB RAM;
- project có thể pause sau một tuần inactivity;
- không automatic backup, PITR, uptime SLA hoặc support SLA; log retention khoảng một ngày.

Free chỉ dùng khi daily offsite dump/restore drill/quota alert hoạt động. Supabase khuyến nghị Free project tự export định kỳ; Pro có daily managed backup 7 ngày và không pause.

### Cloud Run

Free allowance request-based hiện công bố 2 triệu request/tháng, 180.000 vCPU-seconds và 360.000 GiB-seconds RAM theo cách tính free tier của Google. Artifact Registry, build, logging, outbound transfer, stable-domain ingress và secrets có billing riêng nếu vượt allowance. `min-instances=0` tránh idle instance cost nhưng có cold start.

### Cloudflare R2 Standard

- 10 GB-month storage miễn phí;
- 1 triệu Class A và 10 triệu Class B operations/tháng miễn phí;
- Internet egress miễn phí;
- vượt free: storage khoảng `0,015 USD/GB-month`, Class A `4,50 USD/million`, Class B `0,36 USD/million` theo bảng hiện hành.

Drive API standard usage không thu thêm phí nhưng Drive là user-owned file storage, không phải runtime object-storage SLA/signed-URL boundary của KidEDU.

## 4. Initial fixed monthly budget

| Thành phần                                     | Budget USD/tháng | Ghi chú                                               |
| ---------------------------------------------- | ---------------: | ----------------------------------------------------- |
| Cloud Run API/jobs                             |            `0–2` | workload thấp có thể nằm free allowance               |
| Supabase Free                                  |              `0` | chấp nhận no-SLA/no-auto-backup với controls          |
| R2 storage/operations                          |            `0–1` | miễn phí nếu trong 10 GB/operation allowance          |
| Artifact/Secrets/KMS/Scheduler/Pub/Sub/logging |            `0–3` | đặt retention/budget; usage-based                     |
| Domain amortized                               |            `1–2` | registrar tùy chọn                                    |
| **Core initial baseline**                      |        **`1–8`** | chưa gồm SMTP và ingress add-on nếu chọn loại trả phí |

Stable custom-domain ingress thuộc `TA-TBD-012`. Cloud Run direct domain mapping hiện Preview/không được Google khuyến nghị cho production; nếu chọn external load balancer phải cộng calculator cost. Firebase Hosting hoặc reviewed proxy là alternative cần POC, không được ghi `0` bằng giả định.

Core baseline trên không gồm chi phí sản xuất default corpus; khoản này được hạch toán theo content release. AI Custom Library đã vào v1 theo C50: baseline estimate cũ chưa gồm AI provider/job/ledger và free-user traffic. Phải bổ sung các khoản này trước release; không tái sử dụng số estimate cũ như total budget mới.

Google Cloud `300 USD/90 ngày` credit có thể bù Cloud Run/build/logging/POC nhưng baseline không phụ thuộc credit và credit hết hạn không bắt buộc migration.

## 5. Variable cost formulas

```text
R2 Standard storage ≈ max(stored_GB - 10, 0) × 0.015 USD/month
R2 Class A ≈ max(A_ops - 1,000,000, 0) × 4.50 / 1,000,000
R2 Class B ≈ max(B_ops - 10,000,000, 0) × 0.36 / 1,000,000
R2 Internet egress = 0 USD under current Standard pricing
Cloud Run = requests + billed CPU/RAM + outbound network - applicable free allowance
Store fee = gross revenue × applicable platform rate
```

Cache hit theo immutable hash không tạo download mới. R2 egress miễn phí không loại bỏ nhu cầu đo bytes/cache: request operations, client latency và abuse vẫn có cost/risk.

## 6. Operating scenarios

| Scenario          | Registered / MAU / paid | Stored media+backup | Delivery/tháng | Infra USD/tháng |         VND/tháng |
| ----------------- | ----------------------- | ------------------: | -------------: | --------------: | ----------------: |
| Prelaunch         | internal / <100 / 0     |              ≤10 GB |          20 GB |           `1–5` |    `26–130 nghìn` |
| Controlled launch | 1K / 300 / 100          |               20 GB |         150 GB |          `2–15` |    `52–390 nghìn` |
| Growth            | 10K / 3K / 1K           |              250 GB |         1,5 TB |         `35–90` | `0,91–2,34 triệu` |
| Scale             | 50K / 15K / 5K          |                1 TB |           5 TB |       `150–500` |    `3,9–13 triệu` |

`Growth` giả định đã nâng ít nhất Supabase Pro và trả R2 storage vượt free. `Scale` dự phòng managed PostgreSQL/API/observability lớn hơn; đây không phải capacity promise. SMTP, paid ingress và support tooling nếu chọn phải cộng riêng.

## 7. Subscription economics sensitivity

Giá chưa chốt. Ví dụ thuần sensitivity nếu chọn `299.000 VND/tháng`, giả định store fee `15%`, tỷ giá trên và chưa tính thuế/refund/content/support/SMTP:

| Paid subscribers | Gross/tháng |   Store 15% | SaaS billing fee |   Infra scenario | Còn lại trước tax/content/support |
| ---------------: | ----------: | ----------: | ---------------: | ---------------: | --------------------------------: |
|              100 |  29,9 triệu | 4,485 triệu |              `0` | 0,052–0,39 triệu |          khoảng 25,03–25,36 triệu |
|            1.000 |   299 triệu | 44,85 triệu |              `0` |  0,91–2,34 triệu |        khoảng 251,81–253,24 triệu |

Không có RevenueCat fee vì KidEDU tích hợp trực tiếp store. Google Play subscription fee và Apple Small Business eligibility phải kiểm lại khi phát hành; không mặc định 15% nếu account chưa đủ điều kiện/enroll.

## 8. Cost/reliability controls and triggers

- GCP/Cloudflare budget alerts tại 50%, 80%, 100%; alert không tự shutdown production.
- Supabase DB/egress alert tại 70% Free quota và forecast 30 ngày; không chờ hard limit.
- Daily logical backup freshness, encrypted R2 upload và quarterly isolated restore là blocking control.
- R2 dashboard tách content/family/backup storage và Class A/B operations; detect abuse/cache regression.
- Cloud Run max instances/concurrency/timeout/Prisma pool bị bound để tránh bill/DB connection explosion.
- Supabase pause/outage ảnh hưởng paying user, no-SLA/no-backup vượt RPO/RTO hoặc cần support là trigger lên Pro dù MAU còn thấp.
- Cloud Run sustained cost gần VPS tương đương hoặc cần always-on runtime là trigger benchmark VPS; user count một mình không phải trigger.
- Android build local; iOS dùng EAS Free. Chỉ mua EAS khi quota/queue cản release thực tế; không dùng EAS Update/OTA.
- Crashlytics/Cloud Logging retention được kiểm soát; chỉ thêm monitoring vendor khi có diagnostic gap đã đo.
- Store commission luôn trong financial dashboard; direct adapter có alert notification/RTDN/reconcile lag.

## 9. C50 freemium và AI v1 cost gate

V1 phải budget free active accounts/pack downloads/game reservations/reward storage cùng paid full/custom usage. AI cost = generated text/image/audio + retry được phép + job compute/dispatcher nếu chọn + private storage/backup + egress + support/moderation. Track reuse ratio, cost/job, included allowance, per-account/global hard cap và margin theo paid tier. Provider/SKU/quota theo C50-D03; amendment và pricing verification mới nằm ở mục 10. Cloud Tasks là candidate cần ADR/POC, không mặc định provision. Tạo 30–40 tranh và sticker có chi phí authoring/QA riêng.

## 10. Official pricing/reliability references checked 2026-09-08

### C50 D03 amendment — checked 2026-11-06

Owner chọn thử nghiệm Gemini AI Studio free trong developer-only harness với synthetic data; phát hành sau dùng GPT-5.6 Luna, qua quality/privacy gates. Không nối Gemini Developer API vào app trẻ em: [Gemini terms](https://ai.google.dev/gemini-api/terms?authuser=00) hạn chế API client hướng tới hoặc có khả năng được người dưới 18 truy cập. Parent Gate không tự giải quyết điều khoản này. Free-tier availability phải kiểm trong project; harness không tự bật billing hoặc chuyển paid model.

[GPT-5.6 Luna official model pricing](https://developers.openai.com/api/docs/models/gpt-5.6-luna): $0.20/1M input, $1.20/1M output. Giả định 1,000 input + 500 billed output tokens thì $0.0008/job, $0.80/1,000 jobs; đây là tính toán text-only, chưa gồm retry/reasoning vượt giả định/media/hosting/storage/review. Không chọn nano cũ chỉ theo bảng giá: [GPT-4.1 nano](https://developers.openai.com/api/docs/models/gpt-4.1-nano) đã shut down, [GPT-5.4 nano](https://developers.openai.com/api/docs/models/gpt-5.4-nano) ghi deprecated tại lần kiểm tra này.

Đề xuất chưa phê duyệt quota: 20 drafts thành công/tháng/paid account, free/trial không tạo; $5 API global/month enforced bằng server reservation ledger, không dựa billing alert; một retry có kiểm soát, chưa SKU mua lẻ. Reuse reviewed media trước generate. Budget alert không phải hard cap. Input phụ huynh không được mang child PII/family media sang provider; [OpenAI under-18 guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance) yêu cầu safeguard và ZDR trước khi xử lý personal data của trẻ dưới 13/tuổi đồng ý số áp dụng, khuyến nghị model flagship hiện hành cho trải nghiệm trẻ em. Vì vậy model rẻ chỉ là candidate cho parent-reviewed drafting, không phải kết luận compliance hoặc chất lượng; cần eval tiếng Việt và rà soát trước production.

Phần nguồn bên dưới giữ lịch sử kiểm tra 2026-09-08, không phải toàn bộ giá đã được kiểm lại ngày 2026-11-06.

- [Supabase pricing](https://supabase.com/pricing)
- [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase database connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Cloud Run custom domains](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Google Drive API limits](https://developers.google.com/drive/api/guides/limits)
- [Expo/EAS pricing](https://expo.dev/pricing)
- [Apple Developer enrollment](https://developer.apple.com/programs/enroll/)
- [Apple Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- [Google Play Console registration](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)
- [Google Play service fees](https://support.google.com/googleplay/android-developer/answer/112622?hl=en)
- [Google Cloud Vertex AI generative AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- [Google Cloud Text-to-Speech pricing](https://cloud.google.com/text-to-speech/pricing)
- [Google Cloud Tasks pricing](https://cloud.google.com/tasks/pricing)
- [Google AI plans and API billing boundary](https://ai.google.dev/gemini-api/docs/google-ai-plans)
- [ChatGPT/Codex plan usage](https://learn.chatgpt.com/docs/pricing)

Các số là budgeting estimate; provider calculator/invoice và terms tại thời điểm provision là authority. Evolution/migration nằm tại [Provider Portability & Service Evolution](../architecture/10-portability-and-evolution.md).
