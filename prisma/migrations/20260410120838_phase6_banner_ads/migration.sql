-- CreateEnum
CREATE TYPE "BannerStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "PaymentType" ADD VALUE 'BANNER_FEE';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bannerId" TEXT;

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "BannerStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "rejectReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banners_userId_idx" ON "banners"("userId");

-- CreateIndex
CREATE INDEX "banners_status_idx" ON "banners"("status");

-- CreateIndex
CREATE INDEX "banners_endDate_idx" ON "banners"("endDate");

-- CreateIndex
CREATE INDEX "banners_status_endDate_idx" ON "banners"("status", "endDate");

-- CreateIndex
CREATE INDEX "payments_bannerId_idx" ON "payments"("bannerId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "banners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
