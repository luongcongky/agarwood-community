-- Phase 4.2 (2026-04-29): Multi-slot banner — đổi position (single) thành positions[] (array).
--   Mục tiêu: 1 banner áp dụng cho nhiều slot cùng shape, tránh trùng URL/ảnh.
--   Constraint same-shape enforce ở admin form (không ở DB).
--
-- Strategy:
--  1. Drop indexes B-tree dùng position (không apply được cho array)
--  2. Thêm column positions BannerSlot[] với default
--  3. Migrate data: positions = ARRAY[position] (giữ assignment cũ — KH chỉ reset lúc 4.0/4.1)
--  4. Drop column position cũ
--  5. Tạo GIN index trên positions cho query `positions has slot` nhanh

-- 1. Drop B-tree composite indexes có position
DROP INDEX IF EXISTS "banners_status_position_endDate_idx";
DROP INDEX IF EXISTS "banners_status_position_startDate_endDate_idx";

-- 2. Thêm column mới
ALTER TABLE "banners" ADD COLUMN "positions" "BannerSlot"[] NOT NULL DEFAULT ARRAY['HOMEPAGE_TOP_LEFT'::"BannerSlot"];

-- 3. Migrate data từ position scalar → positions array
UPDATE "banners" SET "positions" = ARRAY["position"];

-- 4. Drop column cũ
ALTER TABLE "banners" DROP COLUMN "position";

-- 5. GIN index cho query containment (positions @> ARRAY[slot]) — tương đương Prisma `has`
CREATE INDEX "banners_positions_gin_idx" ON "banners" USING GIN ("positions");

-- 6. Composite B-tree cho status + endDate filter (giữ lại, KH thường filter status trước)
--    không cần multi-col với positions vì GIN tự lo positions bit.
