-- Phase 3.7 round 4 (2026-04): drop bảng `multimedia` + enum `MultimediaType`.
-- Data đã migrate sang News (template=PHOTO|VIDEO) bằng
-- scripts/migrate-multimedia-to-news.ts trước khi chạy migration này.
-- /multimedia/[slug] và /multimedia listing giờ đọc từ News.

DROP TABLE IF EXISTS "multimedia";
DROP TYPE IF EXISTS "MultimediaType";
