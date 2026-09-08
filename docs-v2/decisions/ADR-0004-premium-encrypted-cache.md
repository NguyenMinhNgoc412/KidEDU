# ADR-0004 — Premium cache does not grant access

**Status:** Accepted for v1 review  
**Date:** 2026-09-08  
**References:** `TA-ADR-009..010`, `PRD-SUB-003`

## Context

Nếu content premium lưu plaintext hoặc key vĩnh viễn, người dùng có thể subscribe một tháng, tải hết rồi tiếp tục dùng.

## Decision

Premium pack/media mã hóa per pack/version; server cấp signed activation/wrapped key có account/device/expiry. Hết quyền key runtime bị hủy và resolver khóa dù bytes còn local. Family data dùng key/ownership domain riêng.

## Consequences

Resubscribe không cần download lại, nhưng crypto/key/lifecycle phức tạp hơn và cần native POC. Không chống tuyệt đối rooted device; residual risk được công bố.
