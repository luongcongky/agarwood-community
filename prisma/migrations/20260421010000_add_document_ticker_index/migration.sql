-- Compound index for BreakingTicker query:
--   WHERE isPublic = true AND createdAt >= <cutoff>
-- ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "documents_isPublic_createdAt_idx"
  ON "documents" ("isPublic", "createdAt");
