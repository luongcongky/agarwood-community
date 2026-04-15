-- CreateTable
CREATE TABLE "hero_images" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_images_isActive_sortOrder_idx" ON "hero_images"("isActive", "sortOrder");
