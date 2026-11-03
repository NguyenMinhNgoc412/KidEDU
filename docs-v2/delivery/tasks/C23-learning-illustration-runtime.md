# C23 — Animated illustrations in the learning player

Implements: `PRD-BR-005`, `PRD-UX-*`, `PRD-MEDIA-*`, `TA-ADR-017`; content media specification section 5.

Authorization: owner directly requested integrating the complete sample animations into learning and fixing missing mẹ/bà illustrations on 2026-10-30.

Dependency: C22 candidate sheets, sample learning player, account-scoped local database and existing auth/entitlement guards.

Scope: normalize the 29 atlases to 1280×640 JPEG (320px square frames), render one finite sequence before canonical audio/mouth video, support replay/stop, reduced motion and lifecycle/focus interruption. Add missing ba/mẹ bundled stills and render bundled still modules directly through Expo Image. Keep custom family illustrations in their existing renderer. Existing databases can show the sample atlas by item ID even before new still mappings are seeded.

Acceptance: entering single-item learning and deck autoplay renders the atlas instead of a static placeholder; canonical speech waits until illustration ends or static fallback is selected; no infinite decorative loop; interruption stops motion, no automatic foreground replay; mẹ/bà have a visible sample illustration. Custom media, account boundaries and entitlement guards remain effective.

Tests: registry/sample-word coverage, direct bundled still resolution, finite frame playback, reduce-motion/background/pause behavior, actual LearningMediaPlayer integration with mẹ/bà fallback and canonical audio ordering; `pnpm check`; Metro export Android/iOS/web. Native-device proof remains separate.

Migration: no schema migration. Existing seed upserts register ba/mẹ stills on database initialization; no database reset, uninstall, account-data deletion or cloud publish. Full Metro/app reload picks up new modules. C22 masters/prompts/provenance remain intact; normalized derivatives have their own hashes. Owner request authorizes local sample integration, not a completed production editorial/rights/device release review.

Rollback: revert C23 renderer/registry/source changes and remove only the new normalized atlases and ba/mẹ v2 still files. Existing family media/progress are retained; seed reconciliation restores the prior registry on next initialization.

Out of scope: publishing production packs/R2, changing subscription/activation guards, family media replacement, mouth video/audio content changes, API/backend/schema changes or opening development servers.

## Verification

- `pnpm check`: bundled media validation (34 files), typecheck, lint and 55 Jest suites / 273 tests passed. Integration tests exercise the real player and illustration timer with native media/UI primitives mocked; they verify frame advancement before audio, mẹ/bà missing-mapping fallback and custom-media preservation.
- Metro export Android/iOS/web passed (`--max-workers 1 --output-dir dist`). Native compilation/device rendering has not been verified.
- All 29 normalized atlases total 3,722,549 bytes (about 3.55 MiB); master sheets remain in C22. Derivative hashes and normalization recipe are recorded in `assets/illustration-animations/manifest.json`.
- Standalone review checks, Prettier, changed-file whitespace and documentation link checks passed. No schema, account namespace, entitlement or SOT invariant changed. README/index/changelog reflect C23.
- Testing exposed Node-preset limitations with native SVG/text/DOM events; the component integration test mocks only media/native UI primitives to test player behavior without a native bridge. No production dependency or runtime bypass was added for the test harness.
