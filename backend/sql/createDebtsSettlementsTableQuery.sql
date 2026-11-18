CREATE TABLE IF NOT EXISTS "public"."debt_settlements" (
        "id" SERIAL PRIMARY KEY,
        "debt_id" INTEGER NOT NULL REFERENCES "public"."debts"("id") ON DELETE CASCADE,
        "user_id" INTEGER NOT NULL REFERENCES "public"."users"("id"),
        "amount" NUMERIC(12, 2) NOT NULL,
        "settlement_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "payment_mode" VARCHAR(50) NOT NULL DEFAULT 'UPI',
        "notes" VARCHAR(255),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );