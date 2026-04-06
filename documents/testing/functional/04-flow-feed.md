# Flow Feed cong dong

## Tai khoan test
- Guest: khong dang nhap
- VIP: nguyen.van.a@tramhuong-hn.vn / 123456
- Admin: admin@hoi-tram-huong.vn / 123456

## Kich ban

### TC-FEED-01: Guest thay feed nhung blur tu bai 4
1. Khong dang nhap -> truy cap /feed
2. **Kiem tra**: Feed load duoc, hien danh sach bai viet
3. **Kiem tra**: 3 bai dau hien noi dung day du (index 0,1,2)
4. **Kiem tra**: Bai thu 4 (index 3) tro di bi blur
5. **Kiem tra**: Guest khong thay nut "Huu ich" (chi thay so dem)
6. **Kiem tra**: Guest khong thay menu 3 cham
7. **Kiem tra**: Sidebar hien "Tham gia Hoi Tram Huong" + nut dang nhap

### TC-FEED-02: VIP dang bai -> xuat hien tren feed
1. Login VIP -> click "Chia se kien thuc..." (quick post box)
2. Redirect den /feed/tao-bai
3. Nhap tieu de + noi dung (>50 ky tu) + dinh kem 1 anh
4. Click "Dang bai"
5. **Kiem tra**: Redirect ve /feed
6. **Kiem tra**: Bai moi xuat hien trong feed
7. **Kiem tra**: authorPriority = user.displayPriority

### TC-FEED-03: PostCard hien thi dung theo spec
1. Xem 1 bai viet tren feed
2. **Kiem tra**: Avatar + Ten tac gia + Ten cong ty tren cung dong
3. **Kiem tra**: Badge hang (star1/star2/star3) mau dung
4. **Kiem tra**: Thoi gian dang relative ("2 gio truoc")
5. **Kiem tra**: Noi dung truncate 4 dong + nut "Xem them"
6. Click "Xem them"
7. **Kiem tra**: Noi dung expand inline (khong chuyen trang)

### TC-FEED-04: Menu 3 cham theo role
1. Login VIP A -> xem bai cua VIP B
2. Click menu "..." -> **Kiem tra**: Chi co "Bao cao bai viet"
3. Xem bai cua chinh minh
4. Click menu "..." -> **Kiem tra**: Co "Chinh sua" + "Xoa bai"
5. Login Admin -> xem bai bat ky
6. Click menu "..." -> **Kiem tra**: Co "Khoa bai" + "Xoa bai"

### TC-FEED-05: Anti-spam 3 bai/ngay
1. Login VIP -> dang bai 1 -> thanh cong
2. Dang bai 2 -> thanh cong
3. Dang bai 3 -> thanh cong
4. Dang bai 4
5. **Kiem tra**: Server tra loi 429 "Ban da dang 3 bai hom nay. Hen gap lai ban vao ngay mai nhe!"

### TC-FEED-06: Reaction "Huu ich" voi optimistic update
1. Login VIP -> click "Huu ich" tren 1 bai
2. **Kiem tra**: UI cap nhat ngay lap tuc (khong doi server)
3. **Kiem tra**: So dem tang len 1
4. Click lai -> **Kiem tra**: Unlike, so dem giam 1
5. Reload trang -> **Kiem tra**: Trang thai reaction giu nguyen voi DB

### TC-FEED-07: Report bai viet
1. Login VIP A -> click menu "..." tren bai cua VIP B
2. Click "Bao cao bai viet"
3. Nhap ly do -> submit
4. **Kiem tra**: Thong bao "Da gui bao cao"
5. Bao cao lai cung bai
6. **Kiem tra**: Server tra loi 409 "Ban da bao cao bai viet nay roi"

### TC-FEED-08: Admin lock bai
1. Login Admin -> feed -> click menu "..." tren 1 bai
2. Click "Khoa bai"
3. **Kiem tra**: Bai mo di (opacity thap)
4. **Kiem tra**: Noi dung thay bang "Noi dung da bi an do vi pham quy dinh"
5. **Kiem tra**: Reaction bar an
6. Guest/VIP xem bai do -> chi thay thong bao vi pham

### TC-FEED-09: Infinite scroll khong duplicate
1. Load feed -> scroll xuong cuoi
2. **Kiem tra**: 20 bai tiep theo load them
3. **Kiem tra**: Khong co bai bi lap lai
4. **Kiem tra**: Khong co bai bi skip
5. Tiep tuc scroll den het
6. **Kiem tra**: Hien "Da hien thi tat ca bai viet"

### TC-FEED-10: Xoa bai viet
1. Login VIP -> xem bai cua minh -> menu "..." -> "Xoa bai"
2. **Kiem tra**: Confirm dialog xuat hien
3. Click xac nhan
4. **Kiem tra**: Bai bien mat khoi feed
5. Reload -> **Kiem tra**: Bai khong con hien (status = DELETED)

### TC-FEED-11: Auto-save draft
1. Vao /feed/tao-bai -> nhap noi dung
2. Doi 30 giay
3. Dong tab -> mo lai /feed/tao-bai
4. **Kiem tra**: Hoi "Khoi phuc ban nhap?"
5. Click khoi phuc -> **Kiem tra**: Noi dung cu hien lai

## Ket qua
- [ ] TC-FEED-01: PASS / FAIL
- [ ] TC-FEED-02: PASS / FAIL
- [ ] TC-FEED-03: PASS / FAIL
- [ ] TC-FEED-04: PASS / FAIL
- [ ] TC-FEED-05: PASS / FAIL
- [ ] TC-FEED-06: PASS / FAIL
- [ ] TC-FEED-07: PASS / FAIL
- [ ] TC-FEED-08: PASS / FAIL
- [ ] TC-FEED-09: PASS / FAIL
- [ ] TC-FEED-10: PASS / FAIL
- [ ] TC-FEED-11: PASS / FAIL
