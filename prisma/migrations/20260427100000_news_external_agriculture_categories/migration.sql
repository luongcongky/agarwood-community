-- Phase 3.5 (2026-04): 2 categories mới
--   EXTERNAL_NEWS — admin curate tin báo chí ngoài (cần sourceName + sourceUrl)
--   AGRICULTURE   — tin khuyến nông
-- và thêm cột sourceName cho News (sourceUrl đã có sẵn từ crawl import).

-- 1. Thêm enum values mới (PostgreSQL không cho thêm trong transaction nếu
--    có data cùng query → CommitOrRollback, nhưng prisma migrate xử lý OK).
ALTER TYPE "NewsCategory" ADD VALUE IF NOT EXISTS 'EXTERNAL_NEWS';
ALTER TYPE "NewsCategory" ADD VALUE IF NOT EXISTS 'AGRICULTURE';

-- 2. Thêm cột sourceName (nullable — chỉ EXTERNAL_NEWS dùng).
ALTER TABLE "news" ADD COLUMN "sourceName" TEXT;
