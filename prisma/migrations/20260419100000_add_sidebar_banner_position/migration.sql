-- Add SIDEBAR banner position — a new ad inventory slot for the
-- vertical rail on /feed. Existing rows are unaffected.

ALTER TYPE "BannerPosition" ADD VALUE 'SIDEBAR';
