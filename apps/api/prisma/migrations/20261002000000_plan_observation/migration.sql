CREATE TABLE "learning_plans" (
  "child_id" UUID PRIMARY KEY REFERENCES "child_profiles"("id") ON DELETE RESTRICT,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "document" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learning_plans_revision_check" CHECK ("revision" > 0)
);

CREATE TABLE "observations" (
  "id" UUID PRIMARY KEY,
  "event_id" VARCHAR(100) NOT NULL UNIQUE,
  "child_id" UUID NOT NULL REFERENCES "child_profiles"("id") ON DELETE RESTRICT,
  "goal_id" VARCHAR(100) NOT NULL,
  "target_id" VARCHAR(100) NOT NULL,
  "activity_type" VARCHAR(40) NOT NULL,
  "content_version" INTEGER NOT NULL,
  "result" VARCHAR(20) NOT NULL,
  "prompt_level" INTEGER,
  "context" VARCHAR(20) NOT NULL,
  "session_id" VARCHAR(100) NOT NULL,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "observations_result_check" CHECK ("result" IN ('independent', 'supported', 'not_yet', 'not_observed')),
  CONSTRAINT "observations_context_check" CHECK ("context" IN ('in_app', 'parent_guided')),
  CONSTRAINT "observations_content_version_check" CHECK ("content_version" > 0),
  CONSTRAINT "observations_prompt_level_check" CHECK ("prompt_level" IS NULL OR "prompt_level" >= 0)
);
CREATE INDEX "observations_child_id_received_at_id_idx" ON "observations"("child_id", "received_at", "id");
