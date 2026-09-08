# ADR-0001 — Server-authoritative activation, local learning runtime

**Status:** Accepted for v1 review  
**Date:** 2026-09-08  
**Deciders:** Product/Technical owner  
**References:** `TA-ADR-001..006`, `PRD-BR-008`

## Context

KidEDU cần backend/subscription nhưng activity không được phụ thuộc từng API call; app close/switch không reload toàn bộ và mạng chập chờn giữa prepared lesson không làm hỏng phiên.

## Decision

Server xác nhận identity/entitlement/content version; mobile giữ atomic local projection và chạy prepared lesson từ local. Cold start activation nhỏ; warm resume dùng state/grant hợp lệ.

## Consequences

Phải xây sync generation/outbox/checkpoint và test lifecycle. Đổi lại learning latency ổn định, server load thấp và vẫn giữ security authority. Không quảng bá offline mode.
