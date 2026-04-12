# Flow Thanh toan end-to-end

## Tai khoan test
- Hoi vien: nguyen.van.a@tramhuong-hn.vn / 123456
- Admin: admin@hoi-tram-huong.vn / 123456

## Kich ban

### TC-PAY-01: Hoi vien chon muc phi + thong tin CK hien thi dung
1. Login Hoi vien -> vao /gia-han
2. Chon muc 10.000.000d -> click "Xem huong dan chuyen khoan"
3. **Kiem tra**: So tien = 10.000.000d
4. **Kiem tra**: Noi dung CK format dung: `HOITRAMHUONG-MEM-NVA-YYYYMMDD`
5. **Kiem tra**: Thong tin ngan hang doc tu SiteConfig (khong hardcode)
6. **Kiem tra**: Nut "Copy" hoat dong, icon chuyen thanh checkmark 2 giay

### TC-PAY-02: Tao payment request -> trang thai PENDING
1. Tiep tuc tu TC-PAY-01
2. Click "Toi da chuyen khoan"
3. Nhap ghi chu (tuy chon) -> click "Gui xac nhan"
4. **Kiem tra**: Redirect den /thanh-toan/lich-su
5. **Kiem tra**: Payment moi nhat trang thai "Dang cho xac nhan" (vang)
6. **Kiem tra**: Noi dung CK hien thi dung

### TC-PAY-03: Admin thay payment ngay sau khi Hoi vien submit
1. Login Admin -> vao /admin/thanh-toan
2. **Kiem tra**: Payment cua Hoi vien xuat hien trong danh sach pending
3. **Kiem tra**: Hien thi: ten Hoi vien, so tien, noi dung CK, thoi gian "X phut truoc"

### TC-PAY-04: Admin confirm -> membership kich hoat
1. Tiep tuc tu TC-PAY-03
2. Click "Xac nhan" (khong co confirm dialog - inline loading)
3. **Kiem tra**: Badge chuyen sang "Da xac nhan" (xanh)
4. Login Hoi vien -> vao /tong-quan
5. **Kiem tra**: contributionTotal tang dung so tien
6. **Kiem tra**: displayPriority cap nhat
7. **Kiem tra**: membershipExpires duoc gia han them 1 nam

### TC-PAY-05: Admin tu choi -> email Hoi vien nhan ly do
1. Tao payment moi (lap lai TC-PAY-01 + TC-PAY-02)
2. Login Admin -> /admin/thanh-toan
3. Click "Tu choi" -> nhap ly do "Khong tim thay giao dich"
4. Click "Xac nhan tu choi"
5. **Kiem tra**: Badge chuyen sang "Da tu choi" (do)
6. **Kiem tra**: failureReason luu vao DB
7. Login Hoi vien -> /thanh-toan/lich-su
8. **Kiem tra**: Payment hien "Tu choi" voi ly do ro rang

### TC-PAY-06: Submit 2 lan cung 1 payment (idempotency)
1. Login Hoi vien -> /gia-han -> chon phi -> click "Xem huong dan CK"
2. **Kiem tra**: Payment PENDING duoc tao
3. Mo tab moi -> /gia-han -> chon phi -> click "Xem huong dan CK"
4. **Kiem tra**: Server tra ve loi 409 "Ban dang co yeu cau cho xac nhan"
5. **Kiem tra**: Chi co 1 payment PENDING trong DB

### TC-PAY-07: Email xac nhan gui den Hoi vien
1. Sau TC-PAY-04 (admin confirm)
2. **Kiem tra**: Hoi vien nhan email "Membership da duoc kich hoat"
3. **Kiem tra**: Email co ngay het han moi

### TC-PAY-08: Filter tab admin thanh toan
1. Login Admin -> /admin/thanh-toan
2. Click tab "Membership" -> chi hien payment loai MEMBERSHIP_FEE
3. Click tab "Chung nhan" -> chi hien CERTIFICATION_FEE
4. Click tab "Hom nay" -> chi hien payment ngay hom nay

## Ket qua
- [ ] TC-PAY-01: PASS / FAIL
- [ ] TC-PAY-02: PASS / FAIL
- [ ] TC-PAY-03: PASS / FAIL
- [ ] TC-PAY-04: PASS / FAIL
- [ ] TC-PAY-05: PASS / FAIL
- [ ] TC-PAY-06: PASS / FAIL
- [ ] TC-PAY-07: PASS / FAIL
- [ ] TC-PAY-08: PASS / FAIL
