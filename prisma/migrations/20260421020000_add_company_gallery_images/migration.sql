-- CreateTable: Company gallery images (photos uploaded by company owner)
CREATE TABLE "company_gallery_images" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_gallery_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "company_gallery_images_companyId_sortOrder_idx"
  ON "company_gallery_images"("companyId", "sortOrder");

ALTER TABLE "company_gallery_images"
  ADD CONSTRAINT "company_gallery_images_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
