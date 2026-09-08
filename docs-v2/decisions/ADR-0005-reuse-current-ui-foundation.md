# ADR-0005 — Reuse current visual/UI foundation

**Status:** Accepted for v1 review  
**Date:** 2026-09-08  
**References:** `PRD-UX-*`, Design System v2, Wireframes

## Context

UI hiện có đã có visual language phù hợp và nhiều component/media behavior tốt, nhưng information architecture/domain còn card/category-centric.

## Decision

Giữ Gentle Growth palette, typography, spacing/shape, primitives, media player/import preview, two-tab navigation và parent-list pattern. Thay IA sang Today/plan/activity/progress; refactor semantics `LearningItem/Deck` và trạng thái cũ.

## Consequences

Giảm thời gian/refactor risk, giữ continuity. Phải có characterization/screenshot tests để reuse hành vi đúng mà không mang theo domain model legacy.
