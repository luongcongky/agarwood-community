-- Add _en/_zh variants for User.bio so members can fill their biography
-- in three languages from /ho-so.
ALTER TABLE "users" ADD COLUMN "bio_en" TEXT;
ALTER TABLE "users" ADD COLUMN "bio_zh" TEXT;

-- Add _en/_zh variants for Company.representativePosition so business
-- representatives can localize their job title alongside the company
-- description (already i18n'd in a previous migration).
ALTER TABLE "companies" ADD COLUMN "representativePosition_en" TEXT;
ALTER TABLE "companies" ADD COLUMN "representativePosition_zh" TEXT;
