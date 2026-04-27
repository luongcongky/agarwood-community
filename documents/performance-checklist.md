# Web Performance Checklist

Checklist tái sử dụng để audit + cải thiện performance cho bất kỳ trang nào trong dự án (Next.js 15 App Router). Số liệu mục tiêu bám theo Core Web Vitals của Google (pass/fail mobile):

| Metric | Good | Needs improve | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5 s | ≤ 4.0 s | > 4.0 s |
| FCP (First Contentful Paint) | ≤ 1.8 s | ≤ 3.0 s | > 3.0 s |
| INP (Interaction to Next Paint) | ≤ 200 ms | ≤ 500 ms | > 500 ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| TBT (Total Blocking Time, lab only) | ≤ 200 ms | ≤ 600 ms | > 600 ms |
| Total transfer (mobile) | ≤ 1.5 MB | ≤ 3 MB | > 3 MB |

## Công cụ audit

**Lab test — single page (reproducible):**
```bash
python scripts/perf-audit.py https://www.hoitramhuong.vn/
```

Script emulate iPhone 13 + Slow 4G (1.6 Mbps / 150ms RTT) + 4× CPU throttle giống Lighthouse mobile. Output:
- `perf-audit-result.json` — full metrics dump
- `perf-audit.png` — full-page screenshot
- In ra: FCP, LCP (+ tên element), CLS, TBT, DOM size, transfer, oversized images

**Lab test — multi page (viewer + VIP):**
```bash
# Build prod trước (dev mode quá chậm để đo accurate)
npm run build && AUTH_TRUST_HOST=true npm start &
python scripts/perf-audit-multi.py
```
- Login VIP test user + audit ~14 routes (viewer 9 + vip 5).
- Output: `perf-audit-multi.json` + bảng tóm tắt.
- Sửa `VIEWER_ROUTES` / `VIP_ROUTES` ở đầu script khi thêm route mới.

**Lab test — admin (chỉ admin):**
```bash
python scripts/perf-audit-admin.py http://localhost:3000 admin@hoitramhuong.vn Demo@123
```
Login admin + audit các route admin chính.

**Smoke test toàn site (3 modes):**
```bash
python scripts/smoke-test-all.py
```
Phát hiện HTTP 4xx/5xx, uncaught JS exception, console error, failed network request. Cover ~56 routes.

**Bundle analyzer (drill JS chunks):**
```bash
npm run build:analyze
```
Mở 2 tab tree-map: client + server bundles.

**Field test (real users):**
- [PageSpeed Insights](https://pagespeed.web.dev/) — dùng cả lab (Lighthouse) + field (CrUX data 28 ngày)
- Internal [WebVitalsReporter](components/features/layout/WebVitalsReporter.tsx) đã cài — gửi LCP/CLS/INP về analytics

**Lưu ý quan trọng cho self-host prod:** Khi chạy `npm start` ngoài Vercel,
phải set env `AUTH_TRUST_HOST=true` — nếu thiếu, mọi page có `auth()` sẽ
hang với `UntrustedHost` error (NextAuth v5 requirement). Vercel auto-set,
nhưng Docker / VPS / localhost cần set manual.

## Checklist audit

### A. Critical render path

- [ ] **A1. LCP element** — kiểm tra element gây LCP (audit JSON → `timing.lcpElement`). Nếu là ảnh: phải có `priority` prop (Next.js Image) + `fetchPriority="high"`. Nếu là text: không cần; nhưng font swap không được làm nhảy layout.
- [ ] **A2. Render-blocking requests** — tối đa 2 stylesheet + không có script đồng bộ trong `<head>`. Stylesheet thứ 3+ nên `media="print" onload="this.media='all'"` hoặc inline critical CSS.
- [ ] **A3. Font preload** — chỉ preload font đang dùng above-the-fold. Next.js `next/font/google` preload tất cả mặc định → tắt `preload: false` cho font chỉ dùng ở trang cụ thể. Đếm số `<link rel="preload" as="font">` trong audit JSON, cap ≤ 4.
- [ ] **A4. Font subsets tối thiểu** — `next/font/google` nhận `subsets: [...]`. Chỉ load subset thật sự cần: `vietnamese` + `latin` cho VN site; đừng thêm `cyrillic`, `greek` trừ khi cần. Mỗi subset thêm = 1 woff2 file.
- [ ] **A5. Font weights tối thiểu** — mỗi weight = 1 woff2 file × số subset. Dùng 3 weight là nhiều (400, 600, 700). Đừng khai báo 300/500 nếu CSS không `font-weight: 300` / `500`.
- [ ] **A6. Fonts conditional theo locale** — `Noto_Sans_SC`, `Noto_Sans_Arabic`, `Noto_Sans_JP`... chỉ load khi `<html lang="zh|ar|...">`. Load ở `app/layout.tsx` root sẽ áp cho mọi locale → waste. Move xuống `app/[locale]/layout.tsx` và branch theo locale.

### B. Images

- [ ] **B1. LCP image có `priority`** — ảnh đầu tiên user thấy (hero, above-the-fold) phải `<Image priority>` để Next.js không lazy-load. Kết hợp `fetchPriority="high"` (auto qua `priority`).
- [ ] **B2. `sizes` attribute đúng** — Next.js Image cần `sizes` để chọn variant đúng. Ví dụ: `sizes="(max-width: 768px) 100vw, 50vw"`. Thiếu → tải variant mặc định (thường lớn nhất).
- [ ] **B3. Oversized images** — audit JSON → `oversizedImages`. Ảnh `natural > 2× display` là lãng phí. Fix: cung cấp `sizes` phù hợp hoặc dùng Cloudinary transform `w_<display>`.
- [ ] **B4. Format hiện đại** — `next/image` tự serve WebP/AVIF. Check URL có `&q=75` và browser nhận `content-type: image/webp`. Nếu dùng `<img>` tự build: nên manual WebP + fallback JPG.
- [ ] **B5. Cloudinary transform** — khi ảnh upload qua helper, thêm `f_auto,q_auto` để Cloudinary tự chọn format + quality. Tránh transform `w_1200` cho mọi viewport.
- [ ] **B6. Lazy load ngoài viewport** — ảnh cuối trang nên `loading="lazy"` (default của Next.js Image trừ khi có `priority`). Check ảnh `inViewportInitial=false` trong audit: nếu `loading !== 'lazy'` → fix.
- [ ] **B7. Không dùng placeholder URL nặng** — loremflickr, picsum, unsplash bản public là third-party heavy. Dev-only. Production phải có ảnh thật hoặc placeholder Cloudinary nhẹ.

### C. JavaScript

- [ ] **C1. Bundle size** — kiểm tra `resourceSizeByType.script.bytes` trong audit. Homepage initial JS nên < 200 kB transfer. > 300 kB = dấu hiệu cần split.
- [ ] **C2. Long tasks (TBT)** — `timing.tbtApprox` trong audit. > 300ms = main thread blocked lâu. Nguyên nhân thường: hydration lớn, lib nặng (moment, chart, rich text editor) load ở root. Fix: dynamic import client component nặng.
- [ ] **C3. Third-party scripts async/defer** — tất cả script third-party (GA, FB pixel, chat widget) phải `<Script strategy="afterInteractive">` hoặc `"lazyOnload"`. Check audit `scripts[]` — không script nào thiếu async/defer.
- [ ] **C4. No duplicate deps** — `npm ls <lib>` không lặp version (vd 2 bản React Query). `@next/bundle-analyzer` liệt kê.
- [ ] **C5. Tree-shake lib nặng** — `date-fns`: import `import { format } from "date-fns/format"` thay vì `import { format } from "date-fns"`. `lodash`: dùng `lodash-es` + named import. `lucide-react`: named import.
- [ ] **C6. Unused JS < 30%** — chạy Chrome DevTools Coverage (Cmd+Shift+P → "Coverage"). Nếu unused > 50% trên initial chunks, có thể code bị load sớm mà chỉ dùng ở route khác → cần dynamic import.

### D. CSS

- [ ] **D1. CSS size** — Tailwind tree-shake tốt, homepage CSS nên < 100 kB transfer. > 200 kB = có CSS thừa hoặc @import global nặng.
- [ ] **D2. No FOUC** — stylesheet dùng `<link rel="stylesheet">` được Next.js tự động inline critical khi build. Tránh `<style>` tag động lớn.
- [ ] **D3. No layout shift từ font** — `font-display: swap` (default của Next.js) → CLS nhẹ khi font load. Để ≤ 0 shift, cần `size-adjust` fallback hoặc accept ~0.05 CLS.

### E. Network

- [ ] **E1. Preconnect tới domain ảnh/CDN** — `<link rel="preconnect" href="https://res.cloudinary.com">`. Tiết kiệm 100-300ms khi request ảnh đầu tiên.
- [ ] **E2. HTTP/2 hoặc HTTP/3** — kiểm tra audit resources có `protocol: "h2"` hoặc `"h3"`. Host như Vercel mặc định có; Cloudinary có. Custom domain cần cert + HTTP/2 enabled.
- [ ] **E3. Cache headers** — `_next/static/*` phải có `Cache-Control: public, max-age=31536000, immutable` (Vercel auto). Ảnh Cloudinary mặc định cache ~1 năm. HTML dynamic nên `s-maxage=3600` hoặc ISR.
- [ ] **E4. Gzip/Brotli** — transferSize nhỏ hơn decodedSize ít nhất 2× với text (JS/CSS/HTML). Check `resources[]`: nếu `transferSize ≈ decodedSize` → compression tắt.

### F. HTML / DOM

- [ ] **F1. DOM size** — audit `dom.totalNodes`. Good < 1500, warn > 3000, bad > 6000. DOM lớn = hydration lâu.
- [ ] **F2. No hidden heavy content** — đừng render 100+ item trong menu hamburger rồi `display: none`. Dùng `<details>` hoặc lazy render.
- [ ] **F3. Semantic HTML** — `<article>`, `<nav>`, `<main>` giúp crawl + a11y; không liên quan performance trực tiếp nhưng gây SEO + vote trong Lighthouse.

### G. SSR / caching

- [ ] **G1. Static rendering khi có thể** — homepage không cần session riêng biệt từng user → `force-static` hoặc ISR với `revalidate: 3600`.
- [ ] **G2. ISR đúng tags** — `unstable_cache` kèm `tags: [...]` + `revalidateTag()` trong API khi data đổi. Tránh `revalidate: 0` (per-request) trên page public.
- [ ] **G3. Tránh `await auth()` ở page public** — mỗi `auth()` = DB query. Nếu content giống nhau cho guest + user → static render + client-side check auth state.
- [ ] **G4. Tránh query nặng trong `generateMetadata`** — mỗi page load chạy cả `generateMetadata` và `Page`. Nếu cả 2 fetch cùng data → dùng `cache()` từ React để dedupe.
- [ ] **G5. N+1 query** — kiểm tra Prisma query: mỗi `findMany` + nested `map(async)` = khả năng N+1. Dùng `include` thay vì N queries.

### H. Third parties

- [ ] **H1. Đếm third-party hosts** — audit `thirdPartyHosts[]`. Càng ít càng tốt. Mỗi host = ít nhất 1 DNS lookup + TCP + TLS (~300ms on mobile).
- [ ] **H2. GA/Analytics** — `<Script strategy="afterInteractive">` thay vì sync. Cân nhắc self-host analytics (vd Plausible, Umami) để tránh blocking third-party.
- [ ] **H3. Chat widget / Intercom / Tawk** — chỉ load sau user interaction (click icon). Không auto-load khi page mount.
- [ ] **H4. YouTube embed** — dùng facade (lite-youtube-embed) thay vì iframe full. Save ~500 kB initial.

## Quick wins theo thứ tự ảnh hưởng

1. **Font loading** thường chiếm 40-60% transferSize trên site Next.js. Giảm subsets + weights + conditional load = 200-400 kB saved.
2. **LCP image priority + sizes** = 1-3s LCP improvement.
3. **Replace placeholder URLs** (loremflickr, picsum) = ảnh có kích thước đúng + cached.
4. **Dynamic import heavy client component** (TipTap, chart lib, modal) = 100-300 kB initial JS saved.
5. **Preconnect CDN** = ~200ms on first image request.

## Template audit report

Sau mỗi lần audit, copy template này + điền số:

```markdown
## Perf audit: <URL> (<date>)

**Lab (Slow 4G + 4× CPU, mobile):**
- FCP: X s  (target ≤ 1.8 s)
- LCP: X s  (target ≤ 2.5 s) → element: <tag, src>
- CLS: X    (target ≤ 0.1)
- TBT: X ms (target ≤ 200 ms)

**Transfer:**
- Fonts: X kB (X woff2 files)
- Images: X kB (X files)
- JS: X kB (X chunks)
- CSS: X kB

**Top issues (priority order):**
1. ...
2. ...
3. ...

**Fix applied:**
- [file:line] what changed, expected impact
```
