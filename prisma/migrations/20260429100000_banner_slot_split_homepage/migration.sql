-- Phase 4.1 (2026-04-29): Split homepage slots theo phản hồi KH:
--  HOMEPAGE_TOP     → HOMEPAGE_TOP_LEFT + HOMEPAGE_TOP_RIGHT (2 banner trái/phải)
--  HOMEPAGE_SIDEBAR → HOMEPAGE_RESEARCH_SIDEBAR + HOMEPAGE_MULTIMEDIA_SIDEBAR
--
-- Reset all banner.position → 'HOMEPAGE_TOP_LEFT' (admin config lại từ đầu).

-- 1. Drop indexes dùng position
DROP INDEX IF EXISTS "banners_status_position_endDate_idx";
DROP INDEX IF EXISTS "banners_status_position_startDate_endDate_idx";

-- 2. Drop default
ALTER TABLE "banners" ALTER COLUMN "position" DROP DEFAULT;

-- 3. Rename enum cũ để giữ tham chiếu, tạo enum mới
ALTER TYPE "BannerSlot" RENAME TO "BannerSlot_old";

CREATE TYPE "BannerSlot" AS ENUM (
  'HOMEPAGE_TOP_LEFT',
  'HOMEPAGE_TOP_RIGHT',
  'HOMEPAGE_MID',
  'HOMEPAGE_RESEARCH_SIDEBAR',
  'HOMEPAGE_MULTIMEDIA_SIDEBAR',
  'NEWS_LIST_SIDEBAR',
  'NEWS_DETAIL_SIDEBAR',
  'RESEARCH_LIST_SIDEBAR',
  'RESEARCH_DETAIL_SIDEBAR',
  'AGRICULTURE_LIST_SIDEBAR',
  'AGRICULTURE_DETAIL_SIDEBAR',
  'PRESS_LIST_SIDEBAR',
  'PRESS_DETAIL_SIDEBAR',
  'MULTIMEDIA_DETAIL_SIDEBAR',
  'FEED_SIDEBAR'
);

-- 4. Convert column → reset all về HOMEPAGE_TOP_LEFT
ALTER TABLE "banners"
  ALTER COLUMN "position" TYPE "BannerSlot"
  USING 'HOMEPAGE_TOP_LEFT'::"BannerSlot";

-- 5. Drop enum cũ
DROP TYPE "BannerSlot_old";

-- 6. Set default + recreate indexes
ALTER TABLE "banners" ALTER COLUMN "position" SET DEFAULT 'HOMEPAGE_TOP_LEFT';
CREATE INDEX "banners_status_position_endDate_idx" ON "banners" ("status", "position", "endDate");
CREATE INDEX "banners_status_position_startDate_endDate_idx" ON "banners" ("status", "position", "startDate", "endDate");
