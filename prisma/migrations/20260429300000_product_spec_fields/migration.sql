-- Phase 4 (2026-04-29): Product spec sheet + variant fields cho trang
-- chi tiết SP chuyên nghiệp hơn (KH yêu cầu).
-- Tất cả nullable — không cần data migration, existing rows giữ nguyên.

ALTER TABLE "products"
  ADD COLUMN "origin"        TEXT,
  ADD COLUMN "treeAge"       TEXT,
  ADD COLUMN "packagingNote" TEXT,
  ADD COLUMN "scentProfile"  TEXT,
  ADD COLUMN "variants"      JSONB;
