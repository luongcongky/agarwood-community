# Huong dan van hanh danh cho Admin
## Hoi Tram Huong Viet Nam — Phien ban 2.0

> Tai lieu nay danh cho Ban Quan tri su dung he thong hang ngay.
> Cap nhat lan cuoi: 04/2026

---

## Muc luc

1. [Dang nhap va tong quan](#1-dang-nhap-va-tong-quan)
2. [Quan ly hoi vien](#2-quan-ly-hoi-vien)
3. [Xac nhan chuyen khoan](#3-xac-nhan-chuyen-khoan)
4. [Xet duyet chung nhan san pham](#4-xet-duyet-chung-nhan-san-pham)
5. [Xu ly bao cao vi pham](#5-xu-ly-bao-cao-vi-pham)
6. [Quan ly tin tuc](#6-quan-ly-tin-tuc)
7. [Quan ly don truyen thong](#7-quan-ly-don-truyen-thong)
8. [Cai dat he thong](#8-cai-dat-he-thong)
9. [Xu ly su co thuong gap](#9-xu-ly-su-co-thuong-gap)

---

## 1. Dang nhap va tong quan

### Dang nhap
- Truy cap: `https://[domain]/login`
- Tai khoan admin: email va mat khau do ky thuat cung cap
- Sau khi dang nhap, he thong tu dong chuyen den trang Tong quan `/admin`

### Trang Tong quan — viec can lam moi ngay
Moi sang mo trang `/admin`, ban se thay:

**Tang 1 — Canh bao (quan trong nhat)**
- DO: Van de can xu ly trong ngay (payment qua 24h, bao cao qua 48h)
- VANG: Can chu y trong tuan (membership sap het han, don chua xac nhan)
- XAM: Thong tin chung (hoi vien moi, SP vua chung nhan)

> Moi canh bao deu co link "Xu ly" — click vao de den thang trang xu ly.

**Tang 2 — So lieu**
- Hoi vien Active: so VIP dang hoat dong / tong slot
- Doanh thu thang: tong tien da xac nhan thang nay
- SP Chung nhan: tong san pham da duoc cap badge
- Don Truyen thong: so don dang xu ly

**Tang 3 — Bieu do** doanh thu 12 thang va phan bo hang hoi vien

**Tang 4 — Hoat dong gan day** — log 10 su kien moi nhat trong he thong

---

## 2. Quan ly hoi vien

### Xem danh sach hoi vien
- Truy cap: `/admin/hoi-vien`
- Header hien thi: so slot da dung / tong slot (vd: 87/100)
- 7 tab loc: Tat ca | Cho duyet | Active | Sap het han | Het han | Cho kich hoat | Vo hieu hoa
- Tim kiem theo ten, email, hoac ten cong ty

### 2 loai tai khoan VIP
| Loai | Mo ta | Quyen |
|------|-------|-------|
| **Doanh nghiep (BUSINESS)** | Dai dien cong ty tram huong | Day du: DN, SP, chung nhan, feed, tai lieu |
| **Ca nhan / Chuyen gia (INDIVIDUAL)** | Chuyen gia, nha nghien cuu, nghe nhan | Feed, ho so, tai lieu, gia han — KHONG co DN/SP/chung nhan |

### Duyet don dang ky
- Tab "Cho duyet" hien cac don tu trang /dang-ky va dang ky qua Google
- Moi don hien: ten, email, loai tai khoan (DN/Ca nhan), ly do (neu co)
- Don dang ky qua Google: co avatar Google, khong co ly do (admin lien he truc tiep neu can)
- Click "Duyet" → chuyen role GUEST → VIP, gui email kich hoat
- Click "Tu choi" → nhap ly do bat buoc, xoa tai khoan, gui email thong bao

### Tao hoi vien moi (thu cong)
1. Click "+ Tao hoi vien moi" (goc phai tren)
2. Chon 1 trong 2 che do:

**Che do 1 — Tao voi mat khau:**
- Dien: ten, email, SDT, mat khau tam thoi
- Tai khoan active ngay sau khi tao
- Gui mat khau cho hoi vien qua kenh rieng (Zalo, dien thoai)

**Che do 2 — Gui email moi:**
- Dien: ten, email, SDT
- He thong gui email voi link dat mat khau (het han sau 48h)
- Tai khoan o trang thai "Cho kich hoat" cho den khi hoi vien dat mat khau

### Xem chi tiet hoi vien
- Click "Chi tiet" tren dong hoi vien
- 5 tab: Membership | Thanh toan | Bai viet | Chung nhan | Thong tin
- Tab Membership: tong dong gop, hang, lich su dong phi
- Tab Thanh toan: thong tin TK ngan hang hoan tien

### Vo hieu hoa / Kich hoat lai
- Click "Vo hieu hoa" tren dong hoi vien -> xac nhan
- Hoi vien bi vo hieu hoa se khong the dang nhap
- Click "Kich hoat" de mo lai tai khoan

### Gui lai email moi
- Vao chi tiet hoi vien dang "Cho kich hoat"
- Click "Gui lai email moi" — tao link moi (het han 48h)

### Dat lai mat khau
- Vao chi tiet hoi vien -> click "Dat lai mat khau" (nut amber)
- He thong gui email voi link dat mat khau moi (het han 48h)
- Hoi vien click link -> dat mat khau moi -> tu dong dang nhap
- Dung khi: hoi vien quen mat khau, can reset mat khau bao mat

> **Luu y**: Khong co chuc nang xoa tai khoan. Chi vo hieu hoa.

---

## 3. Xac nhan chuyen khoan

### Quy trinh hang ngay
1. Truy cap: `/admin/thanh-toan`
2. So luong pending hien thi tren header
3. Filter theo: Tat ca | Membership | Chung nhan + Hom nay | Tuan nay

### Xac nhan (Confirm)
1. Doc thong tin: ten VIP, so tien, noi dung CK, thoi gian gui
2. Doi chieu voi bank statement (so tien + noi dung CK phai khop)
3. Click "Xac nhan" — **khong co hop thoai xac nhan** (de xu ly nhanh)
4. Badge chuyen sang "Da xac nhan" (xanh)

**He thong tu dong thuc hien:**
- Kich hoat membership (gia han them 1 nam)
- Cong dong gop tich luy
- Cap nhat muc uu tien feed
- Gui email thong bao cho VIP

### Tu choi (Reject)
1. Click "Tu choi" -> **bat buoc** nhap ly do
   - Vi du: "Khong tim thay giao dich voi noi dung nay trong bank statement"
2. Click "Xac nhan tu choi"
3. He thong gui email cho VIP kem ly do tu choi
4. Neu la phi chung nhan: trang hien TK ngan hang cua VIP de admin CK hoan tien

> **Quan trong**: Moi ngay nen check trang nay it nhat 1 lan. Payment cho qua 24h se hien canh bao DO tren dashboard.

---

## 4. Xet duyet chung nhan san pham

### Danh sach don
- Truy cap: `/admin/chung-nhan`
- Tab: Tat ca | Cho xac nhan TT | Cho duyet | Da duyet | Tu choi

### Quy trinh xet duyet
1. Click "Xem xet" tren don can duyet
2. Trang chi tiet 2 cot:

**Cot trai — Thong tin ho so:**
- Thong tin san pham: ten, loai, cong ty, vung nguyen lieu
- Tai lieu dinh kem: click de xem/tai ve
- Ghi chu cua hoi vien
- Thong tin TK hoan tien

**Cot phai — Thao tac:**
- Trang thai hien tai
- Ghi chu xet duyet (bat buoc khi tu choi, tuy chon khi duyet)

### Duyet don
1. Nhap ghi chu (tuy chon, vd: "San pham dat chat luong")
2. Click "Duyet & Cap Badge"
3. He thong tu dong:
   - Cap badge chung nhan tren trang san pham
   - Tao ma chung nhan: HTHVN-2026-0001
   - Gui email chuc mung cho VIP kem link verify

### Tu choi don
1. Nhap ly do tu choi (**bat buoc**)
   - Vi du: "Tai lieu kiem nghiem khong hop le, can bo sung"
2. Click "Xac nhan tu choi"
3. He thong:
   - Gui email cho VIP voi ly do cu the
   - Hien TK ngan hang cua VIP de admin hoan tien thu cong
4. Sau khi hoan tien: click "Xac nhan da hoan tien" tren trang chi tiet

> **Luu y**: Don cho duyet qua 7 ngay se hien canh bao DO tren dashboard.

---

## 5. Xu ly bao cao vi pham

### Khi nao can xu ly
- Dashboard hien canh bao khi co bao cao chua xu ly
- Bai viet tu dong bi khoa tam thoi khi nhan 5+ bao cao

### Cach xu ly
1. Truy cap: `/admin/bao-cao`
2. Doc ly do bao cao tu hoi vien
3. Xem noi dung bai viet
4. Quyet dinh:
   - **Giu nguyen**: Bao cao khong hop le -> dismiss
   - **Khoa bai**: Vi pham quy dinh -> khoa vinh vien

### Khoa bai viet
- Vao feed -> tim bai can khoa -> menu "..." -> "Khoa bai"
- Bai bi khoa: mo di, noi dung bi thay bang thong bao vi pham
- Admin van thay duoc ten tac gia va thoi gian dang

> **Luu y**: Bai bi khoa KHONG bi xoa khoi he thong. Chi an noi dung.

---

## 6. Quan ly tin tuc

### Dang tin tuc moi
1. Truy cap: `/admin/tin-tuc`
2. Click "+ Tao tin tuc"
3. Dien: tieu de, slug (tu dong tao tu tieu de), tom tat, noi dung (rich text)
4. Upload anh bia (tuy chon)
5. Chon: Xuat ban ngay hoac Luu nhap
6. Ghim tin quan trong len dau trang

### Chinh sua / Xoa tin tuc
- Click "Chinh sua" tren tin can sua
- Doi noi dung -> Luu
- Click "Xoa" de xoa vinh vien (can than, khong the khoi phuc)

---

## 7. Quan ly don truyen thong

### Tong quan CRM
- Truy cap: `/admin/truyen-thong`
- 5 card tom tat: Moi | Dang lam | Cho duyet | Hoan tat | Huy
- Bang danh sach voi filter theo trang thai

### Xu ly don
1. Click "Chi tiet" tren don can xu ly
2. **Cot trai**: Thong tin khach, yeu cau, tu khoa SEO, deadline
3. **Cot phai**: Thao tac

**Cac buoc xu ly theo status:**

| Buoc | Status | Admin lam gi |
|------|--------|-------------|
| 1 | NEW -> CONFIRMED | Doc yeu cau, nhap bao gia, phan cong nhan su |
| 2 | CONFIRMED -> IN_PROGRESS | Bat dau thuc hien, cap nhat ghi chu noi bo |
| 3 | IN_PROGRESS -> DELIVERED | Upload file bai viet hoan thanh |
| 4 | DELIVERED -> COMPLETED | Khach chap nhan, dong don |
| * | -> REVISION | Khach yeu cau chinh sua, quay lai IN_PROGRESS |
| * | -> CANCELLED | Huy don (nhap ly do) |

**Email tu dong gui theo tung status:**
- CONFIRMED: "Don da duoc xac nhan"
- IN_PROGRESS: "Dang thuc hien yeu cau"
- DELIVERED: "Bai viet da hoan thanh, vui long xem va phan hoi"
- COMPLETED: "Cam on da su dung dich vu"

---

## 8. Cai dat he thong

### Truy cap: `/admin/cai-dat`

### 4 nhom cai dat:

**Thong tin Hoi:**
- Ten hoi, email, SDT, dia chi
- Hien thi tren toan bo website, footer, email

**Phi & Gioi han:**
- Phi membership toi thieu / toi da (VND)
- Phi chung nhan san pham (VND)
- So slot VIP toi da
- Thay doi o day -> cap nhat ngay tren trang /gia-han

**Thong tin Chuyen khoan:**
- Ngan hang nhan, so TK, chu TK
- Thay doi o day -> cap nhat ngay tren huong dan CK cho VIP

**Hang hoi vien:**
- Nguong dong gop de thang hang Bac / Vang
- Ten hien thi tung hang

> **Quan trong**: Sau khi luu, he thong tu dong cap nhat cac trang lien quan. Khong can deploy lai.

---

## 9. Xu ly su co thuong gap

### Hoi vien khong nhan duoc email moi
1. Vao chi tiet hoi vien -> click "Gui lai email moi"
2. Neu van khong nhan: tao tai khoan voi mat khau tam thoi (che do 1)
3. Gui mat khau qua Zalo/dien thoai

### Hoi vien quen mat khau
1. Vao chi tiet hoi vien (`/admin/hoi-vien/[id]`)
2. Click "Dat lai mat khau" (nut amber)
3. He thong gui email voi link dat mat khau moi (het han 48h)
4. Hoi vien click link -> dat mat khau moi -> tu dong dang nhap

### Payment CK nhung noi dung sai
- Tu choi voi ly do "Noi dung CK khong khop"
- Huong dan VIP CK lai voi noi dung dung (format: HOITRAMHUONG-MEM-[ten]-[ngay])

### VIP phan nan bai khong len top feed
- Giai thich: uu tien feed dua tren dong gop + chat luong noi dung
- Dong gop nhieu hon -> authorPriority cao hon -> bai duoc uu tien
- Nhung noi dung hay (nhieu "Huu ich") cung duoc day len

### Slot VIP day
- Vao `/admin/cai-dat` -> tang "So slot VIP toi da"
- Hoac vo hieu hoa tai khoan khong con hoat dong de giai phong slot

---

> **Lien he ky thuat**: Khi gap su co ngoai pham vi tai lieu nay, lien he doi ngu ky thuat qua email/Zalo da cung cap.
