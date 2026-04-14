# Demo Flow Tests — Hoi Tram Huong Viet Nam

## Tong quan

2 test suite Playwright chay tu dong, ghi video tung buoc.
Dung de **demo san pham** va **luu tru huong dan su dung**.

- Du lieu seed moi tu dau moi lan chay
- Cac buoc chay tuan tu (serial), du lieu tao o buoc truoc duoc dung o buoc sau
- Video recording tu dong (`video: "on"`, viewport 1280x720)
- Output: `e2e/test-results/` (file `.webm`)

## Tai khoan demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hoitramhuong.vn | Demo@123 |
| VIP (Vang) | binhnv@hoitramhuong.vn | Demo@123 |

---

## 1. VIP Demo Flow

**File:** `e2e/vip-demo-flow.spec.ts`
**So buoc:** 16
**Thoi luong uoc tinh:** 3-5 phut

### Cach chay

```bash
# Start dev server truoc
npm run dev

# Chay test (headless, chi quay video)
npx playwright test e2e/vip-demo-flow.spec.ts --reporter=list

# Chay voi trinh duyet hien thi (xem truc tiep)
npx playwright test e2e/vip-demo-flow.spec.ts --headed --reporter=list
```

### Danh sach cac buoc

| Step | Test | Mo ta chi tiet |
|------|------|---------------|
| 00 | Seed data | Xoa du lieu cu, seed demo data moi (8 VIP, 14 SP, 16 bai viet) |
| 01 | Dang nhap | VIP nhap email + mat khau, redirect den /tong-quan |
| 02 | Dashboard | Xem loi chao, the thong ke (Membership, Bai viet, SP Chung nhan), thao tac nhanh |
| 03 | Ho so ca nhan | Cap nhat SDT, dien thong tin ngan hang, xem tab Bao mat va Lich su |
| 04 | Doanh nghiep | Xem trang cong khai, click Chinh sua, cap nhat mo ta, luu |
| 05 | Tao san pham | Dien ten, danh muc, gia, mo ta, tick cong khai, submit |
| 06 | Doc Feed | Browse feed cong dong, scroll xem bai viet, sidebar hoi vien tieu bieu |
| 07 | Dang bai | Nhap tieu de + noi dung trong TipTap editor, click Dang bai |
| 08 | Chung nhan SP | Chon SP → Dien ho so + TK hoan tien → Xem thong tin CK → Xac nhan |
| 09 | Gia han | Xem membership status, chon muc phi, xem huong dan CK, copy ND, xac nhan |
| 10 | Lich su TT | Xem bang lich su thanh toan voi cac trang thai |
| 11 | Lich su CN | Xem danh sach don chung nhan va trang thai |
| 12 | Admin xac nhan CK | (Chuyen sang Admin) Xac nhan chuyen khoan pending |
| 13 | Admin duyet CN | (Chuyen sang Admin) Duyet don chung nhan |
| 14 | Admin hoi vien | (Chuyen sang Admin) Browse tabs danh sach hoi vien, xem chi tiet |
| 15 | Admin Dashboard | (Chuyen sang Admin) Xem KPI, chart, alerts |

### Du lieu tao trong flow

| Buoc | Du lieu tao | Dung o buoc |
|------|-----------|------------|
| 00 | 8 VIP, 14 SP, 16 post, payments | Toan bo flow |
| 05 | 1 san pham moi | 08 (chon SP de chung nhan) |
| 07 | 1 bai viet moi | Xuat hien tren feed |
| 08 | 1 don chung nhan + 1 payment PENDING | 12, 13 (admin xu ly) |
| 09 | 1 payment PENDING (gia han) | 12 (admin xac nhan) |

---

## 2. Admin Demo Flow

**File:** `e2e/admin-demo-flow.spec.ts`
**So buoc:** 12
**Thoi luong uoc tinh:** 3-4 phut

### Cach chay

```bash
# Start dev server truoc
npm run dev

# Chay test
npx playwright test e2e/admin-demo-flow.spec.ts --reporter=list

# Chay voi trinh duyet hien thi
npx playwright test e2e/admin-demo-flow.spec.ts --headed --reporter=list
```

### Danh sach cac buoc

| Step | Test | Mo ta chi tiet |
|------|------|---------------|
| 00 | Seed data | Xoa du lieu cu, seed demo data moi |
| 01 | Dang nhap | Admin nhap email + mat khau, redirect den /admin |
| 02 | Dashboard | KPI cards (8 chi so), alerts do/vang, bieu do doanh thu + phan bo hang, hoat dong gan day |
| 03 | Xac nhan CK | Browse tab Membership/Chung nhan, xem pending payment, click Xac nhan, thay doi trang thai |
| 04 | Xet duyet CN | Browse tab trang thai, vao chi tiet don (2 cot: ho so trai + action phai), click Duyet & Cap Badge |
| 05 | Quan ly hoi vien | Browse tabs (Active, Sap het han, Het han, Cho kich hoat), search theo ten, xem chi tiet hoi vien |
| 06 | Tao hoi vien | Chon mode "Tao voi mat khau", dien ten/email/SDT/mat khau, submit |
| 07 | Tin tuc | Xem danh sach bai, badge Xuat ban/Nhap, vao chinh sua bai |
| 08 | Bao cao vi pham | Xem danh sach report, preview noi dung bai, Khoa bai hoac Bo qua |
| 09 | Don truyen thong | Summary cards (Moi/Dang lam/Cho duyet/Hoan tat), browse tab trang thai, xem chi tiet don |
| 10 | Cai dat he thong | 5 nhom config: Thong tin Hoi, Phi & Gioi han, Chuyen khoan, Phi Ca nhan, Hang DN → chinh phi, Luu |
| 11 | Tong ket | Quay lai Dashboard xem KPI da cap nhat sau khi xu ly |

### Du lieu tao trong flow

| Buoc | Du lieu tao | Dung o buoc |
|------|-----------|------------|
| 00 | Full demo data (8 VIP, 14 SP, 2 pending payment, 2 report) | Toan bo flow |
| 03 | Payment status: PENDING → SUCCESS | 11 (KPI cap nhat) |
| 04 | Certification status: PENDING → APPROVED | 11 (KPI cap nhat) |
| 06 | 1 user VIP moi | 11 (so hoi vien tang) |
| 08 | Post status: PUBLISHED → LOCKED | 11 (bao cao giam) |

---

## 3. Chay ca 2 flow

```bash
npx playwright test e2e/vip-demo-flow.spec.ts e2e/admin-demo-flow.spec.ts --headed --reporter=list
```

Luu y: Moi flow seed data rieng, khong phu thuoc nhau.

---

## 4. Xem video output

Sau khi chay, video nam tai:

```
e2e/test-results/
  VIP-Demo-Flow-Full-Platform-Walkthrough-00-Seed-du-lieu-demo-moi/
    video.webm
  VIP-Demo-Flow-Full-Platform-Walkthrough-01-VIP-dang-nhap-he-thong/
    video.webm
  ...
```

Co the mo file `.webm` bang trinh duyet hoac VLC.

---

## 5. Tuy chinh

### Doi toc do video (tang/giam pause)

Trong file test, thay doi hang so `PAUSE`:

```typescript
const PAUSE = 800  // mac dinh 800ms giua cac buoc
const PAUSE = 1500 // cham hon, de doc khi demo
const PAUSE = 300  // nhanh hon, de chay kiem tra nhanh
```

### Doi viewport (kich thuoc video)

Trong `playwright.config.ts`:

```typescript
use: {
  viewport: { width: 1280, height: 720 },  // HD
  viewport: { width: 1920, height: 1080 }, // Full HD
}
```

### Tat video (chay nhanh khong can quay)

Trong `playwright.config.ts`:

```typescript
use: {
  video: "off",  // tat video
  video: "on",   // bat video (mac dinh)
}
```
