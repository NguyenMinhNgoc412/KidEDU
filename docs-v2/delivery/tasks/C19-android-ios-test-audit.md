# C19 — Android/iOS test audit

Implements: `PRD-NFR-004`, `PRD-NFR-008`, `PRD-ACC-*`, `PRD-SES-*`, `TA-ADR-014`, `TA-ADR-015`.

Dependency: C17 SDK upgrade, C18 LAN networking, synthetic local API/database, platform tooling.

Authorization: owner requested full Android/iPhone testing and then selected automated testing first.

Scope: run available mobile/backend/API/browser checks, inspect native tooling, attempt Android emulator execution and record platform gaps. Correct SDK-upgrade test/build incompatibilities discovered by these checks.

Acceptance: report exact commands/results and actual environment; native status must not be inferred from Jest, browser viewport or Metro export.

Changes: backend TypeScript 6 explicitly retains legacy Node resolution with deprecation compatibility and a workspace rootDir for cross-boundary contract tests; production build still overrides rootDir to src. Full-access web smoke accepts configurable API/identity origins so tests work with opt-in LAN binding.

Prototype smoke now waits for a unique lesson action instead of a title duplicated across mounted navigation screens. Maestro README explicitly marks its historical coverage as unverified for v2.

Tests/results: see [platform audit](../09-android-ios-test-audit-2026-10-12.md).

Migration/rollback: no database schema change; revert task-specific TypeScript config and smoke script changes. Preserve existing source changes and user data. Native emulator contains no user family data.

Out of scope: production feature implementation, changing synthetic fixture security guards, native/store release certification, installing services or changing the mobile stack.
