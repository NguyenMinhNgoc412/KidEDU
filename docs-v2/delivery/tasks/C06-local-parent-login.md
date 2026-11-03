# C06 — Parent login from app start

| Field      | Value                                                                                   |
| ---------- | --------------------------------------------------------------------------------------- |
| Implements | `PRD-ACC-001`, `PRD-ACC-004`, `TA-ADR-002`, `TA-ADR-016`, `TA-ADR-022`, `TA-ADR-023`    |
| Depends on | A02–A05 API/JWKS and frontend contract, C02 entitlement read, mobile design specs 01–04 |
| Status     | Local login path implemented; Supabase credentials and device verification pending      |

## Scope

App start presents parent email/password login. In development without Supabase environment values, a synthetic Docker identity fixture accepts one documented test account through `POST /login` and issues a one-hour signed JWT. The mobile auth port also has a Supabase Auth email/password adapter using a publishable key. Both pass the JWT to the versioned app-server API, which verifies it and owns account identity. Native sessions use SecureStore; web local fixture keeps the token in memory. Protected Expo Router routes require a session. Logout clears the auth session, query cache and Parent Gate state. The development backend screen reuses the active session.

## Acceptance and tests

- Wrong local password returns 401; correct credentials produce a JWT accepted by `/v1/me`.
- Logged-out navigation cannot open the Parent Zone route.
- Login → Parent Gate → subscription/child/plan/observation view → logout passes on local web with Docker.
- Typecheck, lint, unit and backend integration checks pass. Native lifecycle and Supabase staging checks remain open until provider values are supplied.

## Migration and rollback

No database migration in C06. Revert the login route, auth provider/gateways, fixture credential route and Expo SecureStore dependency/plugin to roll back. Existing account data is retained. Account-specific SQLite selection and the interim learning gate are tracked in C07; production activation remains outside C06.

## Out of scope

Signup, password reset, Google/Apple OAuth, production email configuration, activation, content encryption and store billing. No mobile Data API or privileged Supabase key is used.
