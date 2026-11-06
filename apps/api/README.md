# KidEDU API — local development

The API is a NestJS/Fastify workspace package. PostgreSQL and API run locally with:

Production and staging URLs are left in [`apps/api/.env.example`](./.env.example) as placeholders. Never commit a filled `.env` file. The local Compose stack below runs without external provider URLs.

```powershell
docker compose -f apps/api/compose.local.yml up -d --build --wait
Invoke-RestMethod http://localhost:3000/health/ready
pnpm exec expo start --web --port 19006
# In another terminal:
pnpm test:web
```

Compose applies the checked-in Prisma migration using the same image before starting the API. It uses a disposable local password and synthetic data only. To stop without deleting the local database:

```powershell
docker compose -f apps/api/compose.local.yml down
```

After pulling API/schema changes, rebuild and migrate the local stack before testing
new screens. A healthy older image can still return HTTP 404 for newer routes.
For C50, verify the running image and local database together:

```powershell
# Keep KIDEDU_LOCAL_BIND_ADDRESS set when using the LAN setup described below.
docker compose -f apps/api/compose.local.yml up -d --build --wait
node scripts/local-daily-game-smoke.cjs
```

For a LAN-bound stack, set `KIDEDU_API_ORIGIN` and `KIDEDU_IDENTITY_ORIGIN` to the
same HTTP origins used by Expo before running this smoke. It authenticates with
the synthetic full-access fixture account and reads daily-game status/inventory;
it never starts a session or grants a reward. Create a synthetic child in the
local Parent Zone first if the fixture account has none. HTTP 200 with
`contentReady=false` means the API works while reviewed daily content/runtime
remains unavailable; this is different from a transport, auth or migration error.

Compose local now explicitly enables `C50_LOCAL_DAILY_FIXTURE=1`. This connects
the synthetic daily corpus to real server sessions, SQLite checkpoints, four-box
selection and inventory so the complete interaction can be tested from the
**Trò chơi** tab. The ordinary account uses basic rounds; the full-access fixture
uses full rounds. Complete a legacy profile's gender in **Phụ huynh → Chỉnh hồ sơ**
before claiming a new reward. The server still enforces one session per child/day,
00:00 Vietnam reset and one receipt; playing the preview does not consume it.
Set the flag to `0` to exercise unavailable-content handling. The adapter rejects
every environment other than `APP_ENV=local`, even when its flag is set.

Compose also sets `C50_DAILY_GAMES_CUTOVER=1`: the old “5 words / 3 games”
learning course is read-only and no longer selectable/preparable. Existing
checkpoints, receipts and inventory remain readable; exact ACK retries remain
valid. New legacy rewards cannot be written under another lesson ID either.
Keep this independent cutover guard enabled when disabling the synthetic corpus
or rolling back the new UI, so rollback does not reopen daily-quota bypasses.

With Expo running, `scripts/c50-daily-session-web-smoke.cjs` exercises actual
session/checkpoint/claim requests using a newly created synthetic profile.
Set both local origins as above; `KIDEDU_REWARD_KIND=puzzle_piece` selects a
six-piece picture and `KIDEDU_REWARD_LOST_ACK=1` tests a committed claim whose
response is lost. `scripts/c50-four-tabs-web-smoke.cjs` captures the four tabs;
`KIDEDU_PREVIEW_WIDTH` supports 320, 390 and 768. After testing, the guarded
`scripts/c50-cleanup-synthetic.cjs --cleanup-c50-synthetic` removes only the
mechanically named C50 test profiles from local port 5439/database `kidedu_local`,
after checking fixture ownership and absence of learning data. It requires
`DATABASE_POOL_URL` and never deletes the family, normal profiles or history.

Synthetic artwork and parent-read listening are not human-reviewed release
content. Production signed packs, Vietnamese word audio, the expanded reward
corpus, basic learning activation and manual private-library publishing remain
separate C50 acceptance gates. AI is deferred by the owner for this work pass.

The authenticated endpoints require an asymmetric JWKS, issuer and audience. There is no development authentication bypass. Docker Compose starts a local-only synthetic identity fixture on `127.0.0.1:3011`; it signs one-hour test JWTs, and the API verifies them through its JWKS. The fixture and synthetic consent version are for local data only. Local integration tests also start a loopback JWKS server and sign synthetic tokens:

Request completion logs include request ID, method, route template and status only. They omit the raw URL so child IDs in path parameters do not enter application request logs.

```powershell
$env:DATABASE_POOL_URL='postgresql://kidedu_local:local-dev-only@127.0.0.1:5439/kidedu_local?schema=public'
$env:DATABASE_MIGRATION_URL=$env:DATABASE_POOL_URL
pnpm check:api
pnpm --filter @kidedu/api test:db
```

`CHILD_PROFILE_CONSENT_VERSION` must match the approved current document version before the consent and child-creation routes can be used outside these tests. Production/staging startup rejects missing configuration. The local Docker stack does not prove Supavisor, Supabase session revocation or production readiness.

The local learning API stores a client-computed plan and ingests observations after JWT authentication. Apply the latest migration before calling `GET/PUT /v1/children/{childId}/plan`, `POST /v1/children/{childId}/events:batch`, or `GET /v1/children/{childId}/observations`. These routes require a child in the account's family. Plan writes include `expectedRevision`; observation events use `eventType: "observation.recorded"` and stable `eventId` values. Family list, child detail and child profile update are also available. Profile updates require `expectedVersion`; a stale value returns HTTP 409. Full bootstrap/delta sync, content publishing, billing, activation, and cloud media are still pending.

`POST /v1/observations/{observationId}:supersede` appends a correction without overwriting the original observation. It requires an authorized family member and a stable correction `eventId`. `GET /v1/subscription` reads a server-owned entitlement projection; no client endpoint can grant one. A missing projection denies premium learning while keeping access to family data. The local PostgreSQL migrations for both features must be applied before these endpoints are used.

`apps/api/openapi.local.yaml` is the backend-owned contract subset used by the development Parent Zone API screen. Run `pnpm generate:api-client` after changing it. The generated types are in `src/api/generated.ts`; `test/frontend-contract.spec.ts` checks the frontend HTTP client against Nest routes with stubbed services, while `test/frontend-learning.int-spec.ts` checks it with local PostgreSQL. The Parent Zone screen at `/parent/local-api` is available only in development. With Compose running, open the app at `/login` and sign in using `parent@local.kidedu.test` / `LocalTest123!`; the fixture on `127.0.0.1:3011` returns a signed JWT only after successful login. Android emulator/device API addresses depend on the host network. After Parent Gate, choose “Dữ liệu server (local)” and “Tải dữ liệu”. You can create a synthetic child profile there after explicitly confirming the local test consent. Supabase Auth URLs and publishable key remain placeholders in the root `.env.example`.

For the full-access local test account, use `fullaccess@local.kidedu.test` / `FullAccess123!`. Compose seeds its separate internal account and a 30-day `local_fixture` entitlement with `learning.plan.full`, `content.pack.full`, and `family_media.cloud`; re-running Compose renews this synthetic entitlement when fewer than seven days remain. The ordinary fixture account above remains unentitled. This seed runs only in `compose.local.yml`, does not create a client grant endpoint, and does not activate missing production lesson packs or billing flows.

## Expo Go on a physical iPhone/Android

The phone and computer must share the same Wi-Fi. `localhost` on the phone refers
to the phone itself. Compose defaults to loopback; opt into LAN binding for device
testing using the computer's Wi-Fi IPv4 address (example: `192.168.1.20`):

```powershell
$env:KIDEDU_LOCAL_BIND_ADDRESS='192.168.1.20'
docker compose -f apps/api/compose.local.yml up -d --no-deps --wait identity api
```

Set both values in the root ignored `.env`, preserving other configuration:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:3000
EXPO_PUBLIC_LOCAL_IDENTITY_URL=http://192.168.1.20:3011
EXPO_PUBLIC_ENABLE_LOCAL_LESSON_FIXTURE=1
```

Restart Expo with `pnpm exec expo start --lan --clear`, reopen Expo Go, and sign
in with the documented local fixture account. On iPhone Safari,
`http://192.168.1.20:3000/health/ready` and
`http://192.168.1.20:3011/jwks` must load. Allow Expo Go local-network access in
iOS Settings if it is disabled. If Safari cannot connect, check the Wi-Fi address,
guest-network isolation and Windows Firewall access to TCP 3000/3011 on the local
subnet. PostgreSQL stays loopback-only; production configuration is unaffected.
If the Wi-Fi IP changes, update both URLs and the Compose bind address.

To return to computer-only development, restore both URLs to localhost, remove
`KIDEDU_LOCAL_BIND_ADDRESS` from the shell and recreate identity/API with the same
Compose command. No database migration or volume deletion is required.

# Storage boundary

`ObjectStorageGateway` uses the R2 S3 adapter. Fill `R2_ENDPOINT`, `R2_BUCKET`,
`R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` before enabling cloud media flows.
The adapter signs short-lived transfers and does not expose credentials. Media
authorization, quota, consent and finalize flows must be implemented before
calling it from a client-facing route.
