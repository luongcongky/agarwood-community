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

## Known issues (chua fix — low priority)

| # | Van de | Impact | Recommendation |
|---|--------|--------|----------------|
| 1 | 10 files dung raw `<img>` thay vi next/image | Medium | Config Cloudinary domain trong next.config, doi sang `<Image>` |
| 2 | TipTap khong dynamic import | Low | Chi load tren /feed/tao-bai, acceptable |

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
0s    (realtime)  : /feed, /tong-quan, /ho-so, /gia-han, /thanh-toan/lich-su
                    /admin/* (tat ca trang admin)
60s   (1 phut)    : /admin (dashboard alerts)
1800s (30 phut)   : /tin-tuc/[slug]
3600s (1 gio)     : /, /tin-tuc, /san-pham-chung-nhan, /hoi-vien
                    /doanh-nghiep/[slug], /san-pham/[slug]
```
