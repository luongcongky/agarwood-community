-- Backfill enum drift: các enum value được thêm qua `prisma db push` chứ
-- không qua migrate dev. 3 DB hiện hữu (local + 2 Supabase) đều đã có sẵn.
-- IF NOT EXISTS giúp idempotent (PG ≥ 12 cho phép ADD VALUE trong transaction
-- miễn là không reference value cùng tx).

-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "NewsCategory" ADD VALUE IF NOT EXISTS 'SPONSORED_PRODUCT' BEFORE 'BUSINESS';

-- AlterTable: chuyển default posts.status từ PUBLISHED → PENDING (admin tạo
-- bài override code-side sang PUBLISHED; user thường để default → PENDING
-- chờ duyệt).
ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'PENDING';
