-- CreateEnum
CREATE TYPE "HonoraryCategory" AS ENUM ('RESEARCH', 'LOGISTICS', 'EXTERNAL_RELATIONS', 'OTHER');

-- CreateTable
CREATE TABLE "honorary_contributions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creditAmount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "category" "HonoraryCategory" NOT NULL,
    "extendMonths" INTEGER NOT NULL DEFAULT 12,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "honorary_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "honorary_contributions_userId_idx" ON "honorary_contributions"("userId");

-- CreateIndex
CREATE INDEX "honorary_contributions_createdByAdminId_idx" ON "honorary_contributions"("createdByAdminId");

-- CreateIndex
CREATE INDEX "honorary_contributions_createdAt_idx" ON "honorary_contributions"("createdAt");

-- AddForeignKey
ALTER TABLE "honorary_contributions" ADD CONSTRAINT "honorary_contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honorary_contributions" ADD CONSTRAINT "honorary_contributions_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
