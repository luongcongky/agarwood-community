-- Phase 3.6 (2026-04): audit history cho Post.
-- Pattern song song với product_revisions — snapshot mỗi lần admin/owner save.
-- Owner xem được diff giữa bản cuối của admin vs bản cuối của mình; admin
-- xem được toàn bộ history.

CREATE TABLE "post_revisions" (
  "id"            TEXT PRIMARY KEY,
  "postId"        TEXT NOT NULL,
  "version"       INTEGER NOT NULL,

  -- Snapshot
  "title"         TEXT,
  "content"       TEXT NOT NULL,
  "imageUrls"     TEXT[],

  -- Audit meta
  "editedBy"      TEXT NOT NULL,
  "editedRole"    TEXT NOT NULL,            -- "OWNER" | "ADMIN"
  "editedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason"        TEXT,
  "changedFields" TEXT[]
);

-- FK với CASCADE — xoá Post → xoá luôn revisions
ALTER TABLE "post_revisions"
  ADD CONSTRAINT "post_revisions_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "posts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- FK editor — không cascade (nếu xoá user thì revisions vẫn audit history,
-- editedBy chỉ là string ID, có thể fail join lookup nhưng không break)
ALTER TABLE "post_revisions"
  ADD CONSTRAINT "post_revisions_editedBy_fkey"
  FOREIGN KEY ("editedBy") REFERENCES "users"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

-- Unique (postId, version) — tránh race condition tạo 2 revision cùng version
CREATE UNIQUE INDEX "post_revisions_postId_version_key"
  ON "post_revisions"("postId", "version");

-- Index history list (chronological)
CREATE INDEX "post_revisions_postId_editedAt_idx"
  ON "post_revisions"("postId", "editedAt");

-- Index "latest revision của OWNER vs ADMIN" cho diff comparison
CREATE INDEX "post_revisions_postId_editedRole_version_idx"
  ON "post_revisions"("postId", "editedRole", "version");
