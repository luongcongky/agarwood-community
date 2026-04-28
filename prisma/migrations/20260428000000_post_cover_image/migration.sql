-- Phase 3.7 round 4 (2026-04): Post.coverImageUrl — thumbnail 16:9 cho
-- homepage section "Tin DN/SP mới nhất". Nullable; fallback ở UI sang
-- imageUrls[0] → extract from content → placeholder.

ALTER TABLE "posts" ADD COLUMN "coverImageUrl" TEXT;
