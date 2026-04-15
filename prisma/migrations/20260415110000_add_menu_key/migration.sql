-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN "menuKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_menuKey_key" ON "menu_items"("menuKey");
