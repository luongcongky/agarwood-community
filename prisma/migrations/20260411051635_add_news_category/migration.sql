-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('GENERAL', 'RESEARCH');

-- DropIndex
DROP INDEX "news_isPublished_publishedAt_idx";

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "category" "NewsCategory" NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE INDEX "news_category_isPublished_publishedAt_idx" ON "news"("category", "isPublished", "publishedAt");
