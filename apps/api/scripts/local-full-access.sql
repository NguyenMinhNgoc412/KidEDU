-- Synthetic local account only. This script is mounted only by compose.local.yml.
BEGIN;

INSERT INTO accounts (id, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000002', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_identities (id, account_id, provider, subject, created_at)
VALUES (
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000002',
  'supabase',
  'local-full-access-parent',
  now()
)
ON CONFLICT (provider, subject) DO NOTHING;

INSERT INTO entitlements (
  account_id, state, effective_until, capabilities,
  billing_retry_allows_access, source, version, updated_at
)
SELECT account_id,
       'active'::"EntitlementState",
       now() + interval '30 days',
       ARRAY['learning.plan.full', 'content.pack.full', 'family_media.cloud']::text[],
       false, 'local_fixture', 1, now()
FROM auth_identities
WHERE provider = 'supabase' AND subject = 'local-full-access-parent'
ON CONFLICT (account_id) DO UPDATE SET
  state = EXCLUDED.state,
  effective_until = EXCLUDED.effective_until,
  capabilities = EXCLUDED.capabilities,
  version = entitlements.version + 1,
  updated_at = EXCLUDED.updated_at
WHERE entitlements.source = 'local_fixture'
  AND (entitlements.effective_until IS NULL OR entitlements.effective_until < now() + interval '7 days');

COMMIT;
