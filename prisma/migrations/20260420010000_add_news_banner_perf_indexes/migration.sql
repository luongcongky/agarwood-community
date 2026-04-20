-- Performance indexes for homepage queries.
--
-- News carousel: WHERE isPublished = true ORDER BY isPinned DESC, publishedAt DESC.
-- The existing news_category_isPublished_publishedAt_idx does not help when no
-- category filter is applied, so we add a dedicated index.
--
-- Banner slots (TOP/MID/SIDEBAR): WHERE status = 'ACTIVE' AND position = ?
--   AND startDate <= now() AND endDate >= now().
-- The existing banners_status_position_endDate_idx covers (status, position, endDate)
-- but Postgres still has to filter rows by startDate. The 4-column variant lets the
-- planner do a tighter range scan when both date bounds are checked.
--
-- Note: data is currently small (<1k rows in either table), so the standard
-- CREATE INDEX runs in milliseconds. If these tables grow past ~100k rows in
-- production, switch to CREATE INDEX CONCURRENTLY (run outside a transaction)
-- to avoid blocking writes during deploy.

CREATE INDEX IF NOT EXISTS "news_isPublished_isPinned_publishedAt_idx"
  ON "news" ("isPublished", "isPinned", "publishedAt");

CREATE INDEX IF NOT EXISTS "banners_status_position_startDate_endDate_idx"
  ON "banners" ("status", "position", "startDate", "endDate");
