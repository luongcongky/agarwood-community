-- Phase 3.7 round 4 (2026-04): News.secondaryCategories[] — cho phép 1 bài
-- xuất hiện ở nhiều list page (max 3, validation API layer). Homepage giữ
-- nguyên filter primary `category = X`; list page query mở rộng OR điều kiện
-- `secondaryCategories has X`.

ALTER TABLE "news" ADD COLUMN "secondaryCategories" "NewsCategory"[] NOT NULL DEFAULT ARRAY[]::"NewsCategory"[];

-- GIN index để tăng tốc query `WHERE secondaryCategories @> ARRAY[?]`
-- (Prisma sinh ra cho `has` operator).
CREATE INDEX "news_secondaryCategories_idx" ON "news" USING GIN ("secondaryCategories");
