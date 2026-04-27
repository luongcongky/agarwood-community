-- Phase 3: News categories BUSINESS + PRODUCT, template enum, links to
-- Company/Product, gallery JSON for PHOTO/VIDEO templates.

-- 1) NewsCategory enum: add 2 new values
ALTER TYPE "NewsCategory" ADD VALUE IF NOT EXISTS 'BUSINESS';
ALTER TYPE "NewsCategory" ADD VALUE IF NOT EXISTS 'PRODUCT';

-- 2) NewsTemplate enum (mới)
DO $$ BEGIN
  CREATE TYPE "NewsTemplate" AS ENUM ('NORMAL', 'PHOTO', 'VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Add columns to news
ALTER TABLE "news"
  ADD COLUMN IF NOT EXISTS "template" "NewsTemplate" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "relatedCompanyId" TEXT,
  ADD COLUMN IF NOT EXISTS "relatedProductId" TEXT,
  ADD COLUMN IF NOT EXISTS "gallery" JSONB;

-- 4) Index for /multimedia + /tin-tuc filter by template
CREATE INDEX IF NOT EXISTS "news_template_isPublished_publishedAt_idx"
  ON "news"("template", "isPublished", "publishedAt");
