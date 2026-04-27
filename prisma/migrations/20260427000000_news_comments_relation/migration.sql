-- Phase 3.4 (2026-04): bình luận trên trang detail tin tức / nghiên cứu.
-- Comment hiện đã polymorphic giữa Post + Product (postId/productId);
-- thêm newsId làm target thứ 3 để /tin-tuc/{slug} + /nghien-cuu/{slug}
-- (cùng dùng News table) reuse được component CommentsSection.

-- 1. Add nullable column
ALTER TABLE "comments" ADD COLUMN "newsId" TEXT;

-- 2. FK với CASCADE — xoá News thì xoá luôn comments của nó
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_newsId_fkey"
  FOREIGN KEY ("newsId") REFERENCES "news"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Composite index cho query GET /api/comments?newsId=xxx ORDER BY createdAt
CREATE INDEX "comments_newsId_createdAt_idx" ON "comments"("newsId", "createdAt");
