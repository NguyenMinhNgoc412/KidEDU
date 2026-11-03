CREATE TABLE "observation_supersessions" (
  "id" UUID NOT NULL,
  "original_observation_id" UUID NOT NULL,
  "replacement_observation_id" UUID NOT NULL,
  "account_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "observation_supersessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "observation_supersessions_original_observation_id_key" UNIQUE ("original_observation_id"),
  CONSTRAINT "observation_supersessions_replacement_observation_id_key" UNIQUE ("replacement_observation_id"),
  CONSTRAINT "observation_supersessions_original_observation_id_fkey" FOREIGN KEY ("original_observation_id")
    REFERENCES "observations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "observation_supersessions_replacement_observation_id_fkey" FOREIGN KEY ("replacement_observation_id")
    REFERENCES "observations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "observation_supersessions_account_id_fkey" FOREIGN KEY ("account_id")
    REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "observation_supersessions_account_id_created_at_idx"
  ON "observation_supersessions"("account_id", "created_at");
