-- Phase 3.7 round 4 (2026-04): admin pin per-section trên trang chủ.
-- Khác `isPinned` global (vẫn giữ cho NewsSection + sidebar featured).
-- Empty default = không pin section nào.

ALTER TABLE "news"
  ADD COLUMN "pinnedInCategories" "NewsCategory"[] DEFAULT ARRAY[]::"NewsCategory"[];

-- GIN index cho `array @> [value]` query — Prisma `has` operator dịch sang
-- `@>`. Cần index để filter homepage section + admin filter nhanh trên DB
-- lớn (hiện ~80 row, chưa nóng nhưng trồng sẵn cho scale).
CREATE INDEX "news_pinnedInCategories_idx" ON "news" USING GIN ("pinnedInCategories");
