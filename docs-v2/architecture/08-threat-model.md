# Security & Privacy Threat Model

| Thuộc tính | Giá trị                                                                          |
| ---------- | -------------------------------------------------------------------------------- |
| Trạng thái | `In review`                                                                      |
| Owner      | Technical owner + Privacy owner                                                  |
| Implements | `PRD-PRIV-*`, `PRD-NOTIF-*`, `PRD-NFR-003..005`, `TA-ADR-009..010`, `TA-ADR-016` |
| Cập nhật   | 2026-09-08                                                                       |

## 1. Assets

Parent identity/token, child profile/progress, family media, subscription entitlement, premium content/keys, content publishing privilege, store/signing/KMS secrets, database/backups và operational logs.

## 2. Trust boundaries

Mobile device is untrusted; Supabase token crosses app server boundary; app server crosses Supabase PostgreSQL/Auth, Apple/Google store, R2 và KMS boundaries; Google RTDN crosses Pub/Sub; admin browser crosses app server; Cloud Run service/job identities are privileged; CI/content builder is privileged; Google Drive source is outside runtime trust.

## 3. Primary threats and controls

| Threat                          | Controls                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| BOLA đọc child/family khác      | server ownership policy at guard + service + integration tests                         |
| stolen/replayed token           | Supabase JWT/JWKS verification, TLS, expiry/revocation/rate limit, secure storage      |
| mobile bypass paywall           | server entitlement + signed grant + encrypted packs + multi-layer resolver             |
| copy DB/media to another device | account/device-bound grant, wrapped key, no plaintext premium                          |
| clock rollback                  | server time anchor + monotonic clock + cold activation                                 |
| malicious/tampered pack         | signed manifest, hash, AEAD, bounded parser, atomic install                            |
| store event spoof/replay/order  | Apple JWS/Google Pub/Sub verification, event ID, idempotency/reconcile                 |
| upload abuse/MIME bomb          | quota/rate/size, magic-byte/dimension validation, private staging                      |
| family media leak in logs       | redaction, no body/media logging, Crashlytics/log scrubber tests                       |
| admin/CI compromise             | MFA, least privilege, audit, short-lived workload identity, branch protection          |
| secret in image/repo            | secret scan, Docker scan, Secret Manager, workload identity                            |
| account switch leakage          | session close, namespace/key/cache purge ordering, E2E                                 |
| delete incomplete               | deletion workflow + R2 inventory + tombstone + audit/retry                             |
| dependency/supply chain         | lockfile, provenance, SBOM, vulnerability/secret scanning                              |
| exposed DB/provider management  | no mobile DB credential, Supabase/R2 MFA/RBAC, pooler allowlist where available        |
| free-tier pause/data loss       | dependency retry UX, daily encrypted logical dump, quota alert, isolated restore drill |
| local notification privacy leak | generic copy, local safe route only, no child/progress/media detail                    |

## 4. Abuse/privacy cases

No third-party ads, no child behavioral profiling, no raw recording analytics, no public family-media sharing và no child-targeted marketing notification. Support/admin access is denied by default and audited when explicitly granted. Content research containing PII remains ignored/local and never enters CI.

## 5. Root/jailbreak

Compromised devices can inspect runtime. Detect/risk-score when feasible, shorten grants/deny sensitive action for high risk, but do not rely solely on attestation. Document residual risk honestly.

## 6. Security verification

Threat-model review at major architecture change; automated authorization matrix; SAST/dependency/container/secret scan; API security test; mobile local-tamper test; privacy inventory; external review before public release if budget allows.

## 7. Incident priorities

Revoke/rotate credential, stop content key issuance, disable affected release/endpoint, preserve redacted audit, notify owner/users as legally required, repair and document root cause. Do not delete evidence ad hoc.
