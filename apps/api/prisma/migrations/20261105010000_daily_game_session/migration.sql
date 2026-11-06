CREATE TABLE "daily_game_sessions" (
  "id" UUID NOT NULL,
  "child_id" UUID NOT NULL,
  "play_day" VARCHAR(10) NOT NULL,
  "starts_at" TIMESTAMPTZ(3) NOT NULL,
  "reset_at" TIMESTAMPTZ(3) NOT NULL,
  "tier" VARCHAR(10) NOT NULL CHECK ("tier" IN ('basic', 'full')),
  "plan" JSONB NOT NULL,
  "checkpoint" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1 CHECK ("revision" > 0),
  "completed_at" TIMESTAMPTZ(3),
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_game_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "daily_game_sessions_window" CHECK ("reset_at" > "starts_at"),
  CONSTRAINT "daily_game_sessions_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "daily_game_sessions_child_id_play_day_key" ON "daily_game_sessions"("child_id", "play_day");
