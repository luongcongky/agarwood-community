# Flow Feed cong dong

## Tai khoan test
- Khach: khong dang nhap
- GUEST (free tier): user moi dang ky tu /dang-ky
- VIP: nguyen.van.a@tramhuong-hn.vn / 123456
- Admin: admin@hoi-tram-huong.vn / 123456

## Phase 2 changes
- Bo flow "cho duyet" — dang ky xong la post duoc ngay (free tier 5 bai/thang)
- Quota thang thay the rule "3 bai/ngay" cu (TC-FEED-05 cap nhat)
- Bai co `category` (GENERAL/NEWS/PRODUCT) — chi VIP voi NEWS/PRODUCT moi len trang chu

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

### TC-FEED-05: Quota thang theo tier (Phase 2 — thay anti-spam 3/ngay cu)
1. Login GUEST (free tier) -> /feed/tao-bai
2. **Kiem tra**: Chip "Da dung 0/5 bai thang nay" hien o header
3. Dang 5 bai trong thang
4. **Kiem tra**: Sau bai thu 5, chip thanh "5/5", nut "Dang bai" disable
5. Co gang POST /api/posts -> **Kiem tra**: Server tra 429 + message "Ban da dang 5/5 bai thang nay..."
6. Login VIP★★ Vang -> /feed/tao-bai
7. **Kiem tra**: Chip "Han muc: ∞", khong gioi han

### TC-FEED-12: Phan loai bai viet (category — Phase 2)
1. Login VIP -> /feed/tao-bai
2. **Kiem tra**: Hien 3 chip chon loai: "Bai viet chung" (default) | "Tin doanh nghiep" | "Tin san pham"
3. Chon "Tin doanh nghiep" -> nhap noi dung -> Dang bai
4. Vao trang chu / -> **Kiem tra**: Bai vua post xuat hien o section "Tin doanh nghiep moi nhat"
5. Tao bai voi loai "Tin san pham"
6. **Kiem tra**: Bai xuat hien o section "Tin san pham moi nhat"

### TC-FEED-13: Bai cua GUEST khong len trang chu
1. Login GUEST -> /feed/tao-bai -> chon "Tin doanh nghiep"
2. Submit bai
3. Vao trang chu / -> section "Tin doanh nghiep moi nhat"
4. **Kiem tra**: Bai cua GUEST KHONG hien o section nay (chi VIP)
5. Vao /feed -> **Kiem tra**: Bai van hien binh thuong

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
- [ ] TC-FEED-12: PASS / FAIL
- [ ] TC-FEED-13: PASS / FAIL
