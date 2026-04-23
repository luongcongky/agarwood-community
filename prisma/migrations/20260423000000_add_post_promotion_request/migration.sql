-- Post promotion request workflow — owner xin admin đẩy bài feed lên trang chủ
-- - Admin cũng có cách chủ động (toggle Post.isPromoted trực tiếp qua API),
--   nhưng model này chỉ dành cho đường "thụ động" (owner → admin).

CREATE TYPE "PromotionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "post_promotion_requests" (
  "id"          TEXT                     NOT NULL,
  "postId"      TEXT                     NOT NULL,
  "requestedBy" TEXT                     NOT NULL,
  "reason"      TEXT,
  "status"      "PromotionRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedBy"  TEXT,
  "reviewedAt"  TIMESTAMP(3),
  "reviewNote"  TEXT,
  "createdAt"   TIMESTAMP(3)             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)             NOT NULL,

  CONSTRAINT "post_promotion_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "post_promotion_requests_postId_idx"
  ON "post_promotion_requests"("postId");

-- Admin inbox: WHERE status='PENDING' ORDER BY createdAt DESC
CREATE INDEX "post_promotion_requests_status_createdAt_idx"
  ON "post_promotion_requests"("status", "createdAt");

CREATE INDEX "post_promotion_requests_requestedBy_idx"
  ON "post_promotion_requests"("requestedBy");

ALTER TABLE "post_promotion_requests"
  ADD CONSTRAINT "post_promotion_requests_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_promotion_requests"
  ADD CONSTRAINT "post_promotion_requests_requestedBy_fkey"
  FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_promotion_requests"
  ADD CONSTRAINT "post_promotion_requests_reviewedBy_fkey"
  FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
