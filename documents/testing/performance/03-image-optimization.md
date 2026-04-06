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
- [ ] TC-PERF-IMG-06: PASS / FAIL
