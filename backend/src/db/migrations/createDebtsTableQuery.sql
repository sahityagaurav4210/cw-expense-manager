CREATE TABLE IF NOT EXISTS "public"."debts" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "public"."users"("id"),
        "type" VARCHAR(20) NOT NULL DEFAULT 'LENT',
        "person_name" VARCHAR(100) NOT NULL,
        "contact_info" VARCHAR(100),
        "initial_amount" NUMERIC(12, 2) NOT NULL,
        "settled_amount" NUMERIC(12, 2) NOT NULL DEFAULT 0,
        "lent_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "due_date" DATE,
        "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "notes" VARCHAR(255),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );