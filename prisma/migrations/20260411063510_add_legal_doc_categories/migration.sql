-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentCategory" ADD VALUE 'DIEU_LE';
ALTER TYPE "DocumentCategory" ADD VALUE 'QUY_CHE';
ALTER TYPE "DocumentCategory" ADD VALUE 'GIAY_PHEP';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "issuer" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
