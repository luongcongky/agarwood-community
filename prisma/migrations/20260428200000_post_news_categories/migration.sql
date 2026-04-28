-- Phase 3.7 round 4 (2026-04): Post.newsCategories[] cross-classify feed
-- Post vào News list pages. Admin tag bài chỉnh chu trong /admin/bai-viet/
-- cho-duyet (modal "Đẩy lên trang chủ"). Max 3 ở API layer.

ALTER TABLE "posts" ADD COLUMN "newsCategories" "NewsCategory"[] NOT NULL DEFAULT ARRAY[]::"NewsCategory"[];

CREATE INDEX "posts_newsCategories_idx" ON "posts" USING GIN ("newsCategories");
