# Tai lieu Nghiep vu — Hoi Tram Huong Viet Nam
## Quy trinh, Chinh sach va SLA

> Tai lieu nay quy dinh cac quy trinh nghiep vu chinh thuc cua he thong.
> Ap dung cho Ban quan tri va toan the hoi vien.
> Phien ban: 2.0 | Cap nhat: 04/2026

---

## Muc luc

1. [Quy trinh dang ky hoi vien](#1-quy-trinh-dang-ky-hoi-vien)
2. [Quy trinh thanh toan va xac nhan](#2-quy-trinh-thanh-toan-va-xac-nhan)
3. [Quy trinh chung nhan san pham](#3-quy-trinh-chung-nhan-san-pham)
4. [Chinh sach hoan tien](#4-chinh-sach-hoan-tien)
5. [SLA xu ly don](#5-sla-xu-ly-don)
6. [Quy dinh noi dung cong dong](#6-quy-dinh-noi-dung-cong-dong)
7. [Chinh sach hang hoi vien](#7-chinh-sach-hang-hoi-vien)
8. [Quy trinh dich vu truyen thong](#8-quy-trinh-dich-vu-truyen-thong)
9. [Xu ly tranh chap](#9-xu-ly-tranh-chap)
10. [Phu luc — Bieu mau va Template](#10-phu-luc)

---

## 1. Quy trinh dang ky hoi vien

### 1.1 Hai loai tai khoan
| Loai | Doi tuong | Dieu kien |
|------|---------|-----------|
| **Doanh nghiep (BUSINESS)** | Cong ty, ho kinh doanh trong nganh tram huong | Co giay DKKD hop le |
| **Ca nhan (INDIVIDUAL)** | Chuyen gia, nha nghien cuu, nghe nhan, nha suu tam | Hoat dong lien quan tram huong |

### 1.2 Quyen theo loai tai khoan
| Tinh nang | Doanh nghiep | Ca nhan |
|-----------|:---:|:---:|
| Dang bai feed | ✓ | ✓ |
| Ho so ca nhan | ✓ | ✓ |
| Gia han membership | ✓ | ✓ |
| Tai lieu Hoi | ✓ | ✓ |
| Dich vu truyen thong | ✓ | ✓ |
| Profile doanh nghiep | ✓ | — |
| Tao san pham | ✓ | — |
| Chung nhan san pham | ✓ | — |

### 1.3 Quy trinh dang ky

**Cach 1 — Dang ky bang Google (nhanh):**
1. Click "Dang ky bang Google" tai /dang-ky
2. Chon tai khoan Google -> cap quyen
3. He thong tao don dang ky tu dong (trang thai cho duyet)
4. Ban quan tri xet duyet trong 3 ngay lam viec
5. Neu duoc duyet: tai khoan chuyen thanh VIP, dang nhap bang Google

**Cach 2 — Dang ky bang form:**
1. Dien form tai /dang-ky (chon loai: Doanh nghiep hoac Ca nhan)
2. Ban quan tri xet duyet trong 3 ngay lam viec
3. Neu duoc duyet: gui email kich hoat tai khoan
4. Hoi vien dat mat khau va dang nhap

**Sau khi duoc duyet (ca 2 cach):**
5. Dong phi membership thong qua chuyen khoan ngan hang
6. Admin xac nhan chuyen khoan -> membership kich hoat

### 1.4 Gioi han
- Toi da 100 hoi vien VIP (co the dieu chinh boi ban quan tri)
- Moi hoi vien dai dien cho 1 doanh nghiep (1 tai khoan = 1 cong ty)

---

## 2. Quy trinh thanh toan va xac nhan

### 2.1 Phuong thuc thanh toan
- Chi chap nhan: **Chuyen khoan ngan hang**
- Khong chap nhan: tien mat, the tin dung, vi dien tu

### 2.2 Thong tin chuyen khoan
- Ngan hang, so TK, chu TK: theo cau hinh he thong (admin cap nhat tai /admin/cai-dat)
- Noi dung CK bat buoc theo format:
  - Phi membership: `HOITRAMHUONG-MEM-[ten viet tat]-[YYYYMMDD]`
  - Phi chung nhan: `HOITRAMHUONG-CERT-[ten viet tat]-[YYYYMMDD]`

### 2.3 Quy trinh xac nhan
1. VIP chuyen khoan va bam "Toi da chuyen khoan" tren he thong
2. He thong tao yeu cau voi trang thai PENDING
3. He thong gui email thong bao cho admin
4. Admin doi chieu bank statement:
   - So tien khop
   - Noi dung CK khop
5. Admin xac nhan hoac tu choi tren he thong

### 2.4 Quy tac xac nhan
- **Xac nhan**: Chi khi da thay giao dich trong bank statement voi so tien va noi dung khop
- **Tu choi**: Khi khong tim thay giao dich hoac thong tin khong khop
- Tu choi PHAI co ly do cu the
- Sau khi xac nhan: KHONG the hoan tac

### 2.5 Thoi han xu ly
- Admin xu ly trong vong **24 gio lam viec** ke tu khi VIP xac nhan
- Qua 24 gio: he thong hien canh bao DO tren dashboard
- Xem them: [SLA xu ly don](#5-sla-xu-ly-don)

---

## 3. Quy trinh chung nhan san pham

### 3.1 Dieu kien nop don
- **Loai tai khoan: Doanh nghiep** (tai khoan Ca nhan khong the nop don chung nhan)
- Membership con hieu luc
- San pham da duoc tao tren he thong
- San pham chua co don chung nhan dang xu ly
- Da dien day du thong tin TK ngan hang hoan tien

### 3.2 Phi xet duyet
- **5.000.000 VND** (co the dieu chinh boi ban quan tri)
- Thanh toan truoc khi xet duyet
- Hoan lai neu bi tu choi (xem chinh sach hoan tien)

### 3.3 Quy trinh
| Buoc | Nguoi thuc hien | Mo ta | SLA |
|------|-----------------|-------|-----|
| 1 | VIP | Nop don + tai lieu + chuyen khoan | — |
| 2 | Admin | Xac nhan chuyen khoan | 24h |
| 3 | Admin | Xet duyet ho so (Online hoac Offline) | 7 ngay |
| 4a | Admin | Duyet -> cap badge + email | Ngay |
| 4b | Admin | Tu choi -> gui ly do + hoan tien | 5-7 ngay |

### 3.4 Hinh thuc xet duyet
- **Online**: Admin xet duyet dua tren tai lieu nop (giay kiem nghiem, CO/CQ, anh thuc te)
- **Offline**: Admin hoac chuyen gia den co so kiem tra truc tiep

### 3.5 Ma chung nhan
- Format: `HTHVN-[NAM]-[SO THU TU]` (vd: HTHVN-2026-0001)
- Ma duy nhat, khong trung lap
- Co the xac minh tai: `/verify/[slug-san-pham]`
- Co the in len bao bi san pham (QR code)

### 3.6 Hieu luc chung nhan
- Hien tai: khong gioi han thoi han
- Hoi co quyen thu hoi chung nhan neu phat hien vi pham

---

## 4. Chinh sach hoan tien

### 4.1 Truong hop duoc hoan
| Truong hop | So tien hoan | Dieu kien |
|-----------|-------------|-----------|
| Don chung nhan bi tu choi | 5.000.000 VND (100%) | Admin xac nhan tu choi |
| Loi he thong (CK thanh cong nhung khong ghi nhan) | 100% so tien CK | Admin xac nhan loi he thong |

### 4.2 Truong hop KHONG hoan
| Truong hop | Ly do |
|-----------|-------|
| Phi membership | Khong hoan du bat ky ly do gi |
| Don chung nhan da duyet | Da su dung dich vu |
| VIP tu huy tai khoan | Phi la dong gop cho hoi |

### 4.3 Quy trinh hoan tien
1. Admin xac nhan tu choi don chung nhan tren he thong
2. He thong hien TK ngan hang cua VIP cho admin
3. Admin thuc hien chuyen khoan hoan tien thu cong
4. Admin click "Xac nhan da hoan tien" tren he thong
5. He thong cap nhat trang thai thanh "Da hoan tien"

### 4.4 Thoi han hoan tien
- **5-7 ngay lam viec** ke tu ngay tu choi
- Neu qua thoi han, VIP co quyen lien he truc tiep ban quan tri

---

## 5. SLA xu ly don

### 5.1 Bang SLA

| Loai yeu cau | SLA | Canh bao |
|-------------|-----|---------|
| Xac nhan chuyen khoan | 24 gio lam viec | DO sau 24h |
| Xet duyet chung nhan | 7 ngay lam viec | DO sau 7 ngay |
| Hoan tien | 5-7 ngay lam viec | — |
| Tra loi don truyen thong | 24 gio lam viec | VANG sau 48h |
| Xu ly bao cao vi pham | 48 gio lam viec | DO sau 48h |
| Gui email moi hoi vien | Ngay lap tuc (tu dong) | VANG sau 72h chua kich hoat |

### 5.2 Ngay lam viec
- Thu 2 den Thu 6, 8:00 - 17:00
- Khong tinh: Thu 7, Chu nhat, ngay le

### 5.3 Cam ket
- Ban quan tri cam ket xu ly 100% yeu cau trong thoi han SLA
- He thong tu dong canh bao khi gan hoac qua SLA
- Hoi vien co quyen khieu nai neu SLA bi vi pham

---

## 6. Quy dinh noi dung cong dong

### 6.1 Noi dung duoc phep
- Chia se kien thuc, kinh nghiem ve tram huong
- Thong tin thi truong, gia ca, xu huong
- Gioi thieu san pham, doanh nghiep
- Hoi dap chuyen mon
- Thong bao su kien nganh

### 6.2 Noi dung CAM
- Thong tin sai lech, gia mao
- Spam, quang cao qua muc (qua 3 bai/ngay)
- Noi dung khong lien quan den nganh tram huong
- Ngon ngu thieu ton trong, pham phap
- Noi dung xam pham ban quyen

### 6.3 Xu ly vi pham
| Muc do | Hanh dong | Ai xu ly |
|--------|----------|---------|
| Lan 1 | Canh cao + khoa bai | Admin |
| Lan 2 | Khoa tai khoan 7 ngay | Admin |
| Lan 3 | Vo hieu hoa vinh vien | Ban quan tri |

### 6.4 Co che bao cao
- Hoi vien click "Bao cao bai viet" -> chon ly do
- Moi hoi vien chi bao cao 1 lan / bai
- Bai nhan 5+ bao cao: tu dong bi khoa tam thoi
- Admin xem xet trong 48 gio

---

## 7. Chinh sach hang hoi vien

### 7.1 Cac hang

| Hang | Dieu kien | Quyen loi |
|------|----------|---------|
| Hoi vien (1 sao) | Dong gop < 10 trieu | Quyen VIP co ban |
| Hoi vien Bac (2 sao) | Dong gop 10-20 trieu | Uu tien feed trung binh |
| Hoi vien Vang (3 sao) | Dong gop >= 20 trieu | Uu tien feed cao nhat |

### 7.2 Cach tinh dong gop tich luy
- Dong gop = tong tat ca phi membership da xac nhan
- Chi tinh phi membership (khong tinh phi chung nhan, dich vu truyen thong)
- Dong gop tich luy vinh vien, khong bi reset

### 7.3 Uu tien feed
- Bai viet cua hoi vien hang cao hon duoc uu tien hien thi
- Uu tien = dong gop tich luy (khong phai chi phi nam hien tai)
- Ngoai dong gop, chat luong noi dung (so "Huu ich") cung anh huong

### 7.4 Thay doi hang
- Tu dong thang hang khi dong gop dat nguong
- KHONG tu dong tut hang (dong gop tich luy khong giam)

---

## 8. Quy trinh dich vu truyen thong

### 8.1 Dich vu cung cap
| Dich vu | Mo ta | Thoi gian du kien |
|---------|-------|------------------|
| Bai viet doanh nghiep | Gioi thieu toan dien DN, toi uu SEO | 5-7 ngay |
| Bai viet san pham | Mo ta chi tiet SP, thu hut khach hang | 3-5 ngay |
| Thong cao bao chi | Soan thao + phan phoi den kenh truyen thong | 7-10 ngay |
| Noi dung MXH | San xuat noi dung Facebook/Instagram/Zalo | 3-5 ngay |

### 8.2 Quy trinh
1. **Dat hang**: Khach dien form tai `/dich-vu` (khong can dang nhap)
2. **Xac nhan**: Admin lien he trong 24h de xac nhan yeu cau va bao gia
3. **Thuc hien**: Doi ngu thuc hien, cap nhat tien do qua email
4. **Ban giao**: Gui bai viet hoan thanh, khach xem va phan hoi
5. **Chinh sua**: Toi da 2 lan chinh sua mien phi
6. **Hoan tat**: Khach chap nhan, thanh toan (neu chua thanh toan truoc)

### 8.3 Chinh sach huy
- Huy truoc khi bat dau thuc hien: mien phi
- Huy trong qua trinh thuc hien: phi 50% gia tri don
- Huy sau khi ban giao: khong hoan phi

---

## 9. Xu ly tranh chap

### 9.1 Giua hoi vien va ban quan tri
- Buoc 1: Hoi vien gui khieu nai qua email chinh thuc cua hoi
- Buoc 2: Ban quan tri phan hoi trong 3 ngay lam viec
- Buoc 3: Neu khong dat thoa thuan -> hop ban quan tri giai quyet trong 7 ngay
- Buoc 4: Quyet dinh cua ban quan tri la quyet dinh cuoi cung

### 9.2 Giua cac hoi vien
- Tranh chap noi dung tren feed: admin xem xet va quyet dinh
- Tranh chap thuong mai giua cac DN: hoi khong can thiep
- Hoi chi ho tro lam trung gian khi ca 2 ben dong y

### 9.3 Tranh chap ve chung nhan
- VIP khong dong y ket qua xet duyet: gui khieu nai kem tai lieu bo sung
- Ban quan tri xem xet lai trong 14 ngay lam viec
- Co the moi chuyen gia doc lap danh gia (phi do VIP chiu)

### 9.4 Luu tru bang chung
- Tat ca giao dich duoc log trong he thong (payment, certification, report)
- Email tu dong luu lai noi dung gui/nhan
- Admin khong the xoa ban ghi giao dich (chi doc, khong sua)

---

## 10. Phu luc

### 10.1 Bieu phi hien hanh
| Hang muc | So tien | Ghi chu |
|---------|---------|---------|
| Phi membership toi thieu | 5.000.000 VND/nam | Duy tri quyen VIP |
| Phi membership toi da | 10.000.000 VND/nam | Uu tien feed cao |
| Phi chung nhan SP | 5.000.000 VND/don | Hoan neu tu choi |

> Bieu phi co the thay doi. Ban quan tri cap nhat tai `/admin/cai-dat`.

### 10.2 Thong tin lien he
- Ten hoi: Hoi Tram Huong Viet Nam
- Email: (theo cau hinh tai /admin/cai-dat)
- SDT: (theo cau hinh tai /admin/cai-dat)
- Website: (theo domain he thong)

### 10.3 Lich su cap nhat tai lieu
| Phien ban | Ngay | Noi dung thay doi |
|-----------|------|------------------|
| 1.0 | 03/2026 | Tao tai lieu dau tien |
| 2.0 | 04/2026 | Cap nhat toan bo theo he thong moi |

---

> **Luu y**: Tai lieu nay co gia tri phap ly noi bo giua Hoi va hoi vien. Moi thay doi se duoc thong bao qua email truoc khi ap dung.
