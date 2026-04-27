-- CreateTable
CREATE TABLE "product_revisions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "name_zh" TEXT,
    "name_ar" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "description_en" TEXT,
    "description_zh" TEXT,
    "description_ar" TEXT,
    "category" TEXT,
    "category_en" TEXT,
    "category_zh" TEXT,
    "category_ar" TEXT,
    "priceRange" TEXT,
    "imageUrls" TEXT[],
    "isPublished" BOOLEAN NOT NULL,
    "editedBy" TEXT NOT NULL,
    "editedRole" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "changedFields" TEXT[],

    CONSTRAINT "product_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_revisions_productId_version_key" ON "product_revisions"("productId", "version");

-- CreateIndex
CREATE INDEX "product_revisions_productId_editedAt_idx" ON "product_revisions"("productId", "editedAt");

-- AddForeignKey
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
