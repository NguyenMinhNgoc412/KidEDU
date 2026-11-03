CREATE TYPE "EntitlementState" AS ENUM (
  'trial_active',
  'active',
  'grace_period',
  'billing_retry',
  'canceled_active',
  'expired',
  'refunded',
  'revoked',
  'account_hold'
);

CREATE TABLE "entitlements" (
  "account_id" UUID NOT NULL,
  "state" "EntitlementState" NOT NULL,
  "effective_until" TIMESTAMPTZ(3),
  "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "billing_retry_allows_access" BOOLEAN NOT NULL DEFAULT false,
  "source" VARCHAR(40) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "entitlements_pkey" PRIMARY KEY ("account_id"),
  CONSTRAINT "entitlements_account_id_fkey" FOREIGN KEY ("account_id")
    REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "entitlements_state_effective_until_idx"
  ON "entitlements"("state", "effective_until");
