# C30 — Cùng luyện feature interface

Implements: `PRD-PLAN-001/004/005`, `PRD-ACC-004`, `PRD-ACT-008..010`, `PRD-UX-*`.

Authorization: owner requested a separate feature beside Học, then explicitly requested FE/BE implementation. Dependencies: C29 APIs and existing Gentle Growth UI/Parent Gate.

Scope: Học / Cùng luyện / Phụ huynh tabs; separate hub, goal/plan management and preparation screens. Parent Gate uses an allowlisted practice destination. Plan edits, detailed observations and goal choices stay in Parent Zone. Child hub displays the prepared goal/session and neutral statuses. Request, real-object command, choice, refusal and transfer have authored guidance; choice/refusal add meaningful interactions that do not auto-score observations.

Acceptance: feature visible as a tab; changing practice plan leaves Học selection/checkpoint intact. Parent can choose multiple goals, select/defer/re-add lessons and see server-save/conflict/retry states. Command shows ordered real-world steps, choice offers two props, refusal respects stopping, transfer invites leaving the screen. Existing learning routes remain available. No new visual system or service.

Tests: deterministic composition/deferral unit tests; real-API browser at 320/390/768px with screenshots, overflow checks, Parent Gate and persisted plan/deferral. Results in C32. Native screen-reader/large text/device proof remains required.

Migration: no frontend database schema change; navigation is additive. Rollback: hide the tab/new routes, retain parent readers and new server data; do not delete observations or databases.

Out of scope in this slice: recognition/naming/cloze/sentence/Q&A production activities and role-specific family-media integration; they are tracked as remaining plan coverage in C32, not treated as complete by the seven starter fixtures.
