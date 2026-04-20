# Performance Test — Bundle & Core Web Vitals

## Ket qua audit code (da fix)

### Dynamic imports
| Component | Status | Chi tiet |
|-----------|--------|---------|
| Recharts (DashboardCharts) | PASS | **Da fix**: dynamic import voi ssr:false qua DashboardChartsLoader |
| TipTap (tao-bai) | NOT FIXED | Client component, chi load khi vao /feed/tao-bai (acceptable) |

### Bundle analysis (do qua `npm run build`, da xac nhan)
- Tiptap/prosemirror: ~449KB — dynamic import voi ssr:false, chi load tren /feed/tao-bai + /admin/tin-tuc/[id]
- Recharts: ~386KB — chi load tren /admin (dynamic import qua DashboardChartsLoader)
- react-dom: ~221KB — framework
- lucide-react icons: ~246KB tong — Next 16 da auto-optimize qua `optimizePackageImports`, day la subset thuc te dung
- Radix UI primitives: ~116KB
- core-js polyfills: ~110KB
- isomorphic-dompurify: ~15KB client-side (jsdom KHONG bi bundle vao client nho `serverExternalPackages`)
- **Total client JS chunks: ~3.5MB raw (~1MB gzip)**

**Loi nhan dien sai trong qua trinh audit (da revert)**: Co thoi diem da swap `isomorphic-dompurify` -> `dompurify` o 5 client component voi gia thiet "save 200KB jsdom". Build lai phat hien jsdom KHONG co trong client (chi co string `isJSDOM` flag tu react-aria), va `dompurify` thuan browser khong co `.sanitize` khi SSR -> trang `/feed`, `/bai-viet/[id]` etc tra 500. Da revert ve `isomorphic-dompurify`. Bundle size khong doi.

## Kich ban kiem tra

### TC-PERF-BUNDLE-01: Lighthouse trang chu >= 90
1. Chay production build: `npm run build && npm start`
2. Mo Chrome -> Lighthouse -> test trang /
3. **Kiem tra**: Performance >= 90
4. **Kiem tra**: Accessibility >= 90 (muc tieu 100)
5. **Kiem tra**: Best Practices >= 90
6. **Kiem tra**: SEO >= 90

### TC-PERF-BUNDLE-02: Lighthouse feed >= 80
1. Login VIP -> Lighthouse test /feed
2. **Kiem tra**: Performance >= 80 (feed dynamic, co the thap hon)
3. **Kiem tra**: LCP < 2.5s
4. **Kiem tra**: FID < 100ms
5. **Kiem tra**: CLS < 0.1

### TC-PERF-BUNDLE-03: Recharts chi load tren admin
1. Truy cap / (trang chu) -> DevTools -> Network -> JS tab
2. **Kiem tra**: Khong co recharts chunk load
3. Truy cap /admin -> DevTools -> Network -> JS tab
4. **Kiem tra**: recharts chunk load (dynamic import)

### TC-PERF-BUNDLE-04: TipTap chi load khi tao bai
1. Truy cap /feed -> DevTools -> Network -> JS tab
2. **Kiem tra**: Khong co tiptap chunk load
3. Click "Tao bai viet" -> vao /feed/tao-bai
4. **Kiem tra**: TipTap chunk load tai thoi diem nay

### TC-PERF-BUNDLE-05: LCP trang san pham < 2.5s
1. Lighthouse test /san-pham/[slug]
2. **Kiem tra**: LCP < 2.5s (anh san pham la LCP element)
3. **Kiem tra**: Anh dau tien load nhanh (khong lazy)

### TC-PERF-BUNDLE-06: CLS = 0 (khong layout shift)
1. Truy cap / -> disable cache -> slow 3G
2. **Kiem tra**: CLS = 0 hoac < 0.1
3. Truy cap /feed -> **Kiem tra**: Post cards khong nhay layout
4. Truy cap /san-pham-chung-nhan -> **Kiem tra**: Product grid on dinh

### TC-PERF-BUNDLE-07: Mobile performance (4G)
1. DevTools -> Network -> Fast 3G
2. Truy cap / -> do thoi gian load
3. **Kiem tra**: First paint < 1.5s
4. **Kiem tra**: Interactive < 3s
5. Truy cap /feed -> **Kiem tra**: First post hien < 2s

### TC-PERF-BUNDLE-STREAM: Homepage progressive streaming (Suspense)
1. `app/[locale]/(public)/page.tsx` — **moi section deu wrap `<Suspense>`** voi skeleton
   tu `components/features/homepage/skeletons.tsx`:
   - Banner TOP (BannerSlotSkeleton)
   - NewsSection (NewsSectionSkeleton) — **da fix tu turn nay** (truoc do block initial flush)
   - MemberNewsRail (MemberRailSkeleton) — **da fix tu turn nay**
   - CertifiedProductsCarousel (CarouselSkeleton)
   - Banner MID, LatestPostsSection × 2 (NEWS + PRODUCT), PartnersCarousel
2. **Hieu qua**: HTML dau flush gan nhu ngay (~17-30ms warm, ~350ms cold), cac
   section render khi data san sang -> user thay khung skeleton truoc, tranh
   "trang trang" cho het DB queries
3. **Kiem tra** (Lighthouse / WebPageTest):
   - TTFB nho (~20-50ms warm)
   - First Contentful Paint nhanh (skeleton hien som)
   - LCP do banner top hoac NewsSection — tuy thuoc data + cache state
   - Skeleton replace khong layout shift (CLS)
4. **Trade-off**: cold lan dau ~350ms vi data fetcher chua warm. Da co cron
   `warm-homepage` (`vercel.json`) chay daily 06:00 VN warm cache truoc peak.
5. List pages co `loading.tsx` skeleton rieng: `/tin-tuc`, `/san-pham-doanh-nghiep`,
   `/feed` (member route, sidebar banner cung Suspense)

### TC-PERF-BUNDLE-08: Font preload
1. Xem HTML source cua bat ky trang nao
2. **Kiem tra**: Font Inter va Playfair Display co preload link
3. **Kiem tra**: Font khong block rendering (display: swap)
4. **Kiem tra**: FOUT (flash of unstyled text) toi thieu

## Ket qua
- [ ] TC-PERF-BUNDLE-01: PASS / FAIL (Score: ___)
- [ ] TC-PERF-BUNDLE-02: PASS / FAIL (Score: ___)
- [ ] TC-PERF-BUNDLE-03: PASS / FAIL
- [ ] TC-PERF-BUNDLE-04: PASS / FAIL
- [ ] TC-PERF-BUNDLE-05: PASS / FAIL (LCP: ___s)
- [ ] TC-PERF-BUNDLE-06: PASS / FAIL (CLS: ___)
- [ ] TC-PERF-BUNDLE-07: PASS / FAIL
- [ ] TC-PERF-BUNDLE-08: PASS / FAIL
