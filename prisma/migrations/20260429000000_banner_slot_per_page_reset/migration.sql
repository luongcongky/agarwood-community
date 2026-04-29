-- Phase 4 (2026-04-29): Banner gắn với (page, vùng) thay vì global position.
-- Đổi enum BannerPosition (TOP/MID/SIDEBAR) → BannerSlot (12 giá trị page-prefixed).
-- KH yêu cầu: reset all banner.position → 'HOMEPAGE_TOP', config lại từ đầu.
--
-- Lưu ý: model Prisma `Banner` map sang table `"banners"` (qua @@map).
--
-- Strategy:
--  1. Drop 2 index có position trước (chặn alter type)
--  2. Drop default constraint trên column position
--  3. Tạo enum mới BannerSlot
--  4. Convert column position → cast về enum mới với value mặc định (reset)
--  5. Drop enum cũ BannerPosition
--  6. Set default + recreate index

-- 1. Drop indexes dùng position
DROP INDEX IF EXISTS "banners_status_position_endDate_idx";
DROP INDEX IF EXISTS "banners_status_position_startDate_endDate_idx";

-- 2. Drop default trên column position (cần để alter type không lỗi)
ALTER TABLE "banners" ALTER COLUMN "position" DROP DEFAULT;

-- 3. Tạo enum mới
CREATE TYPE "BannerSlot" AS ENUM (
  'HOMEPAGE_TOP',
  'HOMEPAGE_MID',
  'HOMEPAGE_SIDEBAR',
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

-- 4. Reset toàn bộ banner.position → 'HOMEPAGE_TOP' (KH yêu cầu config lại từ đầu).
ALTER TABLE "banners"
  ALTER COLUMN "position" TYPE "BannerSlot"
  USING 'HOMEPAGE_TOP'::"BannerSlot";

-- 5. Drop enum cũ
DROP TYPE "BannerPosition";

-- 6. Set default mới + recreate indexes (giữ tên cũ để khớp convention Prisma)
ALTER TABLE "banners" ALTER COLUMN "position" SET DEFAULT 'HOMEPAGE_TOP';
CREATE INDEX "banners_status_position_endDate_idx" ON "banners" ("status", "position", "endDate");
CREATE INDEX "banners_status_position_startDate_endDate_idx" ON "banners" ("status", "position", "startDate", "endDate");
