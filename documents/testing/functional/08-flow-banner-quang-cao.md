# Flow Banner Quang cao — Đăng ký tự phục vụ

> **⚠️ STATUS: SPEC DOCUMENT — Phase 6 chưa được triển khai**
>
> Tai lieu nay la **dac ta test cases** cho flow banner quang cao tu phuc vu.
> Phase 6 du kien se implement: Banner model, admin CRUD, flow dang ky tu phuc vu (moi user),
> banner display tren trang chu (Section 4 — hien la placeholder).
>
> Khi Phase 6 duoc trien khai, **un-skip** cac test case nay va chay lai.

## Phase 6 — Business rules (chot voi khach 04/2026)

### Gia & quota theo tier
| Tier | Quota mau / thang | Gia / mau / thang |
|------|------------------|-------------------|
| GUEST (user thuong) | **1** | 1.000.000 VND |
| VIP ★ (1 sao) | **5** | 1.000.000 VND |
| VIP ★★ Bac | **10** | 1.000.000 VND |
| VIP ★★★ Vang | **20** | 1.000.000 VND |
| ADMIN | khong gioi han | — |

- Gia **flat 1tr/mau/thang**, KHONG co discount theo tier (khac voi gia su o landing page truoc do)
- Quota dem so banner ACTIVE trong cung 1 thang lich
- Het quota -> moi UI phai chan, API tra 429

### Hien thi banner
- Banner hien thi **lien tuc** o Section 4 trang chu
- Toi da **20 slot** rotate trong 1 lan load trang
- **Auto-rotate moi 5 giay** -> chuyen sang banner ke tiep
- Neu so banner ACTIVE > 20: uu tien chon theo Tier (Vang → Bac → ★ → GUEST), trong cung tier random

### Gia han
- Cho phep **gia han** mot mau banner da co (extend `endDate`)
- Phi gia han = 1tr/thang × so thang gia han
- Gia han van dem vao quota thang (vd: VIP★ co 5 mau ACTIVE, gia han 1 mau van la 1 trong 5)

### Yeu cau khach
"Khach hang muon trien khai 1 flow de hoi vien tu dang ki banner, admin chi can check nhan tien va duyet publish."

## Du kien Schema (Phase 6)

```prisma
enum BannerPosition {
  HOMEPAGE_MAIN     // Section 4 trang chu (top bleed)
  SIDEBAR           // Right rail
  ARTICLE_BOTTOM    // Cuoi bai tin tuc
}

enum BannerStatus {
  PENDING_PAYMENT   // Vua tao, cho user CK
  PENDING_APPROVAL  // User da CK, cho admin duyet noi dung
  ACTIVE            // Admin da duyet, dang chay
  REJECTED          // Admin tu choi noi dung
  EXPIRED           // Het han
}

model Banner {
  id          String         @id @default(cuid())
  userId      String
  user        User           @relation(...)
  imageUrl    String         // Cloudinary URL
  targetUrl   String         // Link toi DN/SP/bai post
  title       String
  position    BannerPosition
  startDate   DateTime
  endDate     DateTime
  status      BannerStatus
  paymentId   String?        @unique
  payment     Payment?       @relation(...)
  price       Int            // VND
  rejectReason String?
  createdAt   DateTime       @default(now())
  approvedAt  DateTime?
}
```

## Du kien Routes & API (Phase 6)

| Route | Vai tro |
|-------|--------|
| `/banner/dang-ky` | VIP form 3 step: chon vi tri → upload + content → CK |
| `/banner/lich-su` | VIP xem cac banner cua minh + trang thai |
| `/admin/banner` | Admin list + duyet content + confirm payment |
| `POST /api/banner` | Tao banner moi (VIP) |
| `POST /api/admin/banner/[id]/approve` | Duyet content (set ACTIVE) |
| `POST /api/admin/banner/[id]/reject` | Tu choi (set REJECTED + lyDo) |

---

## Tai khoan test
- VIP A (Vang): trankhanh@tramhuongkhanhhoa.vn / Demo@123
- VIP B (Bac): nguyenthilan@tinhdautramhuong.vn / Demo@123
- VIP C (Co ban): dangvantuan@tramhuongdaknong.vn / Demo@123
- GUEST (free tier): user moi dang ky
- Admin: admin@hoitramhuong.vn / Demo@123

## Du lieu seed Phase 6 (du kien)
Khi Phase 6 implement, seed nen co:
- **5 banner ACTIVE** o nhieu tier khac nhau (test rotation va priority sort):
  - 2 cua VIP Vang (tram-huong-khanh-hoa, tram-huong-quang-nam) — slot uu tien cao
  - 2 cua VIP Bac (tinh-dau-tram-huong-sai-gon, nhang-thom-tram-viet)
  - 1 cua VIP★ (tram-huong-phu-yen)
- **1 banner PENDING_APPROVAL** (vua CK xong, cho admin duyet)
- **1 banner PENDING_PAYMENT** (cho user CK)
- **1 banner EXPIRED** (het han 1 thang truoc — test cron expire)
- **1 banner REJECTED** (admin tu choi + ly do)
- **1 banner GUEST** ACTIVE (test edge case quota = 1)

---

## A. User dang ky banner (moi user dang nhap)

### TC-BANNER-01: User truy cap form dang ky banner
1. Login user bat ky (GUEST/VIP/ADMIN) -> truy cap `/banner/dang-ky`
2. **Kiem tra**: Step 1 hien thi — "Chon thoi gian"
3. **Kiem tra**: Hien date picker startDate / endDate
4. **Kiem tra**: Hien gia flat **1.000.000 VND / thang**
5. **Kiem tra**: Hien chip "Quota: X/Y mau thang nay" (theo tier user)
   - GUEST: "0/1"
   - VIP★: "0/5"
   - VIP★★: "0/10"
   - VIP★★★: "0/20"

### TC-BANNER-02: Khach (chua login) -> redirect login
1. Khong dang nhap -> truy cap `/banner/dang-ky`
2. **Kiem tra**: Redirect `/login?callbackUrl=/banner/dang-ky`

### TC-BANNER-03: GUEST cung dang ky banner duoc (Phase 6 — open access)
1. Login GUEST -> truy cap `/banner/dang-ky`
2. **Kiem tra**: Page load OK (khong redirect ve /landing)
3. **Kiem tra**: Quota chip "0/1 mau thang nay"
4. Submit 1 banner -> thanh cong
5. **Kiem tra**: Banner status PENDING_PAYMENT, quota tang len 1/1

### TC-BANNER-04: Step 1 — chon thoi gian va tinh gia
1. Login VIP★ (5 quota)
2. Vao /banner/dang-ky -> chon thoi han 2 thang
3. **Kiem tra**: Tong gia = 1.000.000 × 2 = **2.000.000 VND** (khong co discount)
4. Doi sang 6 thang -> tong gia = 6.000.000 VND
5. Click "Tiep theo"

### TC-BANNER-05: Step 2 — upload anh + targetUrl
1. (Tiep TC-BANNER-04) Step 2 hien thi
2. Upload 1 anh (yeu cau: jpg/png, max 2MB, ti le **16:9 hoac 3:1**, kich thuoc khuyen nghi 1200x400)
3. **Kiem tra**: Preview anh hien thi
4. **Kiem tra**: Validate kich thuoc — neu sai ti le, hien warning
5. Nhap targetUrl: `https://example.com/san-pham/abc`
6. **Kiem tra**: Validate URL hop le (phai bat dau bang `https://`)
7. Nhap title: "Khuyen mai 30% trầm hương Khánh Hòa"
8. Click "Tiep theo"

### TC-BANNER-06: Step 3 — bank info & xac nhan CK
1. (Tiep TC-BANNER-05) Step 3 hien thi
2. **Kiem tra**: Hien thong tin CK — tai khoan ngan hang Hoi (tu SiteConfig)
3. **Kiem tra**: Noi dung CK auto-format: `HTHVN-BANNER-{userId-suffix}-{date}`
4. **Kiem tra**: So tien hien thi: 2.000.000 VND (cho 2 thang)
5. Click "Toi da chuyen khoan"
6. **Kiem tra**: Banner duoc tao voi status `PENDING_APPROVAL`
7. **Kiem tra**: Email gui cho admin "Banner moi cho duyet"
8. **Kiem tra**: Redirect ve `/banner/lich-su`

### TC-BANNER-07: Validate ngay khong hop le
1. Vao /banner/dang-ky -> chon endDate < startDate
2. **Kiem tra**: Validation error "Ngay ket thuc phai sau ngay bat dau"
3. Chon startDate trong qua khu
4. **Kiem tra**: Error "Ngay bat dau phai trong tuong lai"
5. Chon thoi han < 1 thang
6. **Kiem tra**: Error "Toi thieu 1 thang"

### TC-BANNER-08: User xem lich su banner cua minh
1. Login VIP A -> truy cap `/banner/lich-su`
2. **Kiem tra**: Bang liet ke cac banner: title, startDate-endDate, status, price
3. **Kiem tra**: Co the click vao 1 banner xem chi tiet
4. **Kiem tra**: Banner status `PENDING_APPROVAL` co badge mau vang
5. **Kiem tra**: Banner status `ACTIVE` co badge mau xanh
6. **Kiem tra**: Banner status `REJECTED` co badge do + lyDo
7. **Kiem tra**: Banner ACTIVE sap het han (< 7 ngay) hien nut "Gia han"

### TC-BANNER-08b: Quota dem dung — moi user dat quota
1. Login GUEST -> dang ky 1 banner -> thanh cong
2. Co gang dang ky banner thu 2 cung thang
3. **Kiem tra**: API tra `429` voi message "Da dat quota 1/1 mau thang nay. Nang cap VIP de tang quota."
4. Login VIP★ -> dang ky 5 banner thanh cong
5. Banner thu 6 -> **Kiem tra**: 429
6. VIP★★ Bac -> dang ky 10 banner -> banner thu 11 fail
7. VIP★★★ Vang -> dang ky 20 banner -> banner thu 21 fail
8. **Kiem tra**: ADMIN khong gioi han

### TC-BANNER-08c: Quota reset dau thang
1. (Setup) User VIP★ co 5 banner ACTIVE thang truoc, da dat quota
2. Sang thang moi (1/MM/YYYY)
3. Login -> /banner/dang-ky
4. **Kiem tra**: Quota chip hien "0/5" (reset)
5. Co the dang ky 5 banner moi nua trong thang nay

---

## B. Admin xet duyet banner

### TC-BANNER-09: Admin truy cap trang quan ly banner
1. Login Admin -> sidebar click "Banner"
2. **Kiem tra**: URL `/admin/banner`
3. **Kiem tra**: Bang liet ke tat ca banner voi filter theo status
4. **Kiem tra**: 5 stats card: Cho duyet, ACTIVE, REJECTED, EXPIRED, Tong doanh thu

### TC-BANNER-10: Admin duyet banner
1. Login Admin -> /admin/banner -> tab "Cho duyet"
2. Click vao 1 banner PENDING_APPROVAL
3. **Kiem tra**: Trang chi tiet hien preview anh, target URL, title, thoi gian, gia, ten user
4. **Kiem tra**: Co 2 nut "Duyet" + "Tu choi"
5. Click "Duyet"
6. **Kiem tra**: Status chuyen ACTIVE, `approvedAt` set
7. **Kiem tra**: Email gui cho VIP "Banner cua ban da duoc duyet"
8. **Kiem tra**: Banner xuat hien o trang chu Section 4 (neu trong khoang startDate-endDate)

### TC-BANNER-11: Admin tu choi banner
1. Tai /admin/banner -> click banner PENDING_APPROVAL
2. Click "Tu choi" -> nhap ly do (bat buoc)
3. **Kiem tra**: Status -> REJECTED, `rejectReason` luu
4. **Kiem tra**: Email gui cho VIP voi ly do tu choi
5. **Kiem tra**: Hien TK ngan hang cua VIP cho admin CK hoan tien

### TC-BANNER-12: Validate noi dung banner
- Cac quy tac admin can check khi duyet:
  - [ ] Anh ro net, khong vo lieu, dung ti le
  - [ ] targetUrl la link nguon goc cua user (khong link sang doi thu)
  - [ ] Title khong chua tu cam (spam, fake info)
  - [ ] Khong vi pham quy dinh quang cao
- Doc them: SLA va quy dinh tai documents/guideline/03-business-document.md

---

## C. Hien thi banner tren homepage (Section 4)

### TC-BANNER-13: Banner ACTIVE hien thi tren trang chu
1. Truy cap `/`
2. Scroll xuong Section 4 (giua Carousel SP va Tin DN)
3. **Kiem tra**: Banner ACTIVE dang trong khoang `startDate <= now <= endDate` hien thi
4. **Kiem tra**: Anh hien thi trong max-w-7xl (constrain width — nhat quan voi cac section khac)
5. **Kiem tra**: Click banner -> mo `targetUrl` o tab moi (`target="_blank" rel="noopener"`)
6. **Kiem tra**: Co chu nho "Quang cao" hoac "Sponsored" o goc tren

### TC-BANNER-14: Khong co banner ACTIVE -> show placeholder
1. Vao DB, set tat ca banner thanh PENDING/EXPIRED/REJECTED
2. Truy cap /
3. **Kiem tra**: Section 4 hien placeholder (dashed border + text "Vi tri Banner Quang cao")

### TC-BANNER-15: Banner het han -> tu dong an
1. Set 1 banner ACTIVE voi `endDate` = hom qua
2. Cron job daily check (chua trien khai — manual call API hoac doi cron tu chay)
3. **Kiem tra**: Banner chuyen sang status `EXPIRED`
4. Truy cap /
5. **Kiem tra**: Banner do khong con hien thi
6. **Kiem tra**: Email gui cho user "Banner cua ban da het han, gia han ngay de tiep tuc hien thi"

### TC-BANNER-16: Auto-rotate moi 5 giay (Phase 6 chot)
1. Setup: 3 banner ACTIVE trong DB
2. Truy cap / -> Section 4
3. **Kiem tra**: Banner #1 hien thi
4. Doi 5 giay
5. **Kiem tra**: Tu dong chuyen sang banner #2 (smooth fade hoac slide)
6. Doi 5 giay tiep
7. **Kiem tra**: Chuyen sang banner #3
8. Doi 5 giay tiep
9. **Kiem tra**: Quay lai banner #1 (loop infinite)
10. **Kiem tra**: Co dot pagination (3 cham nho) hoac thanh tien trinh thoi gian

### TC-BANNER-17: Toi da 20 slot rotate cung luc
1. Setup: 25 banner ACTIVE trong DB
2. Truy cap /
3. **Kiem tra**: Section 4 chi rotate qua **20 banner** (khong phai 25)
4. **Kiem tra**: 5 banner du khong xuat hien tren homepage trong session nay

### TC-BANNER-18: Priority chon 20 slot — VIP truoc
1. Setup: 25 banner ACTIVE — co 5 GUEST, 8 VIP★, 7 VIP★★ Bac, 5 VIP★★★ Vang
2. Truy cap /
3. **Kiem tra**: 20 slot duoc chon theo uu tien:
   - 5 VIP Vang (full)
   - 7 VIP Bac (full)
   - 8 VIP★ -> chi lay 8 dau (du sap xep neu can)
   - 0 GUEST (vi 5+7+8 = 20, het slot)
4. **Kiem tra**: Trong cung tier, sap xep theo `createdAt DESC` hoac random

### TC-BANNER-19: Pause khi user hover (UX)
1. Tai / -> Section 4 dang rotate
2. Hover chuot vao banner
3. **Kiem tra**: Animation rotation tam dung
4. Bo hover
5. **Kiem tra**: Rotation tiep tuc

---

## D. Thanh toan va bao mat

### TC-BANNER-20: Banner gan voi Payment record
1. User tao banner -> CK
2. **Kiem tra**: Tao record `Payment` voi type = `BANNER_FEE` (Phase 6 enum moi), status = PENDING
3. **Kiem tra**: amount = 1tr × so thang
4. Admin xac nhan CK tai /admin/thanh-toan
5. **Kiem tra**: Payment status -> SUCCESS, banner status -> PENDING_APPROVAL
6. Admin duyet banner -> ACTIVE

### TC-BANNER-21: User A khong sua/xoa banner cua User B
1. Login User A
2. Truy cap `/banner/[id-cua-user-B]/sua` hoac goi API DELETE
3. **Kiem tra**: Loi 403 hoac redirect

### TC-BANNER-22: Admin co the xoa banner bat ky
1. Login Admin -> /admin/banner -> click banner -> "Xoa"
2. **Kiem tra**: Banner bi xoa khoi DB, khong con hien thi

---

## E. Gia han banner (Phase 6 chot — co cho phep gia han)

### TC-BANNER-23: User gia han banner sap het han
1. Setup: 1 banner ACTIVE cua VIP, endDate trong 5 ngay nua
2. Login VIP -> /banner/lich-su
3. **Kiem tra**: Banner do co nut "Gia han" (chi hien khi < 7 ngay nua het han)
4. Click "Gia han" -> form chon thoi gian gia han them (1, 3, 6, 12 thang)
5. Chon 3 thang -> tong tien hien = 3.000.000 VND
6. Chuyen khoan -> click "Toi da CK"
7. **Kiem tra**: Tao Payment moi voi description `HTHVN-BANNER-RENEW-{id}-{date}`
8. **Kiem tra**: Banner status van la ACTIVE (khong can admin duyet lai noi dung — chi confirm CK)

### TC-BANNER-24: Admin confirm CK gia han
1. Setup: 1 banner co Payment gia han PENDING
2. Admin -> /admin/thanh-toan -> filter "Banner"
3. Click confirm
4. **Kiem tra**: Payment SUCCESS
5. **Kiem tra**: Banner.endDate = endDate cu + thoi gian gia han
6. **Kiem tra**: Email gui cho user "Da gia han thanh cong, ngay het han moi: ..."

### TC-BANNER-25: Gia han van dem vao quota thang
1. Setup: VIP★ co 5 banner ACTIVE thang nay (dat quota)
2. Co gang gia han 1 trong 5 banner
3. **Kiem tra**: API cho phep (gia han khong tao banner moi, chi extend endDate)
4. **Kiem tra**: Quota chip van hien "5/5" (khong tang)

### TC-BANNER-26: Banner het han lai dang ky moi (KHONG la gia han)
1. Setup: 1 banner cua VIP da EXPIRED
2. Vao /banner/lich-su -> banner EXPIRED khong co nut "Gia han" (chi co o ACTIVE sap het han)
3. User vao /banner/dang-ky tao banner moi
4. **Kiem tra**: Tinh la 1 mau moi -> dem vao quota thang hien tai
5. **Kiem tra**: Banner moi co `id` khac voi banner cu

### TC-BANNER-27: Admin duyet banner -> chi check noi dung 1 lan
1. User dang ky banner moi -> CK -> admin xac nhan CK -> admin duyet content -> ACTIVE
2. User gia han banner do
3. Admin chi can confirm CK (KHONG can duyet content lai)
4. **Kiem tra**: Sau khi confirm CK, banner -> ACTIVE ngay (khong qua state PENDING_APPROVAL)

---

## Ket qua (sau khi Phase 6 implement)

### A. User dang ky banner (10 TC)
- [ ] TC-BANNER-01: PASS / FAIL / SKIP
- [ ] TC-BANNER-02: PASS / FAIL / SKIP
- [ ] TC-BANNER-03: PASS / FAIL / SKIP
- [ ] TC-BANNER-04: PASS / FAIL / SKIP
- [ ] TC-BANNER-05: PASS / FAIL / SKIP
- [ ] TC-BANNER-06: PASS / FAIL / SKIP
- [ ] TC-BANNER-07: PASS / FAIL / SKIP
- [ ] TC-BANNER-08: PASS / FAIL / SKIP
- [ ] TC-BANNER-08b: PASS / FAIL / SKIP (quota dat)
- [ ] TC-BANNER-08c: PASS / FAIL / SKIP (quota reset)

### B. Admin xet duyet banner (4 TC)
- [ ] TC-BANNER-09: PASS / FAIL / SKIP
- [ ] TC-BANNER-10: PASS / FAIL / SKIP
- [ ] TC-BANNER-11: PASS / FAIL / SKIP
- [ ] TC-BANNER-12: PASS / FAIL / SKIP

### C. Hien thi banner tren homepage (7 TC)
- [ ] TC-BANNER-13: PASS / FAIL / SKIP
- [ ] TC-BANNER-14: PASS / FAIL / SKIP
- [ ] TC-BANNER-15: PASS / FAIL / SKIP
- [ ] TC-BANNER-16: PASS / FAIL / SKIP (rotate 5s)
- [ ] TC-BANNER-17: PASS / FAIL / SKIP (max 20 slot)
- [ ] TC-BANNER-18: PASS / FAIL / SKIP (priority VIP)
- [ ] TC-BANNER-19: PASS / FAIL / SKIP (pause hover)

### D. Thanh toan va bao mat (3 TC)
- [ ] TC-BANNER-20: PASS / FAIL / SKIP
- [ ] TC-BANNER-21: PASS / FAIL / SKIP
- [ ] TC-BANNER-22: PASS / FAIL / SKIP

### E. Gia han banner (5 TC)
- [ ] TC-BANNER-23: PASS / FAIL / SKIP
- [ ] TC-BANNER-24: PASS / FAIL / SKIP
- [ ] TC-BANNER-25: PASS / FAIL / SKIP
- [ ] TC-BANNER-26: PASS / FAIL / SKIP
- [ ] TC-BANNER-27: PASS / FAIL / SKIP

**Tong**: 29 test case (tat ca SKIP cho den khi Phase 6 implement)

---

## Implementation checklist (Phase 6)

Khi triển khai Phase 6, làm theo thứ tự:

1. **Schema**: Thêm `BannerStatus` enum + `Banner` model + `PaymentType.BANNER_FEE`
   - Bo `BannerPosition` enum (Phase 6 chot — chi co 1 vi tri HOMEPAGE_MAIN)
   - Banner.userId + image + targetUrl + title + startDate + endDate + status + paymentId + price
2. **Migration**: `npx prisma migrate dev --name phase6_banner_ads`
3. **Seed**: Thêm 9 banner mẫu (5 ACTIVE multi-tier + 1 PENDING + 1 PENDING_PAY + 1 EXPIRED + 1 REJECTED) — xem section "Du lieu seed Phase 6 du kien"
4. **lib/bannerQuota.ts** (helper moi):
   - `getMonthlyBannerQuota(role, contributionTotal)` -> 1/5/10/20/-1
   - `getBannerQuotaUsage(userId)` -> { used, limit, remaining }
   - SiteConfig keys: `banner_quota_guest`, `banner_quota_vip_1`, `banner_quota_vip_2`, `banner_quota_vip_3`
   - SiteConfig key `banner_price_per_month` (default 1.000.000)
5. **API**:
   - `POST /api/banner` (moi user dang nhap, check quota)
   - `GET /api/banner/quota` (UI hien chip "X/Y mau thang nay")
   - `POST /api/banner/[id]/renew` (gia han, KHONG dem quota them)
   - `POST /api/admin/banner/[id]/approve` (duyet content lan dau)
   - `POST /api/admin/banner/[id]/reject`
   - `DELETE /api/admin/banner/[id]`
6. **Pages**:
   - `/banner/dang-ky` (3-step form, moi user dang nhap — KHONG VIP-only)
   - `/banner/lich-su` (xem lich su + nut "Gia han")
   - `/banner/[id]/gia-han` (form gia han)
   - `/admin/banner` (admin CRUD)
7. **Component**:
   - `<HomepageBannerSlot />` rewrite — fetch top 20 banner ACTIVE theo priority VIP
   - Auto-rotate 5s (CSS-only neu co the, hoac client component voi setInterval)
   - Pause on hover
8. **Cron**: Daily job check `endDate < now()` -> set EXPIRED + gui email "sap het han" cho banner < 7 ngay
9. **Email templates**:
   - "Banner moi cho duyet" (gui admin)
   - "Banner cua ban da duoc duyet" (gui user)
   - "Banner cua ban bi tu choi + ly do" (gui user)
   - "Banner sap het han, gia han ngay" (gui user)
   - "Da gia han thanh cong" (gui user)
10. **Run test cases**: Update tu SKIP -> PASS/FAIL (29 TC)

### Quy tac chot Phase 6
- **Gia**: 1.000.000 VND / mau / thang (flat, khong discount theo tier)
- **Quota**: GUEST 1 / VIP★ 5 / VIP★★ 10 / VIP★★★ 20 / ADMIN unlimited
- **Hien thi**: Toi da 20 slot rotate, moi 5 giay chuyen banner
- **Priority**: Khi ACTIVE > 20 -> chon top 20 theo tier (Vang -> Bac -> ★ -> GUEST)
- **Gia han**: Cho phep, KHONG can duyet content lai, KHONG dem quota them
