CREATE TABLE IF NOT EXISTS "public"."contacts" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL,
        "phone" VARCHAR(30) NOT NULL,
        "email" VARCHAR(150),
        "profile_photo" VARCHAR(255),
        "company" VARCHAR(100),
        "job_title" VARCHAR(100),
        "category" VARCHAR(50) NOT NULL DEFAULT 'Other',
        "address" VARCHAR(255),
        "notes" VARCHAR(255),
        "is_favorite" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );