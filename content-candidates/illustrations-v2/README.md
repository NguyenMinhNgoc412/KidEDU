# Semantic illustration candidates v2 — all 29 sample words

Status: **Candidate — production editorial/rights review pending. C23 integrates normalized derivatives into the local sample learning player at the owner's direct request. No production content pack has been published.**

Open [review.html](./review.html) directly in a browser. No server, network service or open port is needed. Each animation is eight frame-based poses, plays once for three seconds, and supports pause/replay, static mode, OS reduced motion and background stop. No audio.

| Group     | Words                              |
| --------- | ---------------------------------- |
| Gia đình  | ba, mẹ, ông, bà                    |
| Nhu cầu   | ăn, uống, ngủ, đau, bế, nữa, không |
| Đồ vật    | bóng, xe, ly, sữa, bánh, gấu       |
| Con vật   | mèo, chó, cá, gà, chim             |
| Hành động | đi, ngồi, đứng, lấy, đưa, mở, đóng |

All 29 sample words from `src/data/seedData.ts` have candidate atlases (232 frames). Search supports Vietnamese text with or without accents; group filters support focused review. Only one illustration plays at a time. Pause freezes the current pose. Completed action sequences use a final-pose static fallback where needed, including open/close, taking/giving and sitting/standing.

Generated on 2026-10-30 using built-in `image_gen`. Existing illustrations serve as edit targets; ba/mẹ did not have an existing illustration and use the grandmother illustration only as a style reference for new adult characters. The provider/model version is not exposed by the tool. Originals remain intact. All subjects are synthetic illustrations; no family/research data was used.

Each PNG is a 2:1 atlas, 4 columns × 2 rows; exact dimensions are recorded per asset in the manifest. Fractional source cell boundaries are handled by CSS background positioning for this preview. Before app integration, export deterministic integer-sized frames, validate per-frame alignment and apply the approved pack format. This preview is not a production-ready pack.

Review face/anatomy consistency, target clarity, hand/glass geometry, bird wing edges, backdrop stability, frame pacing, palette and sensory impact. Rights/provenance and device performance also need release review. Do not mark candidates approved from automated browser checks.

The owner requested the complete sample-word batch after the first three examples, then directly requested learning-screen integration in C23. All 29 candidates are now present; the app uses normalized derivatives in `assets/illustration-animations/`. Production content approval remains separate; see [content workflow](../../docs-v2/product/06-content-media-production-spec.md#7-workflow-phát-hành). Visual inspection covered beginning/middle/end poses in `qa-1.png` through `qa-6.png`; some generated gesture lines and subtle face/backdrop drift remain editorial review points.

Rebuild metadata/gallery with `node scripts/build-illustration-review.cjs`; validate with `node scripts/check-illustration-review.cjs` from repository root. [prompts.json](./prompts.json) records all 29 exact generation prompts; [manifest.json](./manifest.json) records coverage, hashes, references and review state. Candidate masters are excluded from Docker build context; runtime derivatives and their hashes are recorded in `assets/illustration-animations/manifest.json`.
