-- Baseline part 2 — additional drift between migrations and live DB.
-- Same situation as 20260416200000: these objects were introduced via
-- `prisma db push` and never tracked in a migration.
--
-- Fixes:
--   1. NewsCategory enum is missing the 'LEGAL' value in migration history
--      (current enum: GENERAL, RESEARCH; live DB: GENERAL, RESEARCH, LEGAL).
--   2. Products gained a `postId` column + unique index + FK to posts (used
--      by the marketplace product↔post link feature).
--   3. Banners gained an extra composite index on (status, position, endDate).
--
-- Idempotent — safe to apply on databases where these already exist.

-- 1) NewsCategory: add LEGAL
DO $$ BEGIN
  ALTER TYPE "NewsCategory" ADD VALUE 'LEGAL';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) products.postId column + unique index + FK
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "postId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "products_postId_key" ON "products"("postId");

DO $$ BEGIN
  ALTER TABLE "products" ADD CONSTRAINT "products_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3) banners composite index (status, position, endDate)
CREATE INDEX IF NOT EXISTS "banners_status_position_endDate_idx"
  ON "banners"("status", "position", "endDate");
