-- Baseline migration for tables/enums/columns introduced via `prisma db push`
-- without a tracked migration. The following objects exist in the live database
-- but were missing from the migration history, which broke the shadow database
-- rebuild used by `prisma migrate dev`:
--
--   Tables : leaders, partners, surveys, survey_responses, consultation_requests
--   Enums  : LeaderCategory, PartnerCategory, SurveyAudience, SurveyStatus,
--            ConsultationStatus, BannerPosition
--   Column : banners.position (BannerPosition)
--
-- Subsequent migrations (20260417000000_add_i18n_columns,
-- 20260419100000_add_sidebar_banner_position, 20260420000000_add_arabic_locale_columns)
-- ALTER these objects, so they must exist in the shadow DB before those run.
--
-- This baseline reproduces the **pre-i18n** shape of `surveys` and the
-- **pre-SIDEBAR** shape of `BannerPosition`, so the later ALTER migrations
-- apply cleanly to the shadow DB.
--
-- Idempotent: every statement uses IF NOT EXISTS or a guarded DO block, so
-- re-running on a database that already has these objects is a no-op.
--
-- For databases where these objects already exist (current local, current
-- production), mark this migration applied without running it:
--
--   npx prisma migrate resolve --applied 20260416200000_baseline_leaders

-- ── ENUMS ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "LeaderCategory" AS ENUM ('BTV', 'BCH', 'BKT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PartnerCategory" AS ENUM (
    'GOVERNMENT', 'ASSOCIATION', 'RESEARCH', 'ENTERPRISE',
    'INTERNATIONAL', 'OTHER', 'MEDIA'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SurveyAudience" AS ENUM ('ALL', 'BUSINESS', 'INDIVIDUAL', 'BOTH_VIP');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ConsultationStatus" AS ENUM ('PENDING', 'CONTACTED', 'DONE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- BannerPosition: pre-SIDEBAR shape so 20260419100000_add_sidebar_banner_position
-- can ALTER TYPE ... ADD VALUE 'SIDEBAR' on the shadow DB.
DO $$ BEGIN
  CREATE TYPE "BannerPosition" AS ENUM ('TOP', 'MID');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── BANNERS.position COLUMN ───────────────────────────────────────────────────

ALTER TABLE "banners"
  ADD COLUMN IF NOT EXISTS "position" "BannerPosition" NOT NULL DEFAULT 'TOP';

-- ── leaders ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "leaders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "honorific" TEXT,
    "title" TEXT NOT NULL,
    "category" "LeaderCategory" NOT NULL DEFAULT 'BCH',
    "workTitle" TEXT,
    "bio" TEXT,
    "photoUrl" TEXT,
    "term" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leaders_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "leaders_isActive_category_sortOrder_idx"
  ON "leaders"("isActive", "category", "sortOrder");
CREATE INDEX IF NOT EXISTS "leaders_term_idx" ON "leaders"("term");
DO $$ BEGIN
  ALTER TABLE "leaders" ADD CONSTRAINT "leaders_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── partners ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "category" "PartnerCategory" NOT NULL DEFAULT 'OTHER',
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "partners_category_idx" ON "partners"("category");
CREATE INDEX IF NOT EXISTS "partners_isActive_sortOrder_idx"
  ON "partners"("isActive", "sortOrder");

-- ── surveys (pre-i18n shape: 20260417 adds _en/_zh, 20260420 adds _ar) ───────

CREATE TABLE IF NOT EXISTS "surveys" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "audience" "SurveyAudience" NOT NULL DEFAULT 'BOTH_VIP',
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "questions" JSONB NOT NULL,
    "config" JSONB,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "surveys_slug_key" ON "surveys"("slug");
CREATE INDEX IF NOT EXISTS "surveys_status_audience_idx"
  ON "surveys"("status", "audience");

-- ── survey_responses ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "survey_responses" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "userId" TEXT,
    "answers" JSONB NOT NULL,
    "score" INTEGER,
    "recommendedTier" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" TEXT,
    "contactEmail" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "logoUrl" TEXT,
    "submitterIp" TEXT,
    "submitterType" TEXT,
    "avatarUrl" TEXT,
    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "survey_responses_surveyId_submittedAt_idx"
  ON "survey_responses"("surveyId", "submittedAt");
CREATE INDEX IF NOT EXISTS "survey_responses_userId_idx"
  ON "survey_responses"("userId");
CREATE INDEX IF NOT EXISTS "survey_responses_contactEmail_idx"
  ON "survey_responses"("contactEmail");
DO $$ BEGIN
  ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_surveyId_fkey"
    FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── consultation_requests ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "consultation_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "note" TEXT,
    "context" TEXT,
    "recommendedTier" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'PENDING',
    "handledById" TEXT,
    "handledAt" TIMESTAMP(3),
    "companyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "consultation_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "consultation_requests_status_createdAt_idx"
  ON "consultation_requests"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "consultation_requests_userId_idx"
  ON "consultation_requests"("userId");
DO $$ BEGIN
  ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_handledById_fkey"
    FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
