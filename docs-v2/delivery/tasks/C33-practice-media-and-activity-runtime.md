# C33 — Prepared media and ten activity types

Implements: `PRD-ACT-001..011`, `PRD-SES-*`, `TA-ADR-004/005/006`. Dependencies: C29–C31, versioned content contracts and existing LearningMediaPlayer.

Authorization: owner requested FE/BE implementation and explicitly selected existing sample content. Scope: 14 synthetic lessons covering all ten activity types; scoped local image/audio/video preparation, readiness/MIME/role checks, immutable checkpoint media and distinct interactions. Audio samples are extracted from existing bundled mouth videos with a reproducible FFmpeg recipe and provenance manifest; no Vietnamese TTS provider or production approval is invented.

Acceptance: preparation fails safely for missing/mismatched assets; no runtime network calls; naming hides audio until full-model support; cloze uses separate authored lead-in/full clips; recognition shuffles reproducibly and never converts taps to observations; both preference answers are accepted; parent rubric/transfer remain explicit. Unused image/video slots are hidden instead of showing irrelevant missing-media placeholders. Foreground/restore requires explicit session resume.

Tests: catalog/readiness/scope/MIME/prompt/recognition-order tests; full frontend checks; real local API/JWKS/PostgreSQL browser flow for seven media lessons, naming/recognition/cloze/preference and no-loop-network assertions. C32 owns final results. Native media/lifecycle evidence remains a release gate.

Migration/rollback: optional media in validated immutable prepared snapshots, compatible with previous snapshots. Keep old readers and assets for paused sessions. No server schema change beyond C29. Assets remain development-only; no signed/encrypted production pack substitute.

Out of scope: full reviewed curriculum, clinical approval, AI scoring, production publication and provider changes. Owner's sample choice authorizes testing these samples, not relabeling their provenance as approved production content.
