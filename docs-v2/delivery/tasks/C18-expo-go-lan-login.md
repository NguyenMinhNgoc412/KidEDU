# C18 — Expo Go LAN login

Implements: `PRD-ACC-001`, `PRD-ACC-004`, `TA-ADR-002`, `TA-ADR-016`.

Dependency: C06 synthetic identity and Docker API; phone/computer on the same Wi-Fi.

Scope: correct physical-device local login networking. The app previously fell back to localhost and Compose published identity/API on loopback only. Add opt-in `KIDEDU_LOCAL_BIND_ADDRESS`, configure both public URLs in the ignored local environment, and document device setup. Default Compose and PostgreSQL remain loopback-only.

Acceptance: LAN readiness/JWKS and authenticated `/v1/me`/subscription respond; wrong password remains 401. iPhone verification requires reloading Expo Go and allowing local-network access.

Tests: real HTTP probe over the computer Wi-Fi address; Compose health/port validation; Prettier and documentation reference checks. No application/domain/schema change.

Verification on 2026-10-12: readiness/JWKS/login/me/subscription returned HTTP 200 through the host Wi-Fi address; wrong password returned 401. Identity/API containers are healthy and listen on the selected LAN address. Prettier and diff whitespace checks passed. iPhone reachability is not proven by a host HTTP probe; Windows Firewall rules could not be inspected because this process lacks administrator access.

Migration/rollback: no database migration or volume deletion. Restore URLs to localhost and remove the bind-address override, then recreate identity/API and reload Expo. Existing family data is retained.

Out of scope: production identity/billing/activation, changing fixture lesson guards, public internet exposure, iOS native binary rebuild, UI changes.
