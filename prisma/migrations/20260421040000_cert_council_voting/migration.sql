-- Sprint 2: Hội đồng thẩm định (HDTD) + voting
-- - 5-member council, all-approve or single-veto decision
-- - User.isCouncilMember flag → admin toggles which members can review
-- - CertificationReview holds each vote + comment

CREATE TYPE "ReviewVote" AS ENUM ('PENDING', 'APPROVE', 'REJECT');

ALTER TABLE "users" ADD COLUMN "isCouncilMember" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "users_isCouncilMember_idx" ON "users"("isCouncilMember");

CREATE TABLE "certification_reviews" (
  "id"              TEXT         NOT NULL,
  "certificationId" TEXT         NOT NULL,
  "reviewerId"      TEXT         NOT NULL,
  "vote"            "ReviewVote" NOT NULL DEFAULT 'PENDING',
  "comment"         TEXT,
  "votedAt"         TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "certification_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "certification_reviews_certificationId_reviewerId_key"
  ON "certification_reviews"("certificationId", "reviewerId");
CREATE INDEX "certification_reviews_reviewerId_idx" ON "certification_reviews"("reviewerId");
CREATE INDEX "certification_reviews_certificationId_idx" ON "certification_reviews"("certificationId");

ALTER TABLE "certification_reviews"
  ADD CONSTRAINT "certification_reviews_certificationId_fkey"
  FOREIGN KEY ("certificationId") REFERENCES "certifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certification_reviews"
  ADD CONSTRAINT "certification_reviews_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
