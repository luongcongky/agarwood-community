-- Sprint 1: online/offline review mode + proper fee calculation
-- - Replace boolean isOnlineReview with ReviewMode enum
-- - Drop VND*100 convention for feePaid (would overflow Int for 200M offline fee)
-- - Add productSalePrice snapshot (used to compute 2% online fee at submission time)
-- - Add unique certCode (HTHVN-YYYY-NNNN) — populated on APPROVED in Sprint 3

CREATE TYPE "ReviewMode" AS ENUM ('ONLINE', 'OFFLINE');

ALTER TABLE "certifications"
  ADD COLUMN "reviewMode" "ReviewMode" NOT NULL DEFAULT 'ONLINE',
  ADD COLUMN "productSalePrice" BIGINT,
  ADD COLUMN "certCode" TEXT;

-- Backfill reviewMode from legacy isOnlineReview
UPDATE "certifications"
SET "reviewMode" = CASE WHEN "isOnlineReview" THEN 'ONLINE'::"ReviewMode" ELSE 'OFFLINE'::"ReviewMode" END;

-- Normalize feePaid: legacy rows stored VND*100, new convention stores VND directly
UPDATE "certifications" SET "feePaid" = "feePaid" / 100;

ALTER TABLE "certifications" DROP COLUMN "isOnlineReview";
ALTER TABLE "certifications" ALTER COLUMN "feePaid" DROP DEFAULT;

CREATE UNIQUE INDEX "certifications_certCode_key" ON "certifications"("certCode");
