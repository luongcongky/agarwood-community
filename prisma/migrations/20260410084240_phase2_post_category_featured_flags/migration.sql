-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('GENERAL', 'NEWS', 'PRODUCT');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "featuredOrder" INTEGER,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category" "PostCategory" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "featuredOrder" INTEGER,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "companies_isFeatured_featuredOrder_idx" ON "companies"("isFeatured", "featuredOrder");

-- CreateIndex
CREATE INDEX "posts_category_createdAt_idx" ON "posts"("category", "createdAt");

-- CreateIndex
CREATE INDEX "posts_category_isPremium_authorPriority_idx" ON "posts"("category", "isPremium", "authorPriority");

-- CreateIndex
CREATE INDEX "products_isFeatured_featuredOrder_idx" ON "products"("isFeatured", "featuredOrder");
