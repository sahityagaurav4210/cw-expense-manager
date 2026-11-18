CREATE TABLE IF NOT EXISTS "master"."payment_options_master" (
  "id" SERIAL PRIMARY KEY,
  "payment_name" VARCHAR(100) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "master"."payment_options_master" ("payment_name", "is_active", "is_deleted")
SELECT 'Cash', true, false WHERE NOT EXISTS (SELECT 1 FROM "master"."payment_options_master" WHERE "payment_name" = 'Cash');
INSERT INTO "master"."payment_options_master" ("payment_name", "is_active", "is_deleted")
SELECT 'UPI', true, false WHERE NOT EXISTS (SELECT 1 FROM "master"."payment_options_master" WHERE "payment_name" = 'UPI');
INSERT INTO "master"."payment_options_master" ("payment_name", "is_active", "is_deleted")
SELECT 'Bank Transfer', true, false WHERE NOT EXISTS (SELECT 1 FROM "master"."payment_options_master" WHERE "payment_name" = 'Bank Transfer');
INSERT INTO "master"."payment_options_master" ("payment_name", "is_active", "is_deleted")
SELECT 'Credit Card', true, false WHERE NOT EXISTS (SELECT 1 FROM "master"."payment_options_master" WHERE "payment_name" = 'Credit Card');
INSERT INTO "master"."payment_options_master" ("payment_name", "is_active", "is_deleted")
SELECT 'Debit Card', true, false WHERE NOT EXISTS (SELECT 1 FROM "master"."payment_options_master" WHERE "payment_name" = 'Debit Card');
