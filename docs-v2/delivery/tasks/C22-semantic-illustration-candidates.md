# C22 — Semantic illustration candidates

Implements: `PRD-BR-005`, `PRD-UX-*`, `TA-ADR-017`; content production specification sections 5–8.

Authorization: owner requested animated illustrations and selected semantic character/object motion on 2026-10-30.

Dependency: existing Gentle Growth illustration references; image generation tool; content/editorial review before default publication.

Scope: complete review batch for all 29 words in `src/data/seedData.ts`, eight poses each (232 frames), following owner's request to extend the first three examples. Built-in `image_gen` edits the existing synthetic reference illustrations; ba/mẹ use a style reference to create the missing parent illustrations. Standalone local review gallery demonstrates finite playback, pause/replay, reduced motion, static fallback, Vietnamese accent-insensitive search and group filtering. Candidate sheets, exact prompts, SHA-256 hashes and pending review status are retained outside runtime assets and Docker build context.

Acceptance: all 29 candidate sheets render in the gallery; playback stops after one three-second sequence; pause/replay and reduced-motion/static fallback work; search/group filters work; small-screen gallery does not overflow. Owner reviews semantics/consistency before integration. All sample words have candidates, but app default media remains unchanged.

Tests: `node scripts/check-illustration-review.cjs`, targeted ESLint, Prettier, reference/hash checks. Browser verification runs using `file://`; no local server or port is opened.

Migration/rollback: no database/content schema or runtime change. Remove the C22 candidate folder and review script to roll back. Original illustrations remain unchanged; assets are not published or marked reviewed.

Out of scope: production publishing, runtime/default library replacement before editorial review, family media, mouth-video/audio replacement, provider provisioning and AI Custom Library runtime.

Artifacts: [review gallery](../../../content-candidates/illustrations-v2/review.html), [provenance](../../../content-candidates/illustrations-v2/manifest.json), [prompts](../../../content-candidates/illustrations-v2/prompts.json), [notes](../../../content-candidates/illustrations-v2/README.md).

Observed limitations: generated sheets may have fractional cell boundaries; exact dimensions are recorded in the manifest. Deterministic frame normalization and device/performance checks remain before integration. Visual inspection of beginning/middle/end poses across all 29 words found usable semantic sequences with some generated gesture lines and subtle face/backdrop drift to review. This does not substitute for human editorial/rights review. No PB/PRD/architecture invariant change.

Follow-up: owner directly requested app integration in [C23](./C23-learning-illustration-runtime.md). C23 supplies normalized derivatives and runtime wiring; this candidate task does not declare production editorial/rights/device review complete.

Verification: all 29 atlas SHA-256 values, unique sample-word mappings, per-word finite playback, pause/static/reduced-motion behavior, accent-insensitive search, group/empty filtering and 320px layout passed. Targeted ESLint and Prettier cover review scripts/artifacts; no native app behavior changed and no local server was started.
