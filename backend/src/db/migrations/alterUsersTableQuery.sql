ALTER TABLE IF EXISTS "public"."users" ADD COLUMN IF NOT EXISTS "two_factor_method" VARCHAR(20) DEFAULT 'EMAIL';
ALTER TABLE IF EXISTS "public"."users" ADD COLUMN IF NOT EXISTS "authenticator_secret" VARCHAR(255);
ALTER TABLE IF EXISTS "public"."users" ADD COLUMN IF NOT EXISTS "is_authenticator_enabled" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS "public"."users" ADD COLUMN IF NOT EXISTS "is_terms_accepted" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS "public"."users" ADD COLUMN IF NOT EXISTS "isTermsAccepted" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS "public"."users" ADD COLUMN IF NOT EXISTS "annual_income" NUMERIC(15, 2);
UPDATE "public"."users" SET "two_factor_method" = 'AUTHENTICATOR' WHERE "is_authenticator_enabled" = true AND "authenticator_secret" IS NOT NULL;