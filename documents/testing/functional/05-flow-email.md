# Flow Email

## Cau hinh
- Email service: Resend (RESEND_API_KEY trong .env.local)
- From: "Hoi Tram Huong Viet Nam <noreply@hoitramhuong.vn>"
- Test nhan email tren Gmail va Outlook

## Kich ban

### TC-EMAIL-01: Email moi hoi vien moi
1. Admin tao VIP moi voi che do "Gui email moi"
2. **Kiem tra**: Email den dung dia chi voi link dat mat khau
3. **Kiem tra**: Link format: /dat-mat-khau?token=xxx&email=xxx
4. Click link -> **Kiem tra**: Trang dat mat khau hien thi
5. Doi 48h (hoac chinh expires trong DB)
6. Click link -> **Kiem tra**: "Lien ket da het han"

### TC-EMAIL-02: Email xac nhan payment membership
1. VIP nop phi hoi vien -> Admin confirm
2. **Kiem tra**: VIP nhan email "Membership da duoc kich hoat"
3. **Kiem tra**: Email co ngay het han moi
4. **Kiem tra**: Email hien thi dung tren mobile

### TC-EMAIL-03: Email tu choi payment
1. VIP nop phi -> Admin tu choi voi ly do
2. **Kiem tra**: VIP nhan email "Chuyen khoan bi tu choi"
3. **Kiem tra**: Email co ly do tu choi ro rang

### TC-EMAIL-04: Email chung nhan duoc duyet
1. Admin duyet don chung nhan
2. **Kiem tra**: VIP nhan email "Chuc mung! San pham da duoc chung nhan"
3. **Kiem tra**: Email co ma chung nhan HTHVN-YYYY-XXXX
4. **Kiem tra**: Email co link verify: /verify/[slug]

### TC-EMAIL-05: Email chung nhan bi tu choi
1. Admin tu choi don chung nhan voi ly do
2. **Kiem tra**: VIP nhan email voi ly do tu choi
3. **Kiem tra**: Email co thong tin hoan tien

### TC-EMAIL-06: Email dat dich vu truyen thong (2 chieu)
1. Khach (guest hoac VIP) dat dich vu tai /dich-vu
2. **Kiem tra**: Khach nhan email xac nhan voi ma tham chieu MO-YYYYMMDD-XXXX
3. **Kiem tra**: Admin nhan email thong bao don moi voi day du thong tin
4. **Kiem tra**: Email admin co link den /admin/truyen-thong

### TC-EMAIL-07: Email tu dong khi doi status media order
1. Admin doi status don truyen thong sang CONFIRMED
2. **Kiem tra**: Khach nhan email "Don da duoc xac nhan"
3. Doi sang IN_PROGRESS -> **Kiem tra**: Email "Dang thuc hien"
4. Doi sang DELIVERED -> **Kiem tra**: Email "Bai viet da hoan thanh"
5. Doi sang COMPLETED -> **Kiem tra**: Email "Cam on da su dung"

### TC-EMAIL-08: Email admin khi VIP nop phi membership
1. VIP click "Toi da chuyen khoan" tai /gia-han
2. **Kiem tra**: Admin nhan email "[Hoi Tram Huong] Ten VIP vua xac nhan CK Xd"
3. **Kiem tra**: Email co link den /admin/thanh-toan

### TC-EMAIL-09: Email dat lai mat khau
1. Admin vao chi tiet hoi vien -> click "Dat lai mat khau"
2. **Kiem tra**: Hoi vien nhan email "Dat lai mat khau - Hoi Tram Huong Viet Nam"
3. **Kiem tra**: Email co nut "Dat mat khau moi" voi link /dat-mat-khau?token=xxx&email=xxx
4. **Kiem tra**: Email ghi "Lien ket co hieu luc trong 48 gio"
5. Click link -> **Kiem tra**: Trang dat mat khau hien thi voi email read-only
6. Nhap mat khau moi (8+ ky tu) -> **Kiem tra**: Thanh do luc hien thi (Yeu/Trung binh/Manh)
7. Nhap xac nhan khop -> Click "Kich hoat tai khoan"
8. **Kiem tra**: Trang thanh cong hien thi -> tu dong redirect den /tong-quan
9. Dang nhap lai voi mat khau cu -> **Kiem tra**: That bai
10. Dang nhap voi mat khau moi -> **Kiem tra**: Thanh cong

### TC-EMAIL-10: Hien thi email tren nhieu nen tang
1. Gui email test
2. Mo tren Gmail desktop -> **Kiem tra**: Layout khong bi vo
3. Mo tren Gmail mobile -> **Kiem tra**: Responsive dung
4. Mo tren Outlook -> **Kiem tra**: Khong bi loi CSS

## Ket qua
- [ ] TC-EMAIL-01: PASS / FAIL
- [ ] TC-EMAIL-02: PASS / FAIL
- [ ] TC-EMAIL-03: PASS / FAIL
- [ ] TC-EMAIL-04: PASS / FAIL
- [ ] TC-EMAIL-05: PASS / FAIL
- [ ] TC-EMAIL-06: PASS / FAIL
- [ ] TC-EMAIL-07: PASS / FAIL
- [ ] TC-EMAIL-08: PASS / FAIL
- [ ] TC-EMAIL-09: PASS / FAIL
- [ ] TC-EMAIL-10: PASS / FAIL
