# ADR-0003 — Progressive signed lesson packs

**Status:** Accepted for v1 review  
**Date:** 2026-09-08  
**References:** `TA-ADR-004..008`, `PRD-SYNC-*`

## Context

Metadata nhẹ, một số mouth video nặng; không nên sync toàn thư viện hoặc tải trong từng activity.

## Decision

Sync catalog index/delta nhỏ, download current lesson pack và prefetch mặc định hai bài. Media content-addressed, durable local; pack signed/encrypted và atomic install theo generation.

## Consequences

First-use nhanh, reuse media và scale content tốt. Cần manifest, pack builder, readiness, storage UI và recovery test.
