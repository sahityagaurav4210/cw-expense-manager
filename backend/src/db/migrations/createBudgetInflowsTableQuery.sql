CREATE TABLE IF NOT EXISTS "public"."budget_inflows" (
        "id" SERIAL PRIMARY KEY,
        "budget_id" INTEGER NOT NULL REFERENCES "public"."budgets"("id") ON DELETE CASCADE,
        "user_id" INTEGER NOT NULL REFERENCES "public"."users"("id"),
        "amount" NUMERIC(12, 2) NOT NULL,
        "source" VARCHAR(100) NOT NULL,
        "received_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "notes" VARCHAR(255),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );