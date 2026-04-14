# Performance Test — Image Optimization

## Ket qua audit code

### Diem can cai thien (chua fix — low priority)
- 10 files dung raw `<img>` thay vi next/image `<Image>`
- Ly do: anh tu Cloudinary (external URL), Next Image can config domains
- Cloudinary da co auto format webp + quality auto khi dung transformation URL
- Avatar 80x80 khong can next/image (nho, khong anh huong LCP)

### Files dung raw <img>
| File | Context | Priority |
|------|---------|----------|
| FeedClient.tsx | Avatar 40x40 + post images | Low (avatar nho) |
| san-pham/[slug]/page.tsx | Product gallery | Medium |
| doanh-nghiep/[slug]/page.tsx | Logo + cover | Medium |
| CompanyTabs.tsx | Product thumbnails | Low |
| ProductForm.tsx | Upload preview | Low (admin only) |
| san-pham-chung-nhan/page.tsx | Product listing | Medium |
| ho-so/page.tsx | Avatar preview | Low |
| admin pages | Avatar nho | Low |

## Kich ban kiem tra

### TC-PERF-IMG-01: Anh Cloudinary format WebP
1. Upload 1 anh JPG qua /san-pham/tao-moi
2. Xem anh tren trang san pham
3. Mo DevTools -> Network -> kiem tra response
4. **Kiem tra**: Cloudinary tra ve format WebP (auto quality)
5. **Kiem tra**: URL chua /f_auto,q_auto/ (hoac tuong tu)

### TC-PERF-IMG-02: Anh duoi fold loading lazy
1. Truy cap /san-pham-chung-nhan (listing nhieu SP)
2. Mo DevTools -> Network -> filter Images
3. **Kiem tra**: Chi anh visible (above fold) load truoc
4. Scroll xuong
5. **Kiem tra**: Anh moi load khi gan viewport (lazy loading)

### TC-PERF-IMG-03: Avatar khong lam cham trang
1. Truy cap /feed (co nhieu avatar)
2. Mo DevTools -> Performance tab -> record
3. **Kiem tra**: Avatar (40x40) khong lam cham LCP
4. **Kiem tra**: LCP element la content chinh, khong phai avatar

### TC-PERF-IMG-04: Fallback khi khong co anh
1. Xem SP khong co anh -> **Kiem tra**: Gradient fallback hien thi
2. Xem DN khong co logo -> **Kiem tra**: Avatar voi 2 chu cai dau
3. Xem DN khong co anh bia -> **Kiem tra**: Brand gradient hien thi
4. **Kiem tra**: Khong co broken image icon

### TC-PERF-IMG-05: Upload file size limit
1. Thu upload anh > 5MB
2. **Kiem tra**: Server tu choi voi thong bao ro rang
3. Upload anh < 5MB -> **Kiem tra**: Thanh cong

### TC-PERF-IMG-BLUR: Blur placeholder cho next/image
1. Truy cap / (trang chu) tren 3G throttle -> quan sat anh PostCard, NewsSection,
   CertifiedProductsCarousel, marketplace grid
2. **Kiem tra**: Khi anh chua load, hien blur warm-beige (thay vi trang/xam)
3. **Kiem tra**: Khi load xong, fade muot sang anh that (khong giat)
4. **Ly do**: `lib/imageBlur.ts` export `BRAND_BLUR_DATA_URL` — 8x5 PNG base64
   ~120B, pass qua `next/image` prop `placeholder="blur" blurDataURL={...}`
5. Optional helper `cloudinaryBlurUrl(publicId)` — dung khi can blur base tu chinh anh
   (Cloudinary transform `w_8,q_10,e_blur:1000`) thay vi constant
6. Ap dung tai: PostCard (3 variants), NewsSection, CertifiedProductsCarousel,
   marketplace product grid

### TC-PERF-IMG-CAP: Cap width theo ngu canh (folder preset)
1. Upload cung 1 anh goc 4000x3000 qua cac form khac nhau, sau do kiem tra
   `secure_url` tra ve (mo URL truc tiep, xem width thuc te cua anh Cloudinary):
   - `/bai-viet/tao-moi` (folder `bai-viet`) → **Kiem tra**: width ≤ 1200px
   - `/admin/tin-tuc/tao-moi` (folder `tin-tuc`) → **Kiem tra**: width ≤ 1600px
   - `/san-pham/tao-moi` (folder `san-pham`) → **Kiem tra**: width ≤ 1600px
   - `/admin/doi-tac` upload logo (folder `doi-tac`) → **Kiem tra**: width ≤ 600px
   - `/admin/banner` upload (folder `banner`) → **Kiem tra**: width ≤ 2560px
2. Tai `/doanh-nghiep/chinh-sua`:
   - Upload logo → **Kiem tra**: width ≤ 600px (client override `maxWidth=600`)
   - Upload cover → **Kiem tra**: width ≤ 1920px (client override `maxWidth=1920`)
3. Upload anh goc nho hon cap (vd 800px vao folder `tin-tuc` cap 1600):
   **Kiem tra**: anh KHONG bi upscale (giu nguyen 800px) — Cloudinary `crop: "limit"`
4. Thu gui `maxWidth=50` (duoi 200) hoac `maxWidth=9999` (tren 4000):
   **Kiem tra**: server fallback ve preset cua folder, khong dung gia tri client
5. **Kiem tra**: Output van la `.webp`, URL co transform `c_limit,w_<cap>` va `f_auto,q_auto`
6. **Ly do**: Cap theo ngu canh giam byte tai ve dang ke so voi cap chung 1600px
   cu (vd logo doi tac 600px ~ 1/7 byte so voi 1600px)

### TC-PERF-IMG-06: CLS (Cumulative Layout Shift) do anh
1. Truy cap / (trang chu) -> disable cache
2. **Kiem tra**: Khong co layout shift khi anh load
3. Truy cap /san-pham/[slug] -> **Kiem tra**: Gallery khong nhay khi anh load
4. Ly do: dung aspect-ratio fixed (aspect-square) cho container

## Ket qua
- [ ] TC-PERF-IMG-01: PASS / FAIL
- [ ] TC-PERF-IMG-02: PASS / FAIL
- [ ] TC-PERF-IMG-03: PASS / FAIL
- [ ] TC-PERF-IMG-04: PASS / FAIL
- [ ] TC-PERF-IMG-05: PASS / FAIL
- [ ] TC-PERF-IMG-CAP: PASS / FAIL
- [ ] TC-PERF-IMG-06: PASS / FAIL
