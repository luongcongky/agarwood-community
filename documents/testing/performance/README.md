# Performance Optimization Test — Hoi Tram Huong Viet Nam

## Tong quan
- 4 nhom kiem tra
- 24 test case
- Muc tieu Lighthouse: >= 90 (Performance, Accessibility, Best Practices, SEO)

## Loi da fix trong qua trinh audit

| # | Van de | File | Fix |
|---|--------|------|-----|
| 1 | 3 trang public thieu revalidate | doanh-nghiep/[slug], san-pham/[slug], tin-tuc/[slug] | Them revalidate 3600/1800 |
| 2 | Payment.createdAt thieu index | prisma/schema.prisma | Them @@index([createdAt]) |
| 3 | Recharts import static (150KB+ tren moi trang) | admin/page.tsx | Dynamic import voi ssr:false qua DashboardChartsLoader |
| 4 | DashboardCharts co useSyncExternalStore thua | DashboardCharts.tsx | Xoa vi da dung ssr:false |
| 5 | Trang chu cho 350ms cold de wait DB queries fan-out | app/[locale]/(public)/page.tsx | Wrap NewsSection + MemberNewsRail + 5 section khac trong `<Suspense>` -> stream incremental, HTML dau flush ngay |
| 6 | Feed sidebar banner block server render | app/[locale]/(member)/feed/page.tsx | Tach `<SidebarBanners>` server component, Suspense boundary rieng |
| 7 | Feed initial load 20 bai -> TTFB cham + over-fetch | feed/page.tsx + api/posts/route.ts + FeedClient | Giam initial xuong 10 bai (cursor pagination 10 bai/lan) |
| 8 | News carousel query thieu index `(isPublished, isPinned, publishedAt)` | prisma/schema.prisma | Them composite index |
| 9 | Banner query thieu index covering startDate filter | prisma/schema.prisma | Them `(status, position, startDate, endDate)` |
| 10 | Middleware (proxy.ts) chay tren `/api/*` khong can thiet | proxy.ts matcher | Doi `api/auth` -> `api` trong matcher (bo qua toan bo /api) |
| 11 | i18n message dynamic import per-request | i18n/request.ts | Static import 4 locale o build-time, lookup O(1) |
| 12 | POST /api/posts: 5-10 query tuan tu (PRODUCT case), 2 query user trung lap | app/api/posts/route.ts | 1 user fetch + Promise.all([postCount, productCount, slugConflict, company]) -> giam ~50% RT |
| 13 | Image upload o editor sequential (5 anh = sum) | RichTextEditor.processImages + FeedClient.handleSubmit | Promise.all parallel upload -> max thay vi sum |
| 14 | Orphan image delete chan redirect sau POST | PostEditor.handleSubmit + handleCancel | Fire-and-forget + parallel delete |
| 15 | Full editor /feed/tao-bai cho ISR de bai moi hien | PostEditor + FeedClient | sessionStorage hand-off -> bai moi hien tuc thi tren /feed |
| 16 | revalidatePath("/feed") la no-op (path that la `/[locale]/feed`) | api/posts POST | Bo, giu lai `revalidatePath("/[locale]/feed", "page")` |
| 17 | Trang chu cold TTFB sau khi unstable_cache het han | vercel.json + api/cron/warm-homepage | Cron warm-up daily (Hobby) hoac mooi 5 phut (Pro) |
| 18 | Migration history thieu CREATE TABLE cho 5 table (db_push drift) | prisma/migrations/20260416200000_*, 20260416300000_* | Tao 2 baseline migration idempotent (CREATE TABLE IF NOT EXISTS + DO blocks) |

## Known issues (chua fix — low priority)

| # | Van de | Impact | Recommendation |
|---|--------|--------|----------------|
| 1 | 10 files dung raw `<img>` thay vi next/image | Medium | Config Cloudinary domain trong next.config, doi sang `<Image>` |
| 2 | TipTap khong dynamic import | Low | Chi load tren /feed/tao-bai, acceptable |
| 3 | Cold TTFB van ~350ms sau khi unstable_cache het | Low (co cron warm) | Tang revalidate 300 -> 600 neu data du stable |

## Danh sach file test

| # | File | So TC | Focus |
|---|------|-------|-------|
| 01 | [01-caching-strategy.md](01-caching-strategy.md) | 5 | Revalidate, ISR, cache invalidation |
| 02 | [02-database-queries.md](02-database-queries.md) | 5 | N+1, select, indexes, pagination |
| 03 | [03-image-optimization.md](03-image-optimization.md) | 6 | Cloudinary, lazy load, CLS, fallback |
| 04 | [04-bundle-web-vitals.md](04-bundle-web-vitals.md) | 8 | Lighthouse, dynamic import, LCP, CLS |

## Cach chay test
1. Build production: `npm run build && npm start`
2. Dung Chrome Lighthouse cho Web Vitals tests
3. Dung DevTools Network tab cho bundle/cache tests
4. Dung DevTools Performance tab cho LCP/CLS
5. Ghi lai Lighthouse scores vao checklist

## Revalidate strategy tong hop

```
0s    (realtime)  : /tong-quan, /ho-so, /gia-han, /thanh-toan/lich-su
                    /admin/* (tat ca trang admin)
60s   (1 phut)    : /admin (dashboard alerts), /feed (page-level)
300s  (5 phut)    : / (trang chu — moi section co unstable_cache rieng,
                    revalidate=300/600 + cron warm-homepage)
1800s (30 phut)   : /tin-tuc/[slug]
3600s (1 gio)     : /tin-tuc, /san-pham-chung-nhan, /hoi-vien
                    /doanh-nghiep/[slug], /san-pham/[slug]
```

## Cron warm-up

Tu turn nay tro di trang chu co cron `warm-homepage` chay:
- **Hobby (free)**: 1 lan/ngay luc 06:00 VN (`0 23 * * *` UTC) — warm cache truoc peak buoi sang
- **Pro (upgrade)**: doi schedule trong vercel.json thanh `*/5 * * * *` (mooi 5 phut)
- **External alternative tren Hobby**: setup cron-job.org / GitHub Actions goi `https://[domain]/api/cron/warm-homepage` voi header `Authorization: Bearer ${CRON_SECRET}`

Cron logic: `revalidateTag("homepage", "max")` -> Promise.all 5 fetcher chinh (`getAssociationNews`, top+rotating member posts, featured products, latest by NEWS/PRODUCT) -> repopulate cache.
