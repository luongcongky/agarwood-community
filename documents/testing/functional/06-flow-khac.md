# Flow Khac

## Kich ban

### TC-OTHER-01: Upload anh Cloudinary
1. Login Hoi vien -> /doanh-nghiep/chinh-sua -> upload logo
2. **Kiem tra**: Anh upload thanh cong, preview hien thi
3. Upload anh bia -> **Kiem tra**: Preview hien thi
4. /san-pham/tao-moi -> upload nhieu anh
5. **Kiem tra**: Toi da 10 anh, anh dau tien la anh dai dien
6. **Kiem tra**: Nut xoa anh hoat dong dung

### TC-OTHER-02: San pham chung nhan filter + pagination
1. Truy cap /san-pham-chung-nhan
2. **Kiem tra**: Hien thi san pham APPROVED
3. Click filter loai "Tram tu nhien" -> **Kiem tra**: Chi hien SP loai do
4. Click filter vung "Khanh Hoa" -> **Kiem tra**: Chi hien SP vung do
5. Nhap search "tinh dau" -> **Kiem tra**: Ket qua tim kiem dung
6. Click sort "Ten A-Z" -> **Kiem tra**: Thu tu dung
7. Chuyen Grid/List view -> **Kiem tra**: Layout thay doi dung
8. Click trang 2 -> **Kiem tra**: SP khac hien thi, khong trung trang 1

### TC-OTHER-03: Sitemap.xml
1. Truy cap /sitemap.xml
2. **Kiem tra**: Tra ve XML hop le
3. **Kiem tra**: Co cac URL tin tuc moi nhat
4. **Kiem tra**: Co cac URL san pham chung nhan
5. **Kiem tra**: Co cac URL doanh nghiep

### TC-OTHER-04: Admin cai dat phi -> trang gia han cap nhat
1. Login Admin -> /admin/cai-dat
2. Doi "Phi membership toi thieu" tu 5000000 thanh 6000000
3. Luu cai dat
4. Login Hoi vien -> /gia-han
5. **Kiem tra**: Muc phi hien thi la 6.000.000d (khong phai 5.000.000d)
6. Doi lai ve 5000000 sau khi test

### TC-OTHER-05: Admin cai dat thong tin CK
1. Login Admin -> /admin/cai-dat
2. Doi "Ten ngan hang nhan" thanh "Techcombank"
3. Luu cai dat
4. Login Hoi vien -> /gia-han -> click "Xem huong dan CK"
5. **Kiem tra**: Ngan hang hien thi la "Techcombank"
6. Doi lai ve gia tri cu sau khi test

### TC-OTHER-06: Dashboard admin KPI dung
1. Login Admin -> /admin
2. **Kiem tra**: "Hoi vien Active" = so Hoi vien co membershipExpires > now
3. **Kiem tra**: "Doanh thu thang" = tong payment SUCCESS thang nay
4. **Kiem tra**: "SP Chung nhan" = so product APPROVED
5. **Kiem tra**: "Don Truyen thong" = so media order khong COMPLETED/CANCELLED

### TC-OTHER-07: Dashboard alert panel
1. Tao 1 payment PENDING, doi 24h (hoac chinh createdAt trong DB)
2. Login Admin -> /admin
3. **Kiem tra**: Alert do "X payment CK cho xac nhan qua 24h" hien thi
4. **Kiem tra**: Click vao alert -> redirect den /admin/thanh-toan

### TC-OTHER-08: Company profile dual-mode
1. Login Hoi vien A -> /doanh-nghiep/tram-huong-ha-noi (cong ty cua A)
2. **Kiem tra**: Nut "Chinh sua" hien tren header
3. **Kiem tra**: Tab San pham co nut "+ Them san pham"
4. Logout -> truy cap lai cung URL
5. **Kiem tra**: Khong co nut "Chinh sua"
6. **Kiem tra**: Khong co nut "+ Them san pham"

### TC-OTHER-09: San pham chi tiet - CTA theo role
1. Guest xem /san-pham/[slug]
2. **Kiem tra**: CTA = "Lien he doanh nghiep"
3. Login Hoi vien (khong phai owner) -> xem lai
4. **Kiem tra**: CTA = "Lien he doanh nghiep"
5. Login Hoi vien owner -> xem SP cua minh
6. **Kiem tra**: CTA = "Chinh sua san pham" + "Nop don chung nhan" (neu DRAFT)
7. Login Admin -> xem bat ky SP
8. **Kiem tra**: CTA = "Chinh sua"

### TC-OTHER-10: Trang ho so Hoi vien 4 tabs
1. Login Hoi vien -> /ho-so
2. **Kiem tra**: Header: avatar + ten + cong ty + tier + ngay con lai
3. Tab "Thong tin ca nhan": doi ten -> luu -> **Kiem tra**: Cap nhat thanh cong
4. Tab "Ngan hang": dien TK -> luu -> **Kiem tra**: Cap nhat thanh cong
5. Tab "Bao mat": doi mat khau -> **Kiem tra**: Mat khau cu sai -> bao loi
6. Tab "Lich su": **Kiem tra**: Bang lich su membership hien thi dung

### TC-OTHER-11: Hoi vien dashboard /tong-quan
1. Login Hoi vien -> /tong-quan
2. **Kiem tra**: Loi chao theo thoi gian ("Chao buoi sang/chieu/toi")
3. **Kiem tra**: 3 stat cards: Membership days, Bai viet count, SP chung nhan
4. **Kiem tra**: Thao tac nhanh: 4 link hoat dong dung
5. **Kiem tra**: Thong bao gan day: hien thi payment/cert gan nhat

### TC-OTHER-12: Tao hoi vien moi
1. Login Admin -> /admin/hoi-vien/tao-moi
2. Chon "Tao voi mat khau" -> dien form -> submit
3. **Kiem tra**: Tai khoan moi xuat hien trong danh sach
4. **Kiem tra**: Tai khoan active ngay
5. Tao Hoi vien khac voi "Gui email moi" -> submit
6. **Kiem tra**: Tai khoan tao voi isActive=false
7. **Kiem tra**: Email moi duoc gui

### TC-OTHER-13: Dich vu truyen thong
1. Truy cap /dich-vu (khong can login)
2. Dien form dat hang -> submit
3. **Kiem tra**: Trang cam on hien ma tham chieu MO-YYYYMMDD-XXXX
4. Login Admin -> /admin/truyen-thong
5. **Kiem tra**: Don moi hien trong danh sach status NEW
6. Click "Chi tiet" -> **Kiem tra**: Thong tin day du

## Ket qua
- [ ] TC-OTHER-01: PASS / FAIL
- [ ] TC-OTHER-02: PASS / FAIL
- [ ] TC-OTHER-03: PASS / FAIL
- [ ] TC-OTHER-04: PASS / FAIL
- [ ] TC-OTHER-05: PASS / FAIL
- [ ] TC-OTHER-06: PASS / FAIL
- [ ] TC-OTHER-07: PASS / FAIL
- [ ] TC-OTHER-08: PASS / FAIL
- [ ] TC-OTHER-09: PASS / FAIL
- [ ] TC-OTHER-10: PASS / FAIL
- [ ] TC-OTHER-11: PASS / FAIL
- [ ] TC-OTHER-12: PASS / FAIL
- [ ] TC-OTHER-13: PASS / FAIL
