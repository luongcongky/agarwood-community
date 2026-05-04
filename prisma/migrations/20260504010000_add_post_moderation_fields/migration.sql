-- Backfill migration: posts moderation fields + composite index được thêm vào
-- schema.prisma qua `prisma db push` (không qua migrate dev). Các DB hiện hữu
-- (local + 2 Supabase) đều đã có sẵn nhưng migrations folder chưa phản ánh.
-- IF NOT EXISTS để migration idempotent: deploy lên DB đã có là no-op.

-- AlterTable
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "moderatedBy" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "posts_status_authorId_idx" ON "posts"("status", "authorId");
