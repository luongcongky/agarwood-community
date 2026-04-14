# Flow Tiêu biểu — DN, Sản phẩm tiêu biểu, Sản phẩm mới đăng ký

> Phase 4 (admin pin top 10 DN + top 20 SP) + flow tao SP moi cua Hoi vien

## Tai khoan test
- Khach: khong dang nhap
- GUEST: user moi dang ky tu /dang-ky
- Hoi vien A (Vang): binhnv@hoitramhuong.vn / Demo@123 (Tram Huong Khanh Hoa — featured #1)
- Hoi vien B (Bac): nguyenthilan@tinhdautramhuong.vn / Demo@123 (Tinh Dau Tram Huong Sai Gon — featured #3)
- Hoi vien C (Co ban): dangvantuan@tramhuongdaknong.vn / Demo@123 (Tram Huong Dak Nong — KHONG featured)
- Admin: admin@hoitramhuong.vn / Demo@123

## Du lieu seed lien quan
Sau khi chay `npx prisma db seed`:
- **3 doanh nghiep da pin featured**: Tram Huong Khanh Hoa (#1), Tram Huong Quang Nam (#2), Tinh Dau Tram Huong Sai Gon (#3)
- **5 san pham da pin featured**:
  1. Tram Huong Tu Nhien Khanh Hoa Loai A (APPROVED)
  2. Tram Huong Sanh Chim Phu Yen Dac Biet (APPROVED)
  3. Tinh Dau Tram Huong Nguyen Chat 10ml (APPROVED)
  4. Tram Huong Nuoi Cay Quang Nam Premium (APPROVED)
  5. Nhang Tram Huong Thu Cong 40cm (APPROVED)
- **3 san pham vua dang ky** (DRAFT, createdAt = 2-36 gio truoc):
  1. Tram Huong Toc Nui Khanh Hoa (Moi)
  2. Tinh Dau Tram Huong Roll-on 10ml (Moi)
  3. Tuong Phat Tram Huong Phu Yen (Moi)

---

## A. Quan ly Tieu bieu cua Admin

### TC-FEATURED-01: Admin truy cap trang quan ly Tieu bieu
1. Login Admin -> sidebar click "Tieu bieu" (icon ngoi sao)
2. **Kiem tra**: URL la `/admin/tieu-bieu`
3. **Kiem tra**: Hien 2 stats card o dau trang
   - "San pham tieu bieu: 5 / 20 da chon"
   - "Doanh nghiep tieu bieu: 3 / 10 da chon"
4. **Kiem tra**: 2 tab "San pham tieu bieu" (active mac dinh) va "Doanh nghiep tieu bieu"

### TC-FEATURED-02: Tab San pham — hien thi danh sach SP cua Hoi vien
1. Tai trang `/admin/tieu-bieu` tab "San pham tieu bieu"
2. **Kiem tra**: Bang hien thi tat ca SP cua doanh nghiep Hoi vien
3. **Kiem tra**: 5 cot — Tieu bieu (checkbox), Thu tu (number input), San pham (anh + ten), Doanh nghiep, Chung nhan
4. **Kiem tra**: 5 row co `isFeatured = true` co nen vang nhat (`bg-amber-50/40`)
5. **Kiem tra**: Cac SP DRAFT vua tao (3 SP "Moi") cung hien thi (vi co company = Hoi vien)
6. **Kiem tra**: SP cua DN khong-Hoi vien (vi du dang van tuan da het Hoi vien) **khong** xuat hien

### TC-FEATURED-03: Pin san pham moi (toggle ON)
1. Tai tab "San pham tieu bieu" -> tim row "Tram Huong Toc Nui Khanh Hoa (Moi)"
2. Tick checkbox "Tieu bieu"
3. **Kiem tra**: Row chuyen sang nen vang nhat ngay lap tuc (optimistic UI)
4. **Kiem tra**: O "Thu tu" enable (khong con disabled)
5. Nhap so 6 vao o "Thu tu"
6. **Kiem tra**: Auto-save — khong can click nut Luu
7. Refresh trang
8. **Kiem tra**: Trang thai van con (DB persisted)
9. **Kiem tra**: Stats card cap nhat "6 / 20 da chon"

### TC-FEATURED-04: Unpin san pham (toggle OFF)
1. Tai tab "San pham tieu bieu" -> tim row da pin (vd: Tram Huong Toc Nui Khanh Hoa)
2. Bo tick checkbox "Tieu bieu"
3. **Kiem tra**: O "Thu tu" tu dong xoa gia tri va disable
4. Refresh trang
5. **Kiem tra**: Stats card cap nhat lai "5 / 20"
6. **Kiem tra**: Row tro lai nen trang (khong con vang)

### TC-FEATURED-05: Doi thu tu pin (re-order)
1. Tai tab "San pham tieu bieu"
2. Tim SP "Nhang Tram Huong Thu Cong 40cm" (currently order 5)
3. Doi thu tu sang 1
4. **Kiem tra**: Auto-save thanh cong
5. Vao trang `/san-pham-tieu-bieu`
6. **Kiem tra**: Nhang Tram Huong gio xuat hien o vi tri #1 (badge "#1")

### TC-FEATURED-06: Pin san pham cua doanh nghiep KHONG Hoi vien -> bi tu choi
1. Tai tab "San pham tieu bieu"
2. (Pre-condition: chinh DB cho 1 user GUEST co company + 1 product)
3. Cac SP cua user nay **khong** xuat hien o bang admin (vi filter `owner.role: VIP (Hoi vien)`)
4. Goi truc tiep API: `PATCH /api/admin/products/[id-cua-sp-guest]/featured` voi body `{ isFeatured: true }`
5. **Kiem tra**: API tra `400` voi message "Chi co the chon san pham tieu bieu tu doanh nghiep Hoi vien"

### TC-FEATURED-07: Tab Doanh nghiep tieu bieu
1. Tai trang `/admin/tieu-bieu` -> click tab "Doanh nghiep tieu bieu"
2. **Kiem tra**: Bang hien thi 5 cot — Tieu bieu, Thu tu, Doanh nghiep, Chu so huu, Xac minh
3. **Kiem tra**: 3 row co isFeatured = true (Khanh Hoa, Quang Nam, Sai Gon) co nen vang nhat
4. Tick mot DN khac (vd: Tram Huong Phu Yen) -> nhap thu tu 4
5. **Kiem tra**: Auto-save thanh cong
6. **Kiem tra**: Stats card cap nhat "4 / 10 da chon"

### TC-FEATURED-08: Loi API -> revert UI optimistic
1. Tai tab "San pham tieu bieu"
2. Mo Network DevTools -> set offline
3. Tick checkbox de pin 1 SP
4. **Kiem tra**: Row chuyen vang ngay (optimistic)
5. **Kiem tra**: Sau ~3-5s, error message hien thi
6. **Kiem tra**: Row revert ve trang thai cu (router.refresh)

---

## B. Trang Cong khai — Sản phẩm Tiêu biểu

### TC-FEATURED-09: Trang `/san-pham-tieu-bieu` hien thi top 20
1. Truy cap `/san-pham-tieu-bieu`
2. **Kiem tra**: Header "San pham tieu bieu" (style nhat quan voi /tin-tuc)
3. **Kiem tra**: Subtitle "San pham tram huong duoc tuyen chon..."
4. **Kiem tra**: Hien 5 SP da pin (theo seed)
5. **Kiem tra**: Moi card co badge rank "#1", "#2", ... goc tren trai
6. **Kiem tra**: Thu tu sap xep theo `featuredOrder` ASC
7. **Kiem tra**: Card co badge "Cong nhan" neu certStatus = APPROVED
8. **Kiem tra**: CTA bottom "Dang ky Hoi vien" -> /dang-ky

### TC-FEATURED-10: Empty state khi chua pin SP
1. Vao `/admin/tieu-bieu` -> bo pin tat ca 5 SP
2. Truy cap `/san-pham-tieu-bieu`
3. **Kiem tra**: Hien empty state "Hien chua co san pham tieu bieu duoc chon"
4. **Kiem tra**: Co link "Xem san pham da chung nhan →"

### TC-FEATURED-11: Click card SP -> dieu huong dung
1. Tai `/san-pham-tieu-bieu`
2. Click vao SP "Tram Huong Tu Nhien Khanh Hoa Loai A"
3. **Kiem tra**: Redirect den `/san-pham/tram-huong-tu-nhien-khanh-hoa-loai-a`
4. **Kiem tra**: Trang detail load thanh cong

---

## C. Trang `/landing` — Top 10 DN + Top 20 SP

### TC-FEATURED-12: Section "Top 10 doanh nghiep tieu bieu"
1. Truy cap `/landing`
2. Scroll xuong section "Top 10"
3. **Kiem tra**: Hien 3 DN da pin (Khanh Hoa #1, Quang Nam #2, Sai Gon #3)
4. **Kiem tra**: Moi card co badge rank "#1", "#2", "#3"
5. **Kiem tra**: Logo + ten DN + badge "Verified" (neu isVerified)
6. **Kiem tra**: Click 1 DN -> redirect den `/doanh-nghiep/[slug]`

### TC-FEATURED-13: Section "Top 20 san pham hot trend"
1. Tai `/landing` -> scroll xuong section "Top 20"
2. **Kiem tra**: Hien 5 SP da pin theo thu tu
3. **Kiem tra**: Moi card co badge rank "#1" -> "#5" goc tren trai
4. **Kiem tra**: Card co badge cert (✓) goc tren phai neu APPROVED
5. **Kiem tra**: Link "Xem tat ca san pham tieu bieu →" -> /san-pham-tieu-bieu

### TC-FEATURED-14: Empty state khi chua pin DN
1. Bo pin tat ca DN trong /admin/tieu-bieu
2. Truy cap /landing
3. **Kiem tra**: Section "Top 10" hien empty state "Top doanh nghiep tieu bieu se duoc cong bo som"

---

## D. Trang chu — Carousel Sản phẩm Tiêu biểu (Phase 3 + 4)

### TC-FEATURED-15: Carousel hien thi SP tieu bieu tren homepage
1. Truy cap `/`
2. Scroll xuong section 3 "San pham tieu bieu"
3. **Kiem tra**: Title "San pham tieu bieu" + subtitle
4. **Kiem tra**: Carousel hien thi 5 SP da pin theo thu tu featuredOrder
5. **Kiem tra**: Moi item co badge "⭐ Tieu bieu" goc tren phai
6. **Kiem tra**: SP APPROVED co them badge "✓ Cong nhan" goc duoi phai
7. **Kiem tra**: Animation tu dong scroll ngang (60s loop)
8. Hover vao carousel
9. **Kiem tra**: Animation tam dung
10. Click 1 item -> redirect `/san-pham/[slug]`

### TC-FEATURED-16: Cache invalidation sau khi admin pin
1. Vao /admin/tieu-bieu -> pin them 1 SP moi (vd: Tram Huong Toc Nui Khanh Hoa Moi)
2. **Kiem tra**: API revalidateTag duoc goi (xem Network tab)
3. Truy cap / (trang chu)
4. **Kiem tra**: Trong vong 5 phut, SP moi pin xuat hien o carousel
5. (Stale-while-revalidate: lan dau co the thay data cu, lan refresh thu 2 thay data moi)

---

## E. San pham moi dang ky (flow tao SP cua Hoi vien)

### TC-FEATURED-17: Hoi vien tao SP moi
1. Login Hoi vien A (Tram Huong Khanh Hoa)
2. Truy cap `/doanh-nghiep-cua-toi` -> tab "San pham" -> click "+ Them san pham"
3. URL: `/san-pham/tao-moi`
4. Dien:
   - Ten: "SP Test Mua He 2026"
   - Slug: tu dong tao
   - Danh muc: "Tram tu nhien"
   - Mo ta: ">50 ky tu"
   - Muc gia: "1tr-3tr"
5. Submit
6. **Kiem tra**: Redirect ve trang DN, SP moi xuat hien trong tab San pham
7. **Kiem tra**: certStatus mac dinh = DRAFT (chua nop don)

### TC-FEATURED-18: Hoi vien INDIVIDUAL khong tao SP duoc
1. Login Hoi vien loai INDIVIDUAL (vi du tu mock)
2. Truy cap `/san-pham/tao-moi`
3. **Kiem tra**: Hien thong bao "Ban chua co doanh nghiep" hoac redirect

### TC-FEATURED-19: SP vua tao xuat hien o admin Tieu bieu
1. Login Hoi vien A -> tao 1 SP moi (TC-FEATURED-17)
2. Logout, login Admin
3. Truy cap `/admin/tieu-bieu` tab "San pham tieu bieu"
4. **Kiem tra**: SP vua tao xuat hien trong bang
5. **Kiem tra**: Co the pin SP nay (vi owner la Hoi vien)

### TC-FEATURED-20: SP vua tao hien o trang `/san-pham`
1. Tai trang chu / -> menu "San pham" hoac truy cap `/san-pham`
2. **Kiem tra**: Cac SP "Moi" tu seed (3 SP) hien thi
3. **Kiem tra**: Sap xep theo createdAt DESC (newest first) — SP vua tao xuat hien dau

### TC-FEATURED-21: SP DRAFT khong xuat hien o /san-pham-chung-nhan
1. Truy cap `/san-pham-chung-nhan`
2. **Kiem tra**: Chi hien SP co `certStatus: APPROVED`
3. **Kiem tra**: Cac SP "Moi" (DRAFT) **khong** xuat hien tai day

### TC-FEATURED-22: Hoi vien nop don chung nhan cho SP moi tao
1. Login Hoi vien A -> co 1 SP DRAFT vua tao
2. Truy cap `/chung-nhan/nop-don`
3. **Kiem tra**: Dropdown SP co liet ke SP DRAFT do
4. Nop don -> CK -> admin xac nhan -> SP chuyen sang PENDING -> APPROVED
5. **Kiem tra**: Sau khi APPROVED, SP xuat hien o `/san-pham-chung-nhan`
6. **Kiem tra**: Sau khi APPROVED, admin co the pin SP nay vao tieu bieu

---

## F. Quy tac validation va edge cases

### TC-FEATURED-23: Pin nhieu hon 20 SP -> public chi hien 20
1. Vao /admin/tieu-bieu -> pin 25 SP voi thu tu 1-25
2. **Kiem tra**: UI admin cho phep (soft limit)
3. Truy cap /san-pham-tieu-bieu
4. **Kiem tra**: Chi hien 20 SP dau (theo `take: 20`)
5. Truy cap /landing -> Section "Top 20"
6. **Kiem tra**: Tuong tu, chi hien 20

### TC-FEATURED-24: featuredOrder = NULL khi unpin -> SP bien mat
1. Pin 1 SP voi featuredOrder = 5
2. Unpin SP do
3. **Kiem tra**: Truy van DB: `featuredOrder` = NULL
4. **Kiem tra**: SP khong xuat hien o /san-pham-tieu-bieu nua

### TC-FEATURED-25: Hoi vien downgrade ve GUEST -> SP cua ho khong con featured
1. (Setup phuc tap): pin SP cua Hoi vien A
2. Admin chinh DB: doi `role` cua Hoi vien A thanh GUEST
3. Truy cap /san-pham-tieu-bieu
4. **Kiem tra**: SP cua Hoi vien A khong xuat hien (filter `owner.role: VIP (Hoi vien)`)
5. **Kiem tra**: Trang chu carousel cung khong show
6. (Note: Field `isFeatured` van con TRUE trong DB — chi filter o query, chua tu dong cleanup)

---

## Ket qua

### Admin Quan ly Tieu bieu (A)
- [ ] TC-FEATURED-01: PASS / FAIL
- [ ] TC-FEATURED-02: PASS / FAIL
- [ ] TC-FEATURED-03: PASS / FAIL
- [ ] TC-FEATURED-04: PASS / FAIL
- [ ] TC-FEATURED-05: PASS / FAIL
- [ ] TC-FEATURED-06: PASS / FAIL
- [ ] TC-FEATURED-07: PASS / FAIL
- [ ] TC-FEATURED-08: PASS / FAIL

### Trang San pham tieu bieu (B)
- [ ] TC-FEATURED-09: PASS / FAIL
- [ ] TC-FEATURED-10: PASS / FAIL
- [ ] TC-FEATURED-11: PASS / FAIL

### Landing — Top 10 DN + Top 20 SP (C)
- [ ] TC-FEATURED-12: PASS / FAIL
- [ ] TC-FEATURED-13: PASS / FAIL
- [ ] TC-FEATURED-14: PASS / FAIL

### Trang chu — Carousel (D)
- [ ] TC-FEATURED-15: PASS / FAIL
- [ ] TC-FEATURED-16: PASS / FAIL

### San pham moi dang ky (E)
- [ ] TC-FEATURED-17: PASS / FAIL
- [ ] TC-FEATURED-18: PASS / FAIL
- [ ] TC-FEATURED-19: PASS / FAIL
- [ ] TC-FEATURED-20: PASS / FAIL
- [ ] TC-FEATURED-21: PASS / FAIL
- [ ] TC-FEATURED-22: PASS / FAIL

### Validation va edge cases (F)
- [ ] TC-FEATURED-23: PASS / FAIL
- [ ] TC-FEATURED-24: PASS / FAIL
- [ ] TC-FEATURED-25: PASS / FAIL

**Tong**: 25 test case
