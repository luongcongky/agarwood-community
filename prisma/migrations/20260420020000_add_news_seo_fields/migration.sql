-- Add SEO-specific fields to the News model.
-- Per-locale SEO overrides (seoTitle, seoDescription, coverImageAlt) follow
-- the existing *_en / *_zh / *_ar fallback chain in i18n/localize.ts.
-- focusKeyword + secondaryKeywords are single (VI source-of-truth) — the
-- 19-point scoring rubric runs against the VI content primarily.
-- seoScore + seoScoreDetail are cached on save so admin lists can sort/filter
-- without re-running the scorer for every row.

-- Per-locale SEO title (overrides `title` for <title>, og:title, JSON-LD)
ALTER TABLE "news" ADD COLUMN "seoTitle"    TEXT;
ALTER TABLE "news" ADD COLUMN "seoTitle_en" TEXT;
ALTER TABLE "news" ADD COLUMN "seoTitle_zh" TEXT;
ALTER TABLE "news" ADD COLUMN "seoTitle_ar" TEXT;

-- Per-locale SEO description / meta-description (overrides `excerpt`)
ALTER TABLE "news" ADD COLUMN "seoDescription"    TEXT;
ALTER TABLE "news" ADD COLUMN "seoDescription_en" TEXT;
ALTER TABLE "news" ADD COLUMN "seoDescription_zh" TEXT;
ALTER TABLE "news" ADD COLUMN "seoDescription_ar" TEXT;

-- Per-locale alt text for the cover image (falls back to title when null)
ALTER TABLE "news" ADD COLUMN "coverImageAlt"    TEXT;
ALTER TABLE "news" ADD COLUMN "coverImageAlt_en" TEXT;
ALTER TABLE "news" ADD COLUMN "coverImageAlt_zh" TEXT;
ALTER TABLE "news" ADD COLUMN "coverImageAlt_ar" TEXT;

-- Focus keyword + secondary keywords (single, VI source-of-truth)
ALTER TABLE "news" ADD COLUMN "focusKeyword"      TEXT;
ALTER TABLE "news" ADD COLUMN "secondaryKeywords" TEXT[] DEFAULT '{}';

-- Cached score (0-100) and per-criterion breakdown JSON. Recomputed on save.
ALTER TABLE "news" ADD COLUMN "seoScore"       INTEGER;
ALTER TABLE "news" ADD COLUMN "seoScoreDetail" JSONB;

-- Index for admin dashboard filtering by score
CREATE INDEX "news_seoScore_idx" ON "news"("seoScore");
