# Huong dan su dung danh cho Hoi vien VIP
## Hoi Tram Huong Viet Nam — Phien ban 2.0

> Chao mung ban gia nhap cong dong Hoi Tram Huong Viet Nam!
> Tai lieu nay huong dan ban su dung day du cac tinh nang cua he thong.
> Cap nhat lan cuoi: 04/2026

---

## Muc luc

1. [Dang nhap lan dau](#1-dang-nhap-lan-dau)
2. [Tong quan Dashboard](#2-tong-quan-dashboard)
3. [Cap nhat ho so ca nhan](#3-cap-nhat-ho-so-ca-nhan)
4. [Quan ly doanh nghiep](#4-quan-ly-doanh-nghiep) *(chi Doanh nghiep)*
5. [Quan ly san pham](#5-quan-ly-san-pham) *(chi Doanh nghiep)*
6. [Dang bai tren Feed](#6-dang-bai-tren-feed)
7. [Nop don chung nhan san pham](#7-nop-don-chung-nhan-san-pham) *(chi Doanh nghiep)*
8. [Gia han membership](#8-gia-han-membership)
9. [Dat dich vu truyen thong](#9-dat-dich-vu-truyen-thong)
10. [Cau hoi thuong gap](#10-cau-hoi-thuong-gap)

---

## Hai loai tai khoan VIP

He thong co 2 loai tai khoan hoi vien:

| Loai | Danh cho | Menu hien thi |
|------|---------|--------------|
| **Doanh nghiep** | Chu doanh nghiep tram huong | Tong quan, Bang tin, Doanh nghiep, Chung nhan SP, Gia han, Ho so |
| **Ca nhan / Chuyen gia** | Chuyen gia, nha nghien cuu, nghe nhan, nha suu tam | Tong quan, Bang tin, Tai lieu, Gia han, Ho so |

**Tinh nang chung** (ca 2 loai): Dang bai feed, ho so ca nhan, gia han membership, lich su thanh toan, tai lieu Hoi, dich vu truyen thong.

**Chi danh cho Doanh nghiep**: Quan ly doanh nghiep, tao san pham, nop don chung nhan SP.

> Muc 4, 5, 7 trong tai lieu nay chi ap dung cho tai khoan **Doanh nghiep**.

---

## 1. Dang nhap lan dau

### Neu ban nhan email moi:
1. Mo email tu "Hoi Tram Huong Viet Nam"
2. Click nut "Dat mat khau & Kich hoat tai khoan"
3. He thong xac minh link — neu hop le, hien form dat mat khau
4. Nhap mat khau moi (toi thieu 8 ky tu) + xac nhan
5. Thanh do luc mat khau hien thi muc do: Yeu / Trung binh / Manh
6. He thong tu dong dang nhap va dua ban den trang Tong quan

> **Luu y**: Link trong email chi co hieu luc 48 gio. Neu het han, lien he ban quan tri de gui lai.

### Neu ban nhan mat khau tu admin:
1. Truy cap: `https://[domain]/login`
2. Nhap email va mat khau duoc cung cap
3. Sau khi dang nhap, nen doi mat khau tai trang Ho so

---

## 2. Tong quan Dashboard

Sau khi dang nhap, ban se thay trang `/tong-quan` voi:

- **Loi chao** theo thoi gian (buoi sang/chieu/toi) + ten ban
- **Ten cong ty** va hang hoi vien (Co ban / Bac / Vang)
- **3 the thong ke**:
  - Membership: so ngay con lai
  - Bai viet: so bai da dang
  - SP Chung nhan: so san pham da duoc chung nhan

- **Thao tac nhanh**: Dang bai | Nop don chung nhan | Gia han | Lich su thanh toan
- **Thong bao gan day**: trang thai payment, chung nhan...

---

## 3. Cap nhat ho so ca nhan

Truy cap: `/ho-so` (hoac click "Ho so" tren thanh menu)

### 4 tab:

**Tab Thong tin ca nhan:**
- Doi ten, so dien thoai
- Email khong the thay doi (lien he admin neu can)
- Link den trang chinh sua doanh nghiep

**Tab Ngan hang** (quan trong):
- Dien thong tin TK ngan hang de nhan hoan tien khi can
- Chon ngan hang tu dropdown (khong tu go)
- Ten chu TK phai viet IN HOA, khong dau (vd: NGUYEN VAN A)
- So TK chi chua so, 6-20 ky tu

> **Tai sao can dien?** Khi ban nop don chung nhan va bi tu choi, admin can TK ngan hang de hoan lai 5 trieu phi xet duyet.

**Tab Bao mat:**
- Doi mat khau: nhap mat khau cu -> mat khau moi -> xac nhan
- Mat khau moi toi thieu 8 ky tu

**Tab Lich su:**
- Bang lich su dong phi membership
- Tong dong gop tich luy va muc uu tien hien tai
- Canh bao khi membership sap het han (con < 30 ngay)

---

## 4. Quan ly doanh nghiep (CHI DOANH NGHIEP)

### Xem trang doanh nghiep
- Trang cong khai: `/doanh-nghiep/[slug-cong-ty]`
- Bat ky ai cung co the xem (ke ca khach vang lai)
- Hien thi: anh bia, logo, ten, nam thanh lap, dia chi, mo ta, san pham

### Chinh sua thong tin
1. Truy cap trang doanh nghiep cua ban -> click "Chinh sua" (goc phai)
2. Hoac truy cap truc tiep: `/doanh-nghiep/chinh-sua`

**3 phan:**
- Thong tin co ban: ten, slug (URL), nam thanh lap, quy mo, so DKKD
- Mo ta & Lien he: gioi thieu, dia chi, SDT, email, website
- Hinh anh: upload logo (1:1) va anh bia (3:1)

> **Luu y ve slug**: Doi slug se doi URL cong khai. URL cu se khong con hoat dong.

---

## 5. Quan ly san pham (CHI DOANH NGHIEP)

### Them san pham moi
1. Vao trang doanh nghiep -> tab "San pham" -> click "+ Them san pham"
2. Hoac truy cap: `/san-pham/tao-moi`

**Dien thong tin:**
- Ten san pham, slug (tu dong tao)
- Danh muc: Tram tu nhien / Tinh dau / Nhang / Vong deo / Thu cong / ...
- Mo ta chi tiet (goi y: nguon goc, huong thom, cach bao quan)
- Muc gia (vd: "500k-2tr" hoac "Lien he")
- Upload anh: toi da 10 anh, anh dau tien la anh dai dien

> **Goi y chup anh**: Nen chup duoi anh sang tu nhien de the hien dung mau sac va van go.

### Chinh sua san pham
- Vao trang san pham -> click "Chinh sua san pham"
- Hoac: `/san-pham/[slug]/sua`

### Xoa san pham
- San pham da co don chung nhan: KHONG the xoa, chi co the an (tat "Cong khai")
- San pham chua co don: co the xoa binh thuong

---

## 6. Dang bai tren Feed

### Dang bai nhanh
1. Truy cap `/feed`
2. Click vao o "Chia se kien thuc, kinh nghiem..." o dau trang
3. He thong dua ban den trang soan bai `/feed/tao-bai`

### Soan bai voi trinh soan thao
- Nhap tieu de (tuy chon nhung nen co)
- Nhap noi dung (toi thieu 50 ky tu)
- Dinh dang: in dam, in nghieng, link, danh sach, tieu de phu
- Dinh kem anh: keo tha anh vao trinh soan thao
- He thong tu dong luu nhap moi 30 giay

### Xem truoc & Dang
- Click "Xem truoc" de xem bai nhu khi hien thi tren feed
- Click "Dang bai" de xuat ban

### Quy dinh dang bai
- Toi da 3 bai/ngay
- Noi dung phai lien quan den nganh tram huong
- Cam spam, quang cao qua muc, thong tin sai lech
- Bai vi pham se bi admin khoa

### Tuong tac
- **Huu ich**: Click de danh dau bai co gia tri (tuong tu "Thich")
- **Bao cao**: Neu thay bai vi pham -> menu "..." -> "Bao cao bai viet"

> **Luu y**: So "Huu ich" va luot xem anh huong den thu tu bai tren feed.

---

## 7. Nop don chung nhan san pham (CHI DOANH NGHIEP)

### Dieu kien
- Membership con hieu luc
- Co it nhat 1 san pham (chua co -> tao truoc)
- San pham do chua co don chung nhan dang xu ly

### Quy trinh 3 buoc

**Buoc 1 — Chon san pham:**
- Chon san pham muon chung nhan tu dropdown
- Xem thong tin SP truoc khi tiep tuc
- Chon hinh thuc: Online (gui ho so) hoac Offline (kiem tra thuc te)

**Buoc 2 — Ho so & Ngan hang:**
- Upload tai lieu: giay kiem nghiem, CO/CQ, anh thuc te (PDF, JPG, PNG)
- Ghi chu cho admin (tuy chon)
- Dien TK ngan hang hoan tien (**bat buoc**):
  - Ten ngan hang, so TK, ten chu TK
  - Pre-fill tu ho so neu da dien truoc

**Buoc 3 — Thanh toan:**
- Xem tom tat don: san pham, hinh thuc, TK hoan tien
- Phi xet duyet: 5.000.000 VND
- Thong tin chuyen khoan: ngan hang, so TK, chu TK, noi dung CK
- Noi dung CK format: `HOITRAMHUONG-CERT-[ten viet tat]-[ngay]`
- Click "Copy" de sao chep noi dung CK
- Chuyen khoan xong -> click "Toi da chuyen khoan"

### Theo doi trang thai
- Truy cap: `/chung-nhan/lich-su`
- 6 trang thai:
  - Cho xac nhan CK: Admin chua confirm chuyen khoan
  - Cho xet duyet: Ho so da duoc tiep nhan
  - Dang xet duyet: Admin dang xem xet
  - Da cap chung nhan: Badge da hien tren san pham
  - Tu choi: Kem ly do, admin dang hoan tien
  - Da hoan tien: Phi da duoc hoan lai

---

## 8. Gia han membership

### Khi nao can gia han
- Membership het han -> mat quyen dang bai, nop don chung nhan
- He thong canh bao khi con < 30 ngay

### Quy trinh
1. Truy cap: `/gia-han`
2. Xem trang thai hien tai: hang, ngay het han, tong dong gop
3. Chon muc phi:
   - Muc toi thieu (vd: 5.000.000d): duy tri quyen VIP co ban
   - Muc cao (vd: 10.000.000d): uu tien feed cao hon, thang hang nhanh hon
4. Click "Xem huong dan chuyen khoan"
5. He thong hien: ngan hang, so TK, chu TK, so tien, noi dung CK
6. Copy noi dung CK (format: `HOITRAMHUONG-MEM-[ten]-[ngay]`)
7. Chuyen khoan qua app ngan hang
8. Quay lai -> click "Toi da chuyen khoan"
9. Ghi chu cho admin (tuy chon) -> "Gui xac nhan"
10. Theo doi trang thai tai `/thanh-toan/lich-su`

### Cach tinh hang
- Tong dong gop < 10 trieu: Hoi vien (1 sao)
- Tong dong gop 10-20 trieu: Hoi vien Bac (2 sao)
- Tong dong gop >= 20 trieu: Hoi vien Vang (3 sao)

> **Luu y**: Dong muc cao hon khong chi duy tri VIP ma con tang muc uu tien bai viet tren feed.

---

## 9. Dat dich vu truyen thong

### Cac dich vu
- Bai viet gioi thieu doanh nghiep
- Bai viet gioi thieu san pham
- Thong cao bao chi
- Noi dung mang xa hoi

### Cach dat
1. Truy cap: `/dich-vu`
2. Xem bang gia va quy trinh
3. Dien form dat hang:
   - Thong tin lien he: ten, email, SDT, ten cong ty
   - Yeu cau: loai dich vu, mo ta chi tiet, tu khoa SEO, deadline
4. Click "Gui don hang"
5. Nhan ma tham chieu (vd: MO-20260406-0042)
6. Admin lien he trong 24 gio de xac nhan va bao gia

---

## 10. Cau hoi thuong gap

**Q: Toi quen mat khau, lam sao?**
A: Lien he ban quan tri. Admin se gui email dat lai mat khau voi link co hieu luc 48 gio. Click link de dat mat khau moi va tu dong dang nhap.

**Q: Toi muon doi email dang nhap?**
A: Email khong the tu doi. Lien he admin de ho tro.

**Q: Phi chung nhan 5 trieu co duoc hoan neu bi tu choi?**
A: Co, admin se hoan tien vao TK ngan hang ban da dien trong ho so. Thoi gian 5-7 ngay lam viec.

**Q: Bai viet cua toi bi khoa, lam sao?**
A: Bai vi pham quy dinh se bi admin khoa. Lien he admin de biet ly do cu the.

**Q: Membership het han nhung toi van dang nhap duoc?**
A: Dung, ban van dang nhap duoc nhung mat quyen dang bai va nop don chung nhan. Can gia han de khoi phuc day du quyen.

**Q: San pham da chung nhan co can gia han khong?**
A: Hien tai chung nhan khong co thoi han. Tuy nhien, hoi co the thay doi chinh sach trong tuong lai.

**Q: Toi muon them nhieu san pham, co gioi han khong?**
A: Khong gioi han so luong san pham. Tuy nhien, moi don chung nhan can dong phi rieng.

**Q: Toi la ca nhan / chuyen gia, toi co the lam gi tren he thong?**
A: Ban co the: dang bai tren feed, xem tai lieu Hoi, gia han membership, dat dich vu truyen thong. Cac tinh nang doanh nghiep (tao SP, chung nhan) chi danh cho tai khoan Doanh nghiep.

**Q: Toi muon chuyen tu tai khoan Ca nhan sang Doanh nghiep?**
A: Lien he ban quan tri. Admin se cap nhat loai tai khoan va tao thong tin doanh nghiep cho ban.

**Q: Tai sao toi khong thay menu "Doanh nghiep" va "Chung nhan SP"?**
A: Cac menu nay chi hien thi cho tai khoan loai Doanh nghiep. Neu ban dang ky voi tu cach Ca nhan / Chuyen gia, ban se khong thay cac menu nay.

---

> **Ho tro**: Lien he ban quan tri qua email hoac Zalo da duoc cung cap khi gia nhap hoi.
