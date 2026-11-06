CREATE TABLE "practice_plans" (
  "child_id" UUID PRIMARY KEY REFERENCES "child_profiles"("id") ON DELETE RESTRICT,
  "revision" INTEGER NOT NULL DEFAULT 1 CHECK ("revision" > 0),
  "document" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "practice_checkpoints" (
  "child_id" UUID NOT NULL REFERENCES "child_profiles"("id") ON DELETE RESTRICT,
  "session_id" VARCHAR(64) NOT NULL,
  "revision" INTEGER NOT NULL CHECK ("revision" >= 0),
  "document" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("child_id", "session_id")
);
CREATE INDEX "practice_checkpoints_child_id_updated_at_idx" ON "practice_checkpoints"("child_id", "updated_at");
