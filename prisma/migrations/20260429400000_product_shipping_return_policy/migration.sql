-- Phase 4 follow-up (2026-04-29): shippingPolicy + returnPolicy.
-- Default text được điền tại tầng app (PRODUCT_DEFAULT_SHIPPING /
-- PRODUCT_DEFAULT_RETURN) khi user bỏ trống trên form create. Migration
-- backfill existing rows với cùng default để display ở detail page nhất quán.

ALTER TABLE "products"
  ADD COLUMN "shippingPolicy" TEXT,
  ADD COLUMN "returnPolicy"   TEXT;

UPDATE "products"
SET
  "shippingPolicy" = 'Giao hàng toàn quốc',
  "returnPolicy"   = '100% chính hãng · Không áp dụng chính sách bảo hành'
WHERE "shippingPolicy" IS NULL OR "returnPolicy" IS NULL;
