-- Add Arabic (ar) locale columns to every multi-lang table.
-- Mirrors the existing *_en / *_zh columns exactly. All rows left NULL;
-- admin populates via the MultiLangInput editor or AI-translate.

-- User
ALTER TABLE "users" ADD COLUMN "bio_ar" TEXT;

-- Company
ALTER TABLE "companies" ADD COLUMN "name_ar" TEXT;
ALTER TABLE "companies" ADD COLUMN "description_ar" TEXT;
ALTER TABLE "companies" ADD COLUMN "address_ar" TEXT;
ALTER TABLE "companies" ADD COLUMN "representativePosition_ar" TEXT;

-- Product
ALTER TABLE "products" ADD COLUMN "name_ar" TEXT;
ALTER TABLE "products" ADD COLUMN "description_ar" TEXT;
ALTER TABLE "products" ADD COLUMN "category_ar" TEXT;

-- News
ALTER TABLE "news" ADD COLUMN "title_ar" TEXT;
ALTER TABLE "news" ADD COLUMN "excerpt_ar" TEXT;
ALTER TABLE "news" ADD COLUMN "content_ar" TEXT;

-- Navbar menu items
ALTER TABLE "menu_items" ADD COLUMN "label_ar" TEXT;

-- Documents (legal + internal)
ALTER TABLE "documents" ADD COLUMN "title_ar" TEXT;
ALTER TABLE "documents" ADD COLUMN "description_ar" TEXT;
ALTER TABLE "documents" ADD COLUMN "issuer_ar" TEXT;
ALTER TABLE "documents" ADD COLUMN "summary_ar" TEXT;

-- Leaders
ALTER TABLE "leaders" ADD COLUMN "name_ar" TEXT;
ALTER TABLE "leaders" ADD COLUMN "honorific_ar" TEXT;
ALTER TABLE "leaders" ADD COLUMN "title_ar" TEXT;
ALTER TABLE "leaders" ADD COLUMN "workTitle_ar" TEXT;
ALTER TABLE "leaders" ADD COLUMN "bio_ar" TEXT;

-- Surveys
ALTER TABLE "surveys" ADD COLUMN "title_ar" TEXT;
ALTER TABLE "surveys" ADD COLUMN "description_ar" TEXT;
ALTER TABLE "surveys" ADD COLUMN "questions_ar" JSONB;
