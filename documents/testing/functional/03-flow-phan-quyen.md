# Flow Phan quyen (Authorization)

## Tai khoan test
- Guest: khong dang nhap
- VIP A: nguyen.van.a@tramhuong-hn.vn / 123456
- VIP B: tran.thi.b@tramhuong-hcm.vn / 123456
- Admin: admin@hoi-tram-huong.vn / 123456

## Kich ban

### TC-AUTH-01: Khach (chua login) truy cap trang VIP -> redirect login
1. Khong dang nhap -> truy cap /tong-quan
2. **Kiem tra**: Redirect den /login?callbackUrl=/tong-quan
3. Truy cap /ho-so
4. **Kiem tra**: Redirect den /login?callbackUrl=/ho-so
5. Truy cap /feed/tao-bai (Phase 2: LOGGED_IN_PREFIXES — can login nhung khong can VIP)
6. **Kiem tra**: Redirect den /login?callbackUrl=/feed/tao-bai

### TC-AUTH-02: Guest truy cap trang Admin -> redirect login
1. Khong dang nhap -> truy cap /admin
2. **Kiem tra**: Redirect den /login?callbackUrl=/admin
3. Truy cap /admin/hoi-vien
4. **Kiem tra**: Redirect den /login?callbackUrl=/admin/hoi-vien

### TC-AUTH-03: VIP truy cap trang Admin -> redirect ve /
1. Login VIP -> truy cap /admin
2. **Kiem tra**: Redirect den / (khong phai /login)
3. Truy cap /admin/hoi-vien
4. **Kiem tra**: Redirect den /
5. Truy cap /admin/thanh-toan
6. **Kiem tra**: Redirect den /

### TC-AUTH-04: VIP A xem profile DN cua VIP B
1. Login VIP A -> truy cap /doanh-nghiep/tram-huong-sai-gon (DN cua B)
2. **Kiem tra**: Trang hien thi binh thuong (public page)
3. **Kiem tra**: KHONG co nut "Chinh sua" tren header
4. **Kiem tra**: KHONG co nut "+ Them san pham" trong tab San pham

### TC-AUTH-05: VIP A co sua thong tin cong ty B qua API
1. Login VIP A
2. Goi Server Action updateCompany voi data cua cong ty B
3. **Kiem tra**: Tra ve loi "Khong tim thay doanh nghiep" (vi action tim theo ownerId = user A)

### TC-AUTH-06: VIP A co sua SP cua VIP B qua API
1. Login VIP A
2. Goi Server Action updateProduct voi productId cua SP thuoc cong ty B
3. **Kiem tra**: Tra ve loi "Khong co quyen chinh sua" (403)

### TC-AUTH-07: Membership VIP het han -> bi vo hieu hoa quyen VIP
1. Login VIP co membership het han
2. Truy cap /feed -> **Kiem tra**: Feed hien thi binh thuong
3. Truy cap /feed/tao-bai (Phase 2: LOGGED_IN — VIP het han van post duoc nhu GUEST)
4. **Kiem tra**: Trang load OK, quota bi gioi han ve 5 bai/thang (free tier)
5. Truy cap /gia-han -> **Kiem tra**: Redirect den /membership-expired (MEMBER_PREFIX)
6. Truy cap /chung-nhan/nop-don -> **Kiem tra**: Redirect den /membership-expired

### TC-AUTH-08: Account isActive=false (VIP/ADMIN bi disable) -> login bi block
1. Admin vo hieu hoa tai khoan VIP (toggle isActive = false)
2. VIP co dang nhap voi mat khau dung
3. **Kiem tra**: Login that bai voi thong bao "Email hoac mat khau khong chinh xac"
4. **Kiem tra**: KHONG redirect duoc vao bat ky trang VIP nao

### TC-AUTH-08b: Legacy GUEST inactive (pre-Phase 2) -> auto-activate khi sign in
1. Tao 1 user voi `role: GUEST`, `isActive: false` (mo phong legacy data)
2. User do dang nhap (Credentials hoac Google)
3. **Kiem tra**: Login thanh cong (auto-activate)
4. **Kiem tra**: DB sau do hien `isActive: true` cho user nay
5. **Kiem tra**: User redirect ve / hoac /feed (tuy provider)

### TC-AUTH-09: Admin da dang nhap -> truy cap /login -> redirect
1. Login Admin -> truy cap /login
2. **Kiem tra**: Redirect den /admin (khong hien form login)
3. Login VIP -> truy cap /login
4. **Kiem tra**: Redirect den /tong-quan

### TC-AUTH-10: Guest xem feed -> content blur tu bai 4
1. Khong dang nhap -> truy cap /feed
2. **Kiem tra**: 3 bai dau hien noi dung day du
3. **Kiem tra**: Bai thu 4 tro di noi dung bi blur
4. **Kiem tra**: Tieu de bai viet khong bi blur (van doc duoc)
5. **Kiem tra**: Co nut "Dang nhap de doc" overlay tren noi dung blur

## Ket qua
- [ ] TC-AUTH-01: PASS / FAIL
- [ ] TC-AUTH-02: PASS / FAIL
- [ ] TC-AUTH-03: PASS / FAIL
- [ ] TC-AUTH-04: PASS / FAIL
- [ ] TC-AUTH-05: PASS / FAIL
- [ ] TC-AUTH-06: PASS / FAIL
- [ ] TC-AUTH-07: PASS / FAIL
- [ ] TC-AUTH-08: PASS / FAIL
- [ ] TC-AUTH-09: PASS / FAIL
- [ ] TC-AUTH-10: PASS / FAIL

---

## Kich ban bo sung — Loai tai khoan BUSINESS vs INDIVIDUAL

### TC-AUTH-11: VIP INDIVIDUAL khong thay menu DN/SP/CN
1. Login VIP loai INDIVIDUAL
2. **Kiem tra**: Menu KHONG co "Doanh nghiep", "Chung nhan SP"
3. **Kiem tra**: Menu CO "Tong quan", "Bang tin", "Tai lieu", "Gia han", "Ho so"

### TC-AUTH-12: VIP INDIVIDUAL khong truy cap duoc trang DN
1. Login VIP INDIVIDUAL -> truy cap /doanh-nghiep-cua-toi
2. **Kiem tra**: Hien "Chua co thong tin doanh nghiep"
3. Truy cap /san-pham/tao-moi
4. **Kiem tra**: Hien "Ban chua co doanh nghiep"

### TC-AUTH-13: VIP INDIVIDUAL khong nop don chung nhan duoc
1. Login VIP INDIVIDUAL -> truy cap /chung-nhan/nop-don
2. **Kiem tra**: Dropdown san pham trong (khong co SP vi khong co DN)

### TC-AUTH-14: VIP INDIVIDUAL van dang bai feed duoc
1. Login VIP INDIVIDUAL -> /feed/tao-bai
2. Nhap noi dung -> Dang bai
3. **Kiem tra**: Bai xuat hien tren feed voi label "Chuyen gia"

### TC-AUTH-15: VIP BUSINESS van thay day du menu
1. Login VIP loai BUSINESS
2. **Kiem tra**: Menu CO "Doanh nghiep", "Chung nhan SP"
3. **Kiem tra**: Truy cap /doanh-nghiep-cua-toi -> redirect den profile DN

### TC-AUTH-16: Dang ky voi loai INDIVIDUAL
1. Truy cap /dang-ky -> chon "Ca nhan / Chuyen gia"
2. **Kiem tra**: Form KHONG hien phan "Thong tin doanh nghiep"
3. Dien form + submit
4. **Kiem tra**: User tao voi accountType = INDIVIDUAL, KHONG co Company

### TC-AUTH-17: Dang nhap bang Google — user moi (Phase 2)
1. Truy cap /login -> click "Dang nhap bang Google"
2. Chon tai khoan Google chua co trong DB
3. **Kiem tra**: User tao voi role GUEST, **isActive = true** (Phase 2: kich hoat ngay)
4. **Kiem tra**: Redirect den /feed (KHONG con redirect /cho-duyet)
5. **Kiem tra**: Admin nhan email thong bao "[Dang ky moi qua Google]"
6. **Kiem tra**: User co the post bai ngay (5 bai/thang free tier)

### TC-AUTH-18: Dang nhap bang Google — user da co
1. Truy cap /login -> click "Dang nhap bang Google"
2. Chon tai khoan Google co email trung voi VIP da active trong DB
3. **Kiem tra**: Auto-link Google account, login thanh cong
4. **Kiem tra**: Redirect den /tong-quan

### TC-AUTH-19: Dang ky bang Google tai /dang-ky (Phase 2)
1. Truy cap /dang-ky -> click "Dang ky bang Google"
2. Chon tai khoan Google moi
3. **Kiem tra**: User tao voi role GUEST, isActive: true, redirect /feed
4. **Kiem tra**: Trang dang ky success message "Tai khoan da kich hoat" (khong con "1-3 ngay")

### TC-AUTH-20: GUEST truy cap member route -> redirect /landing (Phase 5)
1. Dang nhap voi account GUEST (free tier)
2. Truy cap /tong-quan
3. **Kiem tra**: Redirect den **/landing** (trang Quyen loi hoi vien)
4. Truy cap /gia-han -> **Kiem tra**: Redirect /landing
5. Truy cap /chung-nhan/nop-don -> **Kiem tra**: Redirect /landing

### TC-AUTH-21: Quota thang cho user post (Phase 2)
1. Login GUEST -> /feed/tao-bai
2. **Kiem tra**: Hien chip "Da dung 0/5 bai thang nay"
3. Dang 5 bai (cua user nay) trong thang
4. Vao /feed/tao-bai lan thu 6
5. **Kiem tra**: Chip "5/5 bai thang nay", nut "Dang bai" disable
6. POST /api/posts -> **Kiem tra**: Server tra 429 voi message het quota

### TC-AUTH-22: Open posting cho moi user dang nhap (Phase 2)
1. Login GUEST -> /feed/tao-bai
2. **Kiem tra**: Page load OK, khong bi redirect
3. **Kiem tra**: Co the chon category (GENERAL/NEWS/PRODUCT)
4. Submit bai -> **Kiem tra**: Tao thanh cong, hien o /feed

## Ket qua bo sung
- [ ] TC-AUTH-08b: PASS / FAIL
- [ ] TC-AUTH-11: PASS / FAIL
- [ ] TC-AUTH-12: PASS / FAIL
- [ ] TC-AUTH-13: PASS / FAIL
- [ ] TC-AUTH-14: PASS / FAIL
- [ ] TC-AUTH-15: PASS / FAIL
- [ ] TC-AUTH-16: PASS / FAIL
- [ ] TC-AUTH-17: PASS / FAIL
- [ ] TC-AUTH-18: PASS / FAIL
- [ ] TC-AUTH-19: PASS / FAIL
- [ ] TC-AUTH-20: PASS / FAIL
- [ ] TC-AUTH-21: PASS / FAIL
- [ ] TC-AUTH-22: PASS / FAIL
