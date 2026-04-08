-- DropForeignKey
ALTER TABLE "media_orders" DROP CONSTRAINT "media_orders_requesterId_fkey";

-- AlterTable
ALTER TABLE "media_orders" ALTER COLUMN "requesterId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "media_orders" ADD CONSTRAINT "media_orders_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
