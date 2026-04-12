-- CreateEnum
CREATE TYPE "MemberCategory" AS ENUM ('OFFICIAL', 'AFFILIATE', 'HONORARY');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "representativeName" TEXT,
ADD COLUMN     "representativePosition" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "memberCategory" "MemberCategory" NOT NULL DEFAULT 'OFFICIAL';
