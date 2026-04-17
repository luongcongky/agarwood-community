-- Add i18n columns (en/zh) to all public-facing models.
-- All columns are nullable — existing Vietnamese data is untouched.
-- PostgreSQL ALTER TABLE ADD COLUMN with NULL default does not rewrite the table.

-- MenuItem
ALTER TABLE "menu_items" ADD COLUMN "label_en" TEXT;
ALTER TABLE "menu_items" ADD COLUMN "label_zh" TEXT;

-- Leader
ALTER TABLE "leaders" ADD COLUMN "name_en" TEXT;
ALTER TABLE "leaders" ADD COLUMN "name_zh" TEXT;
ALTER TABLE "leaders" ADD COLUMN "honorific_en" TEXT;
ALTER TABLE "leaders" ADD COLUMN "honorific_zh" TEXT;
ALTER TABLE "leaders" ADD COLUMN "title_en" TEXT;
ALTER TABLE "leaders" ADD COLUMN "title_zh" TEXT;
ALTER TABLE "leaders" ADD COLUMN "workTitle_en" TEXT;
ALTER TABLE "leaders" ADD COLUMN "workTitle_zh" TEXT;
ALTER TABLE "leaders" ADD COLUMN "bio_en" TEXT;
ALTER TABLE "leaders" ADD COLUMN "bio_zh" TEXT;

-- News
ALTER TABLE "news" ADD COLUMN "title_en" TEXT;
ALTER TABLE "news" ADD COLUMN "title_zh" TEXT;
ALTER TABLE "news" ADD COLUMN "excerpt_en" TEXT;
ALTER TABLE "news" ADD COLUMN "excerpt_zh" TEXT;
ALTER TABLE "news" ADD COLUMN "content_en" TEXT;
ALTER TABLE "news" ADD COLUMN "content_zh" TEXT;

-- Document
ALTER TABLE "documents" ADD COLUMN "title_en" TEXT;
ALTER TABLE "documents" ADD COLUMN "title_zh" TEXT;
ALTER TABLE "documents" ADD COLUMN "description_en" TEXT;
ALTER TABLE "documents" ADD COLUMN "description_zh" TEXT;
ALTER TABLE "documents" ADD COLUMN "issuer_en" TEXT;
ALTER TABLE "documents" ADD COLUMN "issuer_zh" TEXT;
ALTER TABLE "documents" ADD COLUMN "summary_en" TEXT;
ALTER TABLE "documents" ADD COLUMN "summary_zh" TEXT;

-- Company
ALTER TABLE "companies" ADD COLUMN "name_en" TEXT;
ALTER TABLE "companies" ADD COLUMN "name_zh" TEXT;
ALTER TABLE "companies" ADD COLUMN "description_en" TEXT;
ALTER TABLE "companies" ADD COLUMN "description_zh" TEXT;
ALTER TABLE "companies" ADD COLUMN "address_en" TEXT;
ALTER TABLE "companies" ADD COLUMN "address_zh" TEXT;

-- Product
ALTER TABLE "products" ADD COLUMN "name_en" TEXT;
ALTER TABLE "products" ADD COLUMN "name_zh" TEXT;
ALTER TABLE "products" ADD COLUMN "description_en" TEXT;
ALTER TABLE "products" ADD COLUMN "description_zh" TEXT;
ALTER TABLE "products" ADD COLUMN "category_en" TEXT;
ALTER TABLE "products" ADD COLUMN "category_zh" TEXT;

-- Survey
ALTER TABLE "surveys" ADD COLUMN "title_en" TEXT;
ALTER TABLE "surveys" ADD COLUMN "title_zh" TEXT;
ALTER TABLE "surveys" ADD COLUMN "description_en" TEXT;
ALTER TABLE "surveys" ADD COLUMN "description_zh" TEXT;
ALTER TABLE "surveys" ADD COLUMN "questions_en" JSONB;
ALTER TABLE "surveys" ADD COLUMN "questions_zh" JSONB;
