# Flow Chung nhan san pham end-to-end

## Tai khoan test
- Hoi vien: nguyen.van.a@tramhuong-hn.vn / 123456
- Admin: admin@hoi-tram-huong.vn / 123456

## Kich ban

### TC-CERT-01: Hoi vien khong co SP -> redirect tao SP truoc
1. Login Hoi vien khong co san pham (hoac xoa het SP)
2. Vao /chung-nhan/nop-don
3. **Kiem tra**: Dropdown san pham trong hoac hien thong bao tao SP truoc
4. **Kiem tra**: Co link den /san-pham/tao-moi

### TC-CERT-02: Hoi vien co SP dang pending cert -> khong cho nop trung
1. Login Hoi vien co SP da nop don PENDING
2. Vao /chung-nhan/nop-don -> chon SP do
3. **Kiem tra**: SP do bi disable hoac khong hien trong dropdown
4. Hoac: Submit -> server tra ve loi 409 "San pham nay dang co don dang xu ly"

### TC-CERT-03: State 3 buoc giu nguyen khi Back
1. Vao /chung-nhan/nop-don
2. Buoc 1: Chon SP -> Next
3. Buoc 2: Dien thong tin TK hoan tien + ghi chu -> Next
4. Buoc 3: Nhan "Back"
5. **Kiem tra**: Buoc 2 van giu nguyen data da dien
6. Nhan "Back" lan nua
7. **Kiem tra**: Buoc 1 van giu SP da chon

### TC-CERT-04: Khong dien TK hoan tien -> khong qua buoc 3
1. Buoc 2: Bo trong TK hoan tien (ten, so TK, ngan hang)
2. Click "Tiep theo"
3. **Kiem tra**: Hien thong bao loi yeu cau dien TK hoan tien
4. **Kiem tra**: Khong chuyen sang buoc 3

### TC-CERT-05: Nop don xong -> certStatus = PENDING
1. Hoan thanh 3 buoc -> click "Toi da chuyen khoan"
2. **Kiem tra**: Certification record tao voi status DRAFT
3. **Kiem tra**: Payment record tao voi status PENDING
4. **Kiem tra**: Noi dung CK format: HOITRAMHUONG-CERT-[initials]-[date]

### TC-CERT-06: Admin duyet -> badge + email
1. Login Admin -> /admin/thanh-toan -> confirm CK phi chung nhan
2. Vao /admin/chung-nhan -> tim don vua nop
3. Click "Xem xet" -> vao trang chi tiet
4. Nhap ghi chu (tuy chon) -> click "Duyet & Cap Badge"
5. **Kiem tra**: certStatus = APPROVED
6. **Kiem tra**: Product.badgeUrl duoc set
7. **Kiem tra**: Product.certApprovedAt duoc set
8. **Kiem tra**: Email gui den Hoi vien voi ma chung nhan HTHVN-YYYY-XXXX

### TC-CERT-07: Admin tu choi -> ly do + TK hoan tien
1. Tao don moi -> admin confirm CK -> vao xet duyet
2. Click "Tu choi" -> nhap ly do bat buoc
3. **Kiem tra**: Khong nhap ly do -> khong cho submit
4. Nhap ly do -> click "Xac nhan tu choi"
5. **Kiem tra**: certStatus = REJECTED
6. **Kiem tra**: TK hoan tien cua Hoi vien hien thi cho admin
7. **Kiem tra**: Email gui den Hoi vien voi ly do tu choi

### TC-CERT-08: Trang /verify/[certCode] tra ve thong tin dung
1. Sau TC-CERT-06 (da duyet)
2. Truy cap /verify/[product-slug]
3. **Kiem tra**: Hien "San pham da duoc chung nhan" (amber card)
4. **Kiem tra**: Ten SP, ten cong ty, ngay cap dung
5. Truy cap /verify/slug-khong-ton-tai
6. **Kiem tra**: Hien "Ma chung nhan khong hop le"

### TC-CERT-09: Lich su chung nhan Hoi vien
1. Login Hoi vien -> vao /chung-nhan/lich-su
2. **Kiem tra**: Tat ca don da nop hien thi voi trang thai dung
3. **Kiem tra**: Don APPROVED co link den trang verify
4. **Kiem tra**: Don REJECTED hien ly do tu choi

## Ket qua
- [ ] TC-CERT-01: PASS / FAIL
- [ ] TC-CERT-02: PASS / FAIL
- [ ] TC-CERT-03: PASS / FAIL
- [ ] TC-CERT-04: PASS / FAIL
- [ ] TC-CERT-05: PASS / FAIL
- [ ] TC-CERT-06: PASS / FAIL
- [ ] TC-CERT-07: PASS / FAIL
- [ ] TC-CERT-08: PASS / FAIL
- [ ] TC-CERT-09: PASS / FAIL
