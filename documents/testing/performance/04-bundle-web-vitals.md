# Performance Test — Bundle & Core Web Vitals

## Ket qua audit code (da fix)

### Dynamic imports
| Component | Status | Chi tiet |
|-----------|--------|---------|
| Recharts (DashboardCharts) | PASS | **Da fix**: dynamic import voi ssr:false qua DashboardChartsLoader |
| TipTap (tao-bai) | NOT FIXED | Client component, chi load khi vao /feed/tao-bai (acceptable) |

### Bundle analysis
- Recharts: ~200KB — chi load tren /admin (dynamic import)
- TipTap: ~150KB — chi load tren /feed/tao-bai (client route)
- DOMPurify: ~15KB — load o server + client (can thiet cho XSS protection)

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
1. `app/(public)/page.tsx` KHONG con `Promise.all` o top-level — moi section co
   data fetch rieng, wrap `<Suspense>` + skeleton (`components/features/homepage/skeletons.tsx`)
2. **Exception (co chu y)**: `NewsSection` (Tin Hoi) + `MemberNewsRail`
   (Ban tin hoi vien) KHONG wrap Suspense — block initial HTML flush de
   content chinh luon co mat khi first paint
3. Cac section khac (banners, CertifiedProductsCarousel, LatestPostsSection, partners)
   stream sau -> cai thien TTFB va LCP cua main content
4. **Kiem tra** (Lighthouse / WebPageTest):
   - TTFB van nho (Tin Hoi block nhung nhanh — cung cache)
   - LCP element = Tin Hoi heading/thumbnail (above fold, khong cho stream)
   - Cac skeleton hien nhanh o banner/carousel slot, sau do replace khong layout shift
5. List pages co `loading.tsx` skeleton rieng: `/tin-tuc`, `/san-pham-doanh-nghiep`
6. Trade-off: TTFB cao hon 1 chut so voi full-streaming, nhung LCP on dinh —
   tranh case man hinh trong hoac nhay skeleton tren main content

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
