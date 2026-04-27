-- Sprint: Committee (ban/ủy ban) — two-layer permission model
-- Role tiếp tục là baseline; Committee cộng thêm permission trên nền role.
-- Xem `lib/permissions.ts` để biết mapping committee → permissions.
--
-- Migrate `users.isCouncilMember=true` → CommitteeMembership(committee=THAM_DINH).
-- Field isCouncilMember giữ lại 1 sprint để rollback được, sẽ drop ở migration sau.

CREATE TYPE "Committee" AS ENUM (
  'THUONG_VU',
  'CHAP_HANH',
  'KIEM_TRA',
  'THAM_DINH',
  'THU_KY',
  'TRUYEN_THONG'
);

CREATE TABLE "committee_memberships" (
  "id"         TEXT         NOT NULL,
  "userId"     TEXT         NOT NULL,
  "committee"  "Committee"  NOT NULL,
  "position"   TEXT,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedBy" TEXT,
  CONSTRAINT "committee_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "committee_memberships_userId_committee_key"
  ON "committee_memberships"("userId", "committee");
CREATE INDEX "committee_memberships_committee_idx"
  ON "committee_memberships"("committee");
CREATE INDEX "committee_memberships_userId_idx"
  ON "committee_memberships"("userId");

ALTER TABLE "committee_memberships"
  ADD CONSTRAINT "committee_memberships_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "committee_memberships"
  ADD CONSTRAINT "committee_memberships_assignedBy_fkey"
  FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: mọi user đang isCouncilMember=true → thêm 1 row THAM_DINH.
-- Dùng gen_random_uuid()::text làm id — đủ unique cho batch một lần.
INSERT INTO "committee_memberships" ("id", "userId", "committee", "position", "assignedAt", "assignedBy")
SELECT
  gen_random_uuid()::text,
  "id",
  'THAM_DINH'::"Committee",
  NULL,
  CURRENT_TIMESTAMP,
  NULL
FROM "users"
WHERE "isCouncilMember" = true;
