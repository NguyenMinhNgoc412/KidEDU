CREATE TABLE "daily_reward_reservations" (
  "session_id" UUID PRIMARY KEY REFERENCES "daily_game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "catalog_id" VARCHAR(160) NOT NULL,
  "catalog_version" INTEGER NOT NULL CHECK ("catalog_version" > 0),
  "kind" VARCHAR(20) NOT NULL CHECK ("kind" IN ('sticker', 'puzzle_piece')),
  "reward_group" "ChildGender" NOT NULL,
  "candidates" TEXT[] NOT NULL CHECK (cardinality("candidates") = 4),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "reward_inventory" (
  "id" UUID PRIMARY KEY,
  "child_id" UUID NOT NULL REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "item_id" VARCHAR(160) NOT NULL,
  "catalog_id" VARCHAR(160) NOT NULL,
  "catalog_version" INTEGER NOT NULL CHECK ("catalog_version" > 0),
  "acquired_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "reward_inventory_child_id_item_id_key" ON "reward_inventory"("child_id", "item_id");
CREATE TABLE "daily_reward_receipts" (
  "id" UUID PRIMARY KEY,
  "session_id" UUID NOT NULL REFERENCES "daily_reward_reservations"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "inventory_id" UUID NOT NULL REFERENCES "reward_inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "box_index" INTEGER NOT NULL CHECK ("box_index" BETWEEN 0 AND 3),
  "claimed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "daily_reward_receipts_session_id_key" ON "daily_reward_receipts"("session_id");
CREATE UNIQUE INDEX "daily_reward_receipts_inventory_id_key" ON "daily_reward_receipts"("inventory_id");
