-- StaticPageConfig: cấu hình text cho các trang tĩnh (about, contact, home, ...).
-- Key composite (pageKey, itemKey) → 1 record/value, kèm 3 cột i18n (en/zh/ar);
-- locale `vi` lưu ở cột `value` (default).

-- CreateTable
CREATE TABLE "static_page_configs" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "value_en" TEXT,
    "value_zh" TEXT,
    "value_ar" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "static_page_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "static_page_configs_pageKey_itemKey_key" ON "static_page_configs"("pageKey", "itemKey");
