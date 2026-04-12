# Tai lieu Nghiep vu — Hoi Tram Huong Viet Nam
## Quy trinh, Chinh sach va SLA

> Tai lieu nay quy dinh cac quy trinh nghiep vu chinh thuc cua he thong.
> Ap dung cho Ban quan tri va toan the hoi vien.
> Phien ban: 3.2 | Cap nhat: 04/2026 — Phase 1-6 + Điều lệ integration + Văn bản pháp quy + Member application workflow

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

### 1.0 Phan loai theo Dieu le Hoi (Chuong II, Dieu 7)

Theo **Dieu le Hoi (sua doi, bo sung) 2023** — QD 1086/QD-BNV 29/12/2023,
hoi vien duoc chia thanh 3 hang:

| Hang | Mo ta | Quyen bieu quyet | Quyen ung cu |
|------|-------|:---:|:---:|
| **Chinh thuc (OFFICIAL)** | Hoi vien day du, gom Hoi vien to chuc + ca nhan | ✓ | ✓ |
| **Lien ket (AFFILIATE)** | DN khong du tieu chuan chinh thuc, DN FDI | — | — |
| **Danh du (HONORARY)** | Ca nhan/to chuc uy tin, dong gop cho Hoi | — | — |

> Hang nay (field `User.memberCategory`) doc lap voi *tier* Bac/Vang (field
> `contributionTotal`). Mot Hoi vien co the la "Chinh thuc" voi tier "Bac" dong thoi.

### 1.1 Hai loai tai khoan (ky thuat)
| Loai | Doi tuong | Dieu kien |
|------|---------|-----------|
| **Doanh nghiep (BUSINESS)** | Cong ty, ho kinh doanh trong nganh tram huong | Co giay DKKD hop le |
| **Ca nhan (INDIVIDUAL)** | Chuyen gia, nha nghien cuu, nghe nhan, nha suu tam | Hoat dong lien quan tram huong |

### 1.1.1 Nguoi dai dien to chuc (Dieu 7, Khoan 2c)
Hoi vien to chuc phai chi dinh **01 (mot) nguoi dai dien** lam dau moi tham
gia cac hoat dong cua Hoi:
- Luu tai `Company.representativeName` + `Company.representativePosition`
- Thay doi nguoi dai dien: thong bao Ban Thuong vu trong **5 ngay**
- Field xuat hien tren `/admin/hoi-vien/[id]` tab Thong tin

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

### 1.3 Quy trinh dang ky (Phase 2 — bo cho duyet)

**Cach 1 — Dang ky bang Google (nhanh):**
1. Click "Dang ky bang Google" tai /dang-ky
2. Chon tai khoan Google -> cap quyen
3. He thong tao tai khoan **kich hoat ngay** (role GUEST, free tier)
4. Tu dong dang nhap, dua den /feed

**Cach 2 — Dang ky bang form:**
1. Dien form tai /dang-ky (chon loai: Doanh nghiep hoac Ca nhan)
2. He thong tao tai khoan kich hoat ngay
3. Email confirmation co link dang nhap
4. Hoi vien dat mat khau va dang nhap

**Nang cap len Hoi vien (tuy chon, sau khi co tai khoan):**
5. Dong phi membership thong qua chuyen khoan ngan hang (xem muc 2)
6. Admin xac nhan chuyen khoan -> tai khoan tro thanh Hoi vien
7. Quota bai viet tang, bai len trang chu, mo khoa cac tinh nang Hoi vien

> **Phase 2 thay doi quan trong**: Khong con flow "ban quan tri xet duyet 3 ngay" cho user moi.
> Bat ky ai cung dang ky va dung he thong duoc ngay. Hoi vien la nang cap thuong, khong la gate.

### 1.3.1 Don ket nap Hoi vien chinh thuc (Dieu le, Dieu 11)

**Tai sao co 2 flow?** Flow dang ky o tren (1.3) chi tao *tai khoan ky thuat*.
Theo Dieu le Hoi, de duoc cong nhan la **Hoi vien chinh thuc**, user phai nop
don rieng va duoc Ban Thuong vu xet duyet — day la yeu cau phap ly cua hoi
xa hoi nghe nghiep.

**Quy trinh**:
1. User dang nhap → click avatar → "Don ket nap Hoi vien" (hoac vao `/ket-nap`)
2. Dien form:
   - Hang xin ket nap: Chinh thuc / Lien ket / Danh du
   - Ly do xin gia nhap (min 20 ky tu)
   - Nguoi dai dien + chuc vu (neu la to chuc BUSINESS)
3. Submit → tao `MembershipApplication` voi status `PENDING`
4. Admin xem tai `/admin/hoi-vien/don-ket-nap`:
   - Tab "Cho duyet" co badge count do
   - Click card → Approve (chon hang cuoi) hoac Reject (nhap ly do)
5. He thong tu dong gui email cho applicant:
   - Approved → User.memberCategory cap nhat + email "Chuc mung duoc cong nhan"
   - Rejected → email voi ly do tu choi

**SLA**: Ban Thuong vu xet duyet tai cac cuoc hop **hang quy**; Chu tich quyet
dinh trong vong **30 ngay** ke tu ngay nop don day du. Cac trang thai:
- `PENDING` — da nop, cho BCH xet
- `APPROVED` — Chu tich da ky quyet dinh cong nhan
- `REJECTED` — bi tu choi (co the nop lai sau)

**Idempotency**: user khong the nop don thu 2 khi dang co don `PENDING`.

### 1.4 Gioi han
- **Tai khoan free (GUEST)**: khong gioi han so luong dang ky
- **Hoi vien**: toi da 100 hoi vien (slot enforce o flow nang cap, khong o dang ky)
- Moi hoi vien dai dien cho 1 doanh nghiep (1 tai khoan = 1 cong ty)

### 1.5 Cac tinh nang theo trang thai tai khoan

| Tinh nang | Khach (chua login) | Tai khoan co ban | Hoi vien★ | Hoi vien★★ Bac | Hoi vien★★★ Vang |
|-----------|:---:|:---:|:---:|:---:|:---:|
| Xem trang chu, tin tuc | ✓ | ✓ | ✓ | ✓ | ✓ |
| Xem feed (3 bai dau) | ✓ blur | ✓ | ✓ | ✓ | ✓ |
| Dang bai feed | — | 5/thang | 15/thang | 30/thang | ∞ |
| Bai len trang chu | — | — | ✓ | ✓ | ✓ |
| Chung nhan SP | — | — | ✓ BUSINESS | ✓ | ✓ |
| **Banner QC** (Phase 6) | — | **1 mau/thang** | **5 mau/thang** | **10 mau/thang** | **20 mau/thang** |
| Tai lieu Hoi | — | — | ✓ | ✓ | ✓ |
| Dich vu truyen thong | ✓ | ✓ | ✓ | ✓ | ✓ |

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
1. Hoi vien chuyen khoan va bam "Toi da chuyen khoan" tren he thong
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
- Admin xu ly trong vong **24 gio lam viec** ke tu khi Hoi vien xac nhan
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
| 1 | Hoi vien | Nop don + tai lieu + chuyen khoan | — |
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
| Hoi vien tu huy tai khoan | Phi la dong gop cho hoi |

### 4.3 Quy trinh hoan tien
1. Admin xac nhan tu choi don chung nhan tren he thong
2. He thong hien TK ngan hang cua Hoi vien cho admin
3. Admin thuc hien chuyen khoan hoan tien thu cong
4. Admin click "Xac nhan da hoan tien" tren he thong
5. He thong cap nhat trang thai thanh "Da hoan tien"

### 4.4 Thoi han hoan tien
- **5-7 ngay lam viec** ke tu ngay tu choi
- Neu qua thoi han, Hoi vien co quyen lien he truc tiep ban quan tri

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
- Spam — quota thang chong spam (xem 6.5)
- Noi dung khong lien quan den nganh tram huong
- Ngon ngu thieu ton trong, pham phap
- Noi dung xam pham ban quyen

### 6.5 Quota dang bai theo thang (Phase 2)

| Trang thai | Quota/thang |
|-----------|------------|
| Tai khoan co ban | 5 bai |
| Hoi vien ★ | 15 bai |
| Hoi vien ★★ Bac | 30 bai |
| Hoi vien ★★★ Vang | Khong gioi han |

- Reset vao 0h ngay 1 hang thang
- Bai bi xoa khong duoc tinh lai quota (chong gian lan)
- Het quota -> nut "Dang bai" disable + thong bao "Da dung X/Y bai thang nay"
- Bai dang voi `category: NEWS` hoac `PRODUCT` cua Hoi vien co the len trang chu (section 5/6)
- Bai cua Tai khoan co ban khong len trang chu, chi hien o /feed

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
| Hoi vien (1 sao) | Dong gop < 10 trieu | Quyen Hoi vien co ban |
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
- Hoi vien khong dong y ket qua xet duyet: gui khieu nai kem tai lieu bo sung
- Ban quan tri xem xet lai trong 14 ngay lam viec
- Co the moi chuyen gia doc lap danh gia (phi do Hoi vien chiu)

### 9.4 Luu tru bang chung
- Tat ca giao dich duoc log trong he thong (payment, certification, report)
- Email tu dong luu lai noi dung gui/nhan
- Admin khong the xoa ban ghi giao dich (chi doc, khong sua)

---

## 10. Phu luc

### 10.1 Bieu phi hien hanh (theo Dieu le Hoi)

**Phi gia nhap** (1 lan khi ket nap — Dieu le, Dieu 11):

| Hoi vien | Phi gia nhap |
|----------|-------------|
| Ca nhan | 1.000.000 VND |
| To chuc / Lien ket | 2.000.000 VND |

**Nien lien hang nam** (toi thieu):

| Hoi vien | Nien lien toi thieu | Duy tri quyen |
|----------|---------------------|----------------|
| Ca nhan | **1.000.000 VND/nam** | Quyen hoi vien co ban |
| To chuc | **2.000.000 VND/nam** | Quyen hoi vien day du |

**Muc dong gop tu nguyen** (cao hon toi thieu — de len tier):

| Hang muc | So tien | Ghi chu |
|---------|---------|---------|
| Dong gop tu nguyen to chuc (khuyen nghi) | 10.000.000 VND/nam | Tier Bac (10tr) hoac Vang (20tr) |
| Dong gop tu nguyen ca nhan (khuyen nghi) | 2.000.000 VND/nam | Tier Bac (3tr) hoac Vang (5tr) |
| Phi chung nhan SP | 5.000.000 VND/don | Hoan neu tu choi |
| **Banner QC (Phase 6)** | **1.000.000 VND/mau/thang** | **Flat, khong discount theo tier** |

**SiteConfig keys** (admin chinh tai `/admin/cai-dat`):
- `join_fee_individual`, `join_fee_organization` — phi gia nhap 1 lan
- `membership_fee_min` (default 2tr to chuc), `membership_fee_max` (10tr)
- `individual_fee_min` (1tr ca nhan), `individual_fee_max` (2tr)

**Tai khoan chuyen khoan chinh thuc** (theo Dieu le):
- Ngan hang: Vietinbank
- STK: 116000060707
- Chu TK: HOI TRAM HUONG VIET NAM
- Noi dung CK: `[ten hoi vien] - nop phi gia nhap hoi vien` (lan dau)
  hoac `[ten hoi vien] - nop hoi phi` (nien lien)

> **Luu y**: Theo Dieu le, phi chinh thuc la muc toi thieu. Bieu phi chi tiet
> co the thay doi. Ban quan tri cap nhat tai `/admin/cai-dat`.

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
| 3.0 | 04/2026 | Phase 1-5: Open posting (bo cho duyet), quota thang, top 10 DN + top 20 SP tieu bieu, landing page Quyen loi hoi vien, trang chu newspaper layout |
| 3.1 | 04/2026 | Phase 6 (SPEC): chot business rules cho banner quang cao — 1tr/mau/thang, quota 1/5/10/20 theo tier, gia han duoc, hien thi rotate 5s top 20 slot |
| **3.2** | **04/2026** | **Dieu le Hoi integration**: 3 hang hoi vien (Chinh thuc / Lien ket / Danh du), phi dung Dieu le (gia nhap + nien lien), Don ket nap (/ket-nap + admin review), Van ban phap quy (/phap-ly voi 3 tabs), Nguoi dai dien to chuc, Hoi vien doi tac thuc te (9 DN Hoi vien Bac), menu restructure (Trang chu / Tin tuc / Nghien cuu / Doanh nghiep / San pham / Quyen loi) |

---

## 11. Banner quang cao (Phase 6 — du kien)

> **Status**: Phase 6 chua duoc trien khai. Day la business rules da chot voi khach 04/2026.
> Khi implement, doc them dac ta ky thuat tai `documents/testing/functional/08-flow-banner-quang-cao.md`.

### 11.1 Doi tuong su dung
- **Moi user dang nhap** deu co the dang ky banner (khac voi cac dich vu khac chi cho Hoi vien)
- Quota theo tier — Tai khoan co ban cung dung duoc nhung quota thap

### 11.2 Bieu phi va quota
| Tier | Quota mau/thang | Gia 1 mau |
|------|----------------|----------|
| Khach (chua dang ky) | 0 (khong dung duoc) | — |
| Tai khoan co ban | **1 mau/thang** | 1.000.000 VND/thang |
| Hoi vien ★ | **5 mau/thang** | 1.000.000 VND/thang |
| Hoi vien ★★ Bac | **10 mau/thang** | 1.000.000 VND/thang |
| Hoi vien ★★★ Vang | **20 mau/thang** | 1.000.000 VND/thang |
| ADMIN | Khong gioi han | — |

- Gia FLAT 1tr/mau/thang, **khong discount** theo tier
- Quota dem so banner ACTIVE trong cung 1 thang (hoa don dau thang)
- Tinh phi theo so thang dang ky (vi du: 3 thang = 3.000.000 VND)

### 11.3 Quy trinh dang ky banner
1. User vao `/banner/dang-ky` (yeu cau dang nhap)
2. Step 1: Chon thoi gian (toi thieu 1 thang) -> he thong tinh tong tien
3. Step 2: Upload anh banner (jpg/png, ti le 16:9 hoac 3:1, max 2MB) + nhap title + targetUrl
4. Step 3: Hien thong tin chuyen khoan -> user CK -> click "Da chuyen khoan"
5. He thong tao banner voi status `PENDING_APPROVAL`
6. Admin xac nhan CK + duyet noi dung -> banner -> `ACTIVE`
7. Banner xuat hien tren homepage Section 4 trong khoang `startDate <= now <= endDate`

### 11.4 Hien thi banner tren homepage
- Vi tri: Section 4 trang chu (giua Carousel SP va Tin DN)
- Width: trong max-w-7xl (nhat quan voi cac section khac)
- **Toi da 20 slot rotate** trong cung mot lan load trang
- **Auto-rotate moi 5 giay** -> banner ke tiep
- Pause khi user hover

### 11.5 Quy tac chon 20 slot khi co > 20 banner ACTIVE
- Uu tien theo tier: Hoi vien★★★ Vang -> Hoi vien★★ Bac -> Hoi vien★ -> Tai khoan co ban
- Trong cung tier: random hoac theo `createdAt DESC`
- Thay doi moi page load (de fair share)

### 11.6 Gia han banner
- User co the gia han banner ACTIVE sap het han (< 7 ngay)
- Phi gia han = 1.000.000 VND × so thang gia han them
- **KHONG dem vao quota thang** moi (khong tao banner moi)
- **KHONG can admin duyet noi dung lai** (chi confirm CK)
- He thong tu dong gui email "sap het han, gia han ngay" 7 ngay truoc khi expire

### 11.7 Quy dinh noi dung banner
- Lien quan den nganh tram huong (san pham, dich vu, su kien)
- Khong gay hieu lam, khong sai lech
- targetUrl phai la link nguon goc cua user (khong link doi thu)
- Anh ro net, dung ti le, khong vo lieu
- Vi pham -> admin tu choi + hoan tien (xem 11.8)

### 11.8 Tu choi va hoan tien
- Admin tu choi banner -> tu dong hoan tien 100% qua TK ngan hang cua user
- Quy trinh hoan tien giong nhu chung nhan SP (xem section 4)
- Thoi han: 5-7 ngay lam viec

### 11.9 Het han va xoa banner
- Banner het han (`endDate < now`) -> tu dong chuyen sang `EXPIRED` (cron daily)
- Banner EXPIRED khong hien thi tren homepage nhung van luu trong DB de tham khao
- User co the dang ky banner moi (KHONG la gia han) sau khi banner cu het han
- Admin co quyen xoa banner bat ky luc nao

---

---

## 12. Van ban phap quy cua Hoi

### 12.1 Danh sach van ban (trang `/phap-ly`)

Trang `/phap-ly` hien thi cong khai 3 tabs:

**Tab 1 — Dieu le Hoi**:
- Dieu le (sua doi, bo sung) 2023 — QD 1086/QD-BNV ngay 29/12/2023 — Bo Noi vu

**Tab 2 — Quy che noi bo** (7 van ban, Chu tich VAWA ban hanh):
1. Quy che hoat dong cua Ban Chap hanh Hoi (QD 48/QD-VAWA)
2. Quy che quan ly tai chinh cua Hoi (QD 49/QD-VAWA)
3. Quy che hoat dong cua Ban Thuong vu Hoi (QD 50/QD-VAWA)
4. Quy che hoat dong cua Ban Kiem tra Hoi (QD 52/QD-VAWA)
5. Quy che quan ly va su dung con dau (QD 54/QD-VAWA)
6. Quy che Hoi vien (QD 56/QD-VAWA)
7. Quy che hoat dong Van phong (QD 58/QD-VAWA)

**Tab 3 — Giay phep** (du kien):
- Giay phep Dai hoi (Bo Noi vu)

### 12.2 Luu tru van ban
- File PDF goc luu tren **Google Drive** cua Hoi (folder `VBPQ - *`)
- Admin upload/edit tai `/admin/phap-ly` — collapsible form
- Public trang `/phap-ly` dung `Document` model voi `category` in (DIEU_LE, QUY_CHE, GIAY_PHEP) + `isPublic: true`

### 12.3 Cap nhat van ban moi
Admin upload tai `/admin/phap-ly` voi thong tin:
- Phan loai (Dieu le / Quy che / Giay phep)
- Tieu de, so van ban, ngay ban hanh, co quan ban hanh
- Mo ta ngan
- Thu tu hien thi (sort order)
- File PDF (toi da 20MB)

He thong tu dong upload len Google Drive + luu metadata vao DB.

---

> **Luu y**: Tai lieu nay co gia tri phap ly noi bo giua Hoi va hoi vien. Moi thay doi se duoc thong bao qua email truoc khi ap dung.
