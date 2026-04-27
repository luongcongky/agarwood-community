# Huong dan van hanh danh cho Admin
## Hoi Tram Huong Viet Nam — Phien ban 3.2

> Tai lieu nay danh cho Ban Quan tri su dung he thong hang ngay.
> Cap nhat lan cuoi: 04/2026 (Phase 1-6 + Dieu le integration)

---

## Muc luc

1. [Dang nhap va tong quan](#1-dang-nhap-va-tong-quan)
2. [Quan ly hoi vien](#2-quan-ly-hoi-vien)
3. [Xac nhan chuyen khoan](#3-xac-nhan-chuyen-khoan)
4. [Xet duyet chung nhan san pham](#4-xet-duyet-chung-nhan-san-pham)
5. [Quan ly Tieu bieu — Top SP & DN (Phase 4)](#5-quan-ly-tieu-bieu-top-sp-va-dn-phase-4)
6. [Xu ly bao cao vi pham](#6-xu-ly-bao-cao-vi-pham)
7. [Quan ly tin tuc](#7-quan-ly-tin-tuc)
8. [Quan ly don truyen thong](#8-quan-ly-don-truyen-thong)
9. [Cai dat he thong](#9-cai-dat-he-thong)
10. [Xu ly su co thuong gap](#10-xu-ly-su-co-thuong-gap)
11. [Van ban phap quy (`/admin/phap-ly`)](#11-van-ban-phap-quy)
12. [Don ket nap Hoi vien (`/admin/hoi-vien/don-ket-nap`)](#12-don-ket-nap-hoi-vien)
13. [Che do xem (Public/Management mode)](#13-che-do-xem)
14. [Quan ly Banner quang cao (`/admin/banner`)](#14-quan-ly-banner)
15. [Quan ly Doi tac (`/admin/doi-tac`)](#15-quan-ly-doi-tac)
16. [Chinh sach bao mat & Dieu khoan (`/privacy`, `/terms`)](#16-chinh-sach--dieu-khoan)
17. [Hang Infinite — admin chi-doc](#17-hang-infinite)
18. [Quan ly Menu navbar (`/admin/menu`)](#18-quan-ly-menu-navbar)
19. [Gallery anh nen trang chu (`/admin/gallery`)](#19-gallery-anh-nen-trang-chu)
20. [Tin nhan lien he tu website (`/admin/lien-he`)](#20-tin-nhan-lien-he-tu-website)
21. [Duyet bai viet cua hoi vien (`/admin/bai-viet/cho-duyet`)](#21-duyet-bai-viet-cua-hoi-vien)

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

### He thong thong bao (Notification Bell + Sidebar badge)

Tu thang 4/2026, moi trang admin co chuong thong bao theo doi 8 nghiep vu can thao tac:

**Chuong thong bao (icon 🔔)**:
- Nam o **header sidebar** (desktop) / **goc phai top bar** (mobile)
- Badge **do** hien tong so muc cho xu ly tat ca workflow
- Click → dropdown panel 420px liet ke tung workflow co pending + 3 muc cu nhat, moi muc co "time ago" + link di thang toi record
- Cap nhat tu dong: poll moi **30 giay** + refetch khi ban chuyen tab ve

**Badge tren tung menu sidebar**:
- Menu item co nghiep vu pending se hien bong tron **do** ke ten + so luong
- Group header dong se hien dot do nho neu ben trong co pending → ban khong bo sot khi accordion collapsed

**Cac workflow theo doi** (thu tu uu tien blocking → informational):
| # | Workflow | Menu / URL |
|---|---|---|
| 1 | Xac nhan chuyen khoan | `/admin/thanh-toan` |
| 2 | Duyet don ket nap hoi vien | `/admin/hoi-vien/don-ket-nap` |
| 3 | Duyet chung nhan san pham | `/admin/chung-nhan` |
| 4 | Duyet banner quang cao | `/admin/banner` |
| 5 | Xac nhan don truyen thong | `/admin/truyen-thong` |
| 6 | Lien he tu website (moi) | `/admin/lien-he` |
| 7 | Xu ly bao cao bai viet | `/admin/bao-cao` |
| 8 | Lien he yeu cau tu van | `/admin/tu-van` |

**Read-only (hang Infinite)**: van doc duoc badge + chuong, KHONG thao tac duoc — click vao xem nhung khong duyet / doi trang thai.

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

### 4 vai tro (Role)
| Role | Mo ta |
|------|------|
| `GUEST` | Tai khoan co ban (dang ky xong dung ngay) |
| `VIP` | Hoi vien dong phi — quota cao + uu tien hien thi |
| `ADMIN` | Ban quan tri — toan quyen (doc + ghi) |
| `INFINITE` | Admin **chi-doc** — xem moi trang admin nhu ADMIN nhung moi mutation bi chan 403. Xem muc 17. |

### Tai khoan moi (Phase 2 — bo flow cho duyet)

> **Quan trong**: Tu Phase 2, **khong con** tab "Cho duyet". User dang ky tu trang /dang-ky
> hoac qua Google se duoc kich hoat tai khoan ngay (role GUEST), khong can admin can thiep.

- User moi xuat hien o tab "Active" voi role GUEST
- Admin van nhan email thong bao "[Dang ky moi]" de theo doi
- Khi user dong phi membership → admin confirm CK → role tu dong nang len VIP
- Vai tro admin: monitor + nang cap VIP, khong con la "gate keeper"

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

## 5. Quan ly Tieu bieu — Top SP va DN (Phase 4)

Trang `/admin/tieu-bieu` cho phep admin chon (pin) cac san pham va doanh nghiep tieu bieu se hien thi
o **trang chu** (carousel SP), **trang Quyen loi hoi vien** (top 10/20), va **trang San pham tieu bieu**.

### Truy cap
- Sidebar admin → "Tieu bieu" (icon ngoi sao)
- Hoac URL: `/admin/tieu-bieu`

### Stats card (dau trang)
- "San pham tieu bieu: X / 20 da chon" — soft limit, public page chi render 20 dau tien
- "Doanh nghiep tieu bieu: Y / 10 da chon"

### Tab "San pham tieu bieu"
Bang liet ke moi SP cua doanh nghiep VIP voi 5 cot:

| Cot | Mo ta |
|-----|-------|
| Tieu bieu | Checkbox toggle pin/unpin (auto-save) |
| Thu tu | Number input — nho hon = uu tien cao hon (1 = dau danh sach) |
| San pham | Anh thumbnail + ten |
| Doanh nghiep | Ten Company chu so huu |
| Chung nhan | Badge "Da cap" neu cert APPROVED |

**Cach pin san pham:**
1. Tick checkbox "Tieu bieu" → row chuyen sang nen vang nhat, o "Thu tu" enable
2. Nhap so thu tu (vd: 1, 2, 3...)
3. Auto-save ngay (khong can click Luu)

**Khi unpin** → tu dong xoa thu tu, row tro lai nen trang.

### Tab "Doanh nghiep tieu bieu"
Tuong tu, voi 5 cot: Tieu bieu / Thu tu / Doanh nghiep / Chu so huu / Xac minh.

### Quy tac validation
- **Chi pin SP/DN cua VIP**: Neu chu so huu khong phai VIP, API tra loi 400 va revert UI
- Khi user bi downgrade tu VIP ve GUEST, cac SP/DN cua user do bi tu dong hide khoi public page (filter o query)

### Cap nhat duoc nhin thay
- Trang chu (`/`): carousel "San pham tieu bieu" cap nhat trong ~5 phut (cache invalidation)
- Trang `/san-pham-tieu-bieu`: cap nhat trong ~10 phut
- Trang `/landing`: top 10 DN va top 20 SP cap nhat trong ~10 phut

> **Tip**: Pin nhung SP co anh dep va ten ngan goi de carousel trang chu nhin chuyen nghiep.

---

## 6. Xu ly bao cao vi pham

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

## 7. Quan ly tin tuc

### Danh sach tin tuc — `/admin/tin-tuc`

**Quick toggle truc tiep tren bang** (Phase 3.3 — 2026-04):
- **Cot "Trang thai"**: pill `Da xuat ban` (xanh) / `Nhap` (xam) → CLICK de
  toggle nhanh. Optimistic UI flip ngay, rollback neu API loi.
  - Chi user co `news:publish` (ADMIN, Ban Truyen thong) duoc bam. INFINITE
    thay disabled + tooltip giai thich.
- **Cot "Ghim"**: badge 📌 (highlight) hoac xam → click de toggle ghim.
  Bat ky user co `news:write` deu bam duoc.

Khong can vao trang chi tiet de bat/tat publish hoac ghim — tang toc thao tac
khi quan ly nhieu bai.

### Dang tin tuc moi

1. Truy cap: `/admin/tin-tuc` -> click "+ Tao tin tuc moi"
2. Dien: tieu de, slug (tu dong tao tu tieu de), tom tat, noi dung
3. **Chon phan loai** (sidebar "Cai dat xuat ban") — Phase 3.3 mo rong
   thanh **5 loai**:

| Loai | Enum | Hien thi | Yeu cau dac biet |
|------|------|----------|------------------|
| 📰 Tin tuc | `GENERAL` | `/tin-tuc` | — |
| 📚 Nghien cuu khoa hoc | `RESEARCH` | `/nghien-cuu` | — |
| 🏢 Tin doanh nghiep | `BUSINESS` | (lang TBD) | Phai chon Doanh nghiep lien quan |
| 📦 Tin san pham | `PRODUCT` | (lang TBD) | Chon Doanh nghiep + San pham cu the |
| ⚖️ Van ban phap ly | `LEGAL` | `/privacy`, `/terms` | Slug co dinh `chinh-sach-bao-mat`, `dieu-khoan-su-dung` |

**Khi chon BUSINESS hoac PRODUCT**: panel amber hien picker tim doanh nghiep
theo ten/slug. PRODUCT them ProductPicker filter theo doanh nghiep da chon.
API enforce required field — luu se loi neu chua chon.

4. **Chon dang bai (template)** — Phase 3.3 them 3 dang:

| Dang | Enum | Editor | Phan dau ra |
|------|------|--------|-------------|
| Binh thuong | `NORMAL` | RichTextEditor (text + anh + video chen lan) | Hien o trang chi tiet news |
| Tin anh | `PHOTO` | GalleryEditor (bulk upload + caption moi anh) | **Tu dong xuat hien o /multimedia (tab Hinh anh)** |
| Tin video | `VIDEO` | GalleryEditor (bulk URL YouTube + caption) | **Tu dong xuat hien o /multimedia (tab Video)** |

PHOTO/VIDEO yeu cau it nhat 1 muc gallery; co the keo tha (↑/↓) sap xep
thu tu, sua caption truc tiep tren tung muc.

5. **Tac gia** (sidebar) — Phase 3.3:
   - Mac dinh = tai khoan dang dang nhap
   - Chi ADMIN duoc chon tac gia khac (UserPicker tim hoi vien). Dung khi
     dang ho tac gia khong co tai khoan (vd Chu tich gui qua email)
   - User khong co quyen chi thay readonly hien ten
6. Upload anh bia (tuy chon — auto-crop 16:9)
7. **3 nut hanh dong** (Phase 3.3 — order moi): **Luu → Xem truoc → Xuat ban**
   - "Luu" = lưu voi trang thai isPublished hien tai
   - "Xem truoc" = mo modal preview giong public page
   - "Xuat ban" = set isPublished=true + luu (chi user co news:publish)

### Editor TipTap — tinh nang moi

**Toolbar co dinh (sticky)**: Khi scroll bai dai, toolbar luon hien o top.

**Text alignment**: 4 button ⇤ ⇔ ⇥ ☰ — canh trai/giua/phai/deu cho paragraph va heading.

**Image insert (Phase 3.3 cap nhat):**
1. Bam icon Anh tren toolbar -> mo popup ContentImageEditor
   - Tab "Cat anh 16:9" (mac dinh): pan + zoom de chon vung 16:9
   - Tab "Resize giu ti le": uniform scale, output ≤ 1000px canh dai
   - Field caption phia duoi anh (tuy chon)
   - **Nut X goc tren-phai** de dong popup nhanh
2. Sau khi chen:
   - Anh mac dinh **hien full width 16:9** (Phase 3.3 — match thumbnail viewer)
     - Mobile/desktop responsive tu dong
     - Neu muon thu nho: chon anh -> drag handle phai/duoi/goc → set inline
       width:Xpx (override default 100%)
3. **Caption sat anh** (Phase 3.3 — round 3 tinh chinh): khoang cach giua
   anh va dong chu thich da rut gon toi da theo phan hoi khach hang

**Video / audio insert (Phase 3.3 cap nhat):**
1. Bam icon Media -> popup MediaEmbedModal
2. Dan URL YouTube (youtu.be / youtube.com / shorts) hoac audio direct
   (.mp3/.m4a/.ogg/.wav)
3. **Field caption** (moi Phase 3.3) — chu thich hien duoi video/audio
4. Nut X goc tren-phai dong nhanh
5. Sau khi chen, click vao node de show input caption inline (sua tai cho)

### Bo loc danh sach
Bo loc tren danh sach `/admin/tin-tuc`:
- Tat ca (default)
- 📰 Tin tuc (GENERAL)
- 📚 Nghien cuu (RESEARCH)
- 🏢 Tin doanh nghiep (BUSINESS) — **moi**
- 📦 Tin san pham (PRODUCT) — **moi**
- ⚖️ Van ban phap ly (LEGAL)

### Multimedia da bi go khoi sidebar admin

**Phase 3.3 (2026-04)**: Menu "Multimedia" trong sidebar admin **da bi xoa**
vi News voi template=PHOTO/VIDEO **tu dong** xuat hien o trang public
`/multimedia`. Admin chi can quan ly News, khong can multi-step them mot
record Multimedia rieng.

Trang public `/multimedia` query union:
- Bang `multimedia` legacy (du lieu cu — giu de backward compat)
- News voi `template ∈ {PHOTO, VIDEO}` va `isPublished = true`

Click vao item News se mo `/tin-tuc/[slug]` (xem nguyen bai), item legacy mo
`/multimedia/[slug]` (route cu).

### Chinh sua / Xoa tin tuc
- Click "Chinh sua" tren tin can sua
- Doi noi dung + phan loai -> Luu
- Click "Xoa" de xoa vinh vien (can than, khong the khoi phuc)

### Cac thay doi cong khai khac (Phase 3.3)

- **Bo "Muc luc" (TOC)** o trang chi tiet bai cong khai (`/tin-tuc/[slug]` va
  `/nghien-cuu/[slug]`). Anchor IDs van duoc inject vao H2 → link share
  `#section-name` van hoat dong.
- **Fix YouTube khong hien o "Xem truoc"**: PreviewModal truoc day dung
  `DOMPurify.sanitize()` mac dinh → strip iframe. Da fix, dung
  `sanitizeArticleHtml` (whitelist iframe + figcaption) → preview giong
  public page 1:1.

### Import tu trang cu (chi chay 1 lan)

Developer co the import data thuc tu `hoitramhuongvietnam.org` qua:
```bash
# News (48 bai bang-tin-hoi + 7 bai nghien cuu)
npx tsx scripts/import-news-articles.ts
npx tsx scripts/import-research-articles.ts
npx tsx scripts/crawl-research-content.ts --category=GENERAL
npx tsx scripts/crawl-research-content.ts --category=RESEARCH
```
Script crawl tu dong download images + upload Cloudinary + sanitize HTML.

---

## 8. Quan ly don truyen thong

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

## 9. Cai dat he thong

### Truy cap: `/admin/cai-dat`

### 5 nhom cai dat:

**Thong tin Hoi:**
- Ten hoi, email, SDT (`association_phone`), SDT 2 (`association_phone_2`), dia chi
- **Website chinh thuc** (`association_website`) — hien o footer + block "Kenh truyen thong chinh thuc"
- **Link Facebook / Zalo OA (`zalo_url`)** (Phase 1: hien icon FB tren navbar + footer)
- **Link kenh YouTube** (Phase 1: hien icon YT tren navbar)
- Hien thi tren toan bo website, footer, email

**Footer website** (moi — noi dung hien o footer cong khai):
- `footer_brand_desc` (textarea) — doan gioi thieu ngan duoi logo
- `footer_working_hours` (textarea) — gio lam viec, moi dong 1 y
- `footer_legal_basis` (textarea) — co so phap ly / QD thanh lap
- `footer_copyright_notice` (textarea) — dong ban quyen duoi cung
- `footer_quick_links` (textarea) — moi dong 1 link theo format `Nhan|duong-dan`, vi du:
  ```
  Gioi thieu|/gioi-thieu
  Lien he|/lien-he
  Dieu khoan|/terms
  ```
- Thay doi -> luu -> footer cap nhat ngay (cache `footer` + `site-config` auto revalidate)
- Neu key trong, Footer fallback ve gia tri mac dinh trong code

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

## 10. Xu ly su co thuong gap

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

### User phan nan "het quota khong dang bai duoc" (Phase 2)
- Giai thich quota theo tier: GUEST 5 / VIP★ 15 / VIP★★ 30 / VIP★★★ ∞
- Quota reset vao 0h ngay 1 hang thang
- Khuyen user nang cap VIP de tang quota
- Neu can override quota cho user cu the: chinh SiteConfig keys `quota_guest_monthly`, `quota_vip_1_monthly`, ... va luu

### Trang chu khong thay san pham tieu bieu / DN tieu bieu
- Vao `/admin/tieu-bieu` -> kiem tra so SP/DN da pin
- Neu chua pin → trang chu se hien empty state
- Neu da pin nhung trang chu chua cap nhat: doi ~5 phut (cache stale-while-revalidate)

### Legacy user khong dang nhap duoc (loi AccessDenied)
- Phase 2 auto-fix: legacy GUEST inactive (pre-Phase 2) se tu dong duoc kich hoat khi sign in lan dau
- Neu user van bao loi: kiem tra `isActive` o `/admin/hoi-vien/[id]` -> click "Kich hoat"
- Neu role la VIP/ADMIN va `isActive: false` → la admin chu dong vo hieu hoa, can kich hoat lai bang tay

---

---

## 11. Van ban phap quy

### Tong quan
Trang `/admin/phap-ly` quan ly Dieu le, Quy che, Giay phep cua Hoi. File PDF
luu Google Drive, metadata luu DB. Hien thi cong khai tai `/phap-ly`.

### Bo cuc trang admin
1. **Header** — link `/phap-ly` de xem cong khai
2. **[1] Upload van ban moi** (collapse/expand) — form upload moi van ban:
   - Phan loai: 📜 Dieu le / 📋 Quy che / 🏛️ Giay phep
   - Thu tu hien thi (number)
   - Tieu de (bat buoc)
   - So van ban, Ngay ban hanh, Co quan ban hanh
   - Mo ta ngan
   - File PDF (max 20MB)
3. **[2] Search bar** — tim theo ten hoac so hieu
4. **[3-5] 3 section collapse** — Dieu le | Quy che | Giay phep:
   - Moi card hien thi metadata + nut Xem/Sua/Xoa
   - Sua inline (khong can reload)
   - Xoa: ca Drive + DB

### Them van ban moi
1. Mo section "Upload van ban moi"
2. Dien form day du
3. Upload PDF
4. He thong tu dong tao folder Drive neu chua co (VBPQ - Dieu le / Quy che / Giay phep)
5. Tra ve URL Drive + luu vao DB

### Sua van ban
- Click "Sua" tren card → form inline hien ra
- Doi metadata (title, documentNumber, issuedDate, issuer, description, sortOrder, isPublic)
- Luu

### Xoa van ban
- Click "🗑" → confirm → xoa ca Drive + DB (best-effort Drive)

### 8 van ban goc da duoc import
Khi setup lan dau, admin chay:
```bash
npx tsx scripts/import-legal-documents.ts
```
Script tu dong download 8 PDF tu trang cu + upload Drive + tao records.
Idempotent — chay lai se skip.

> Giay phep Dai hoi khong co direct URL tren trang cu → admin upload thu cong.

---

## 12. Don ket nap Hoi vien

### Tong quan
Theo Dieu le, de duoc cong nhan la Hoi vien chinh thuc, user can nop don va
duoc Ban Thuong vu xet duyet. Trang `/admin/hoi-vien/don-ket-nap` quan ly.

### Sidebar — badge "Don ket nap"
- Nav item co badge **do** hien so don chua duyet
- 0 don pending → badge an

### Bo cuc trang
- **4 tabs**: Cho duyet | Da duyet | Tu choi | Tat ca
- Tab "Cho duyet" hien badge count do ben canh
- Moi don la 1 card full-width voi:
  - Ten user + email + phone + company
  - Loai tai khoan (Doanh nghiep/Ca nhan)
  - Hang hien tai → Hang xin ket nap
  - Nguoi dai dien (BUSINESS only)
  - Ly do xin gia nhap (full text)
  - Lich su: nop luc, duyet luc, reviewer

### Duyet don (Approve)
1. Click button "✓ Phe duyet"
2. Form inline chon **finalCategory**:
   - Chinh thuc (default, theo yeu cau user)
   - Lien ket (override neu admin muon)
   - Danh du
3. Click "Xac nhan phe duyet"
4. He thong:
   - `user.memberCategory` cap nhat theo finalCategory
   - Application → `APPROVED`
   - Email chuc mung den user
5. Don tu tab "Cho duyet" chuyen sang "Da duyet"

### Tu choi don (Reject)
1. Click button "✗ Tu choi"
2. **Bat buoc** nhap ly do tu choi (textarea)
3. Click "Xac nhan tu choi"
4. He thong gui email voi ly do den user
5. User co the nop lai don sau khi bo sung

### Timeline theo Dieu le
- Ban Thuong vu xet tai cuoc hop hang quy
- Chu tich quyet dinh trong 30 ngay ke tu ngay nop day du
- SLA: admin nen xu ly don PENDING trong **30 ngay**

---

## 13. Che do xem (Public/Management mode)

### 2 che do xem
He thong co 2 che do cho admin:

| Che do | Menu hien thi | Khi nao |
|--------|-------------|---------|
| **Public** | Menu cong khai (Trang chu, Tin tuc, Nghien cuu, Doanh nghiep, San pham, Quyen loi) | Admin vao `/` hoac moi trang cong khai |
| **Management** | Admin sidebar day du (Tong quan, Hoi vien, Chung nhan, Van ban phap quy, ...) | Admin vao `/admin/*` |

### Chuyen giua 2 che do

**Tu Public → Management**:
1. O trang cong khai bat ky, click **avatar** (goc phai tren)
2. Dropdown hien "**Vao trang quan tri**" → click → navigate `/admin`
3. Sidebar hien ra, admin vao che do quan tri

**Tu Management → Public**:
1. O trang `/admin/*`, nhin sidebar trai
2. O cuoi sidebar (sau Dang xuat) co nut **"Ve trang cong khai"** (highlighted)
3. Click → navigate `/` → sidebar an, navbar cong khai hien

### Tai sao 2 che do?
- **Khong gay nham lan** — user cong khai thay menu nhu guest (trangki chu, tin tuc, ...)
- **Admin co the xem website nhu khach** — de verify cong viec
- **Khong bi khoa** — admin luon co the chuyen 2 chieu qua dropdown/sidebar

---

## 14. Quan ly Banner quang cao

Truy cap: `/admin/banner`. Quan ly cac banner do hoi vien dang ky.

### Vi tri (BannerPosition)
Banner duoc gan vao 1 trong 3 vi tri:
- **TOP** — slot tren cung trang chu, ngay sau thanh menu (ngang, aspect 5:1)
- **MID** — slot giua trang chu, sau khu San pham chung nhan (ngang, aspect 5:1)
- **SIDEBAR** — rail doc ben phai trang `/feed`, sticky khi user scroll (doc, aspect 2:3)

User chon vi tri khi dang ky tai `/banner/dang-ky`. Admin thay cot "Dau trang / Giua trang /
Rail doc (feed)" trong bang quan ly.

### Quy trinh duyet
1. User → `/banner/dang-ky` chon vi tri + thoi gian + upload anh + tra phi
2. Sau khi user CK → admin xac nhan o `/admin/thanh-toan`
3. Banner chuyen sang `PENDING_APPROVAL` → admin vao `/admin/banner` review noi dung
4. Approve → status `ACTIVE` → tu dong hien tren trang chu / feed (cache 60s)
5. Cron tu dong chuyen sang `EXPIRED` khi het han

**Tip**: neu khong co SIDEBAR banner dang ACTIVE, trang `/feed` hien card placeholder
"Dat banner quang cao" dan ve `/banner/dang-ky` → khuyen khich doanh nghiep mua slot.

---

## 15. Quan ly Doi tac

Truy cap: `/admin/doi-tac`. Quan ly cac co quan, doan the, doi tac truyen thong lien ket
voi Hoi — hien thi tren PartnersCarousel marquee trang chu (sau khu Tin san pham moi nhat).

### Thao tac
- **Them moi**: nut "+ Them doi tac" → form inline → upload logo (Cloudinary folder
  `doi-tac/MM-YYYY`) hoac dan URL truc tiep → chon phan loai → luu
- **Sua**: nut "Sua" tren tung card → form inline xuat hien
- **An / Hien**: toggle `isActive` → an khoi trang chu nhung khong xoa
- **Xoa**: nut "Xoa" → confirm → xoa han khoi DB

### Phan loai (PartnerCategory)
- `GOVERNMENT` — Co quan nha nuoc (Bo, So, Tong cuc...)
- `ASSOCIATION` — Hiep hoi nghe nghiep
- `RESEARCH` — Vien, truong, don vi nghien cuu
- `ENTERPRISE` — Doanh nghiep doi tac chien luoc
- `INTERNATIONAL` — To chuc quoc te
- `MEDIA` — Co quan bao chi, dai phat thanh – truyen hinh
- `OTHER` — Khac

### Luu y
- `sortOrder` so nho hien truoc (vi du 10, 20, 30...). De khoang trong de chen sau.
- Logo trong → component tu sinh initials tren nen mau (vi du: VTV, BNV) → admin nen
  upload logo that som de chuyen nghiep hon.
- Sau moi mutation: cache `partners` invalidate → carousel cap nhat ngay.

---

## 16. Chinh sach bao mat & Dieu khoan

Trang `/privacy` va `/terms` KHONG hardcode trong code — fetch tu News voi
`category=LEGAL` theo slug co dinh:

| Trang public | Slug News (LEGAL) |
|--------------|-------------------|
| `/privacy` | `chinh-sach-bao-mat` |
| `/terms` | `dieu-khoan-su-dung` |

### Cach sua noi dung
1. Vao `/admin/tin-tuc`
2. Mo bai "Chinh sach bao mat" hoac "Dieu khoan su dung" (dam bao `category=LEGAL`)
3. Sua bang rich-text editor → Luu
4. Trang public tu cap nhat sau ~10 phut (cache `legal-pages` revalidate 600s)

**Khong duoc doi slug** — neu doi se lam trang public hien empty state.

### Khoi "Kenh truyen thong chinh thuc & Canh bao gia mao"
Cuoi 2 trang `/privacy` va `/terms` (cung `/lien-he`, `/gioi-thieu`) co block hien thi:
- Danh sach kenh chinh thuc (Facebook, Zalo, YouTube, Email, Hotline) lay tu SiteConfig
- Tuyen bo Hoi khong chiu trach nhiem ve cac trang gia mao
- Huong dan bao cao trang gia mao

Cap nhat danh sach kenh: vao `/admin/cai-dat` sua cac key `facebook_url`, `zalo_url`,
`youtube_url`, `association_email`, `association_phone`, `association_website`. Bo trong
mot key se an dong tuong ung trong block.

---

---

## 17. Hang Infinite

### Hang Infinite la gi?
Role moi `INFINITE` — **admin chi-doc**. Danh cho lanh dao Hoi (Chu tich / Pho Chu tich) hoac
kiem tra vien can xem moi du lieu admin ma khong duoc thao tac mutation.

### Dac diem
- Xem moi trang `/admin/*` voi du lieu day du nhu ADMIN that.
- **Moi API mutation (POST/PATCH/PUT/DELETE)** bi chan voi HTTP 403.
- Moi nut "Them", "Sua", "Xoa", "Duyet", "Tu choi", "Kich hoat"... bi **disable** tren UI kem
  tooltip: *"Tai khoan Infinite o che do chi-doc"*.
- Banner canh bao read-only hien o dau moi trang `/admin/*` khi role=INFINITE.
- Khong bi check `membershipExpires` khi vao cac route VIP.
- Card hang: **nen den vien vang** (khac biet voi hang Vang/Bac/Basic).

### Cap / huy hang Infinite
1. Dang nhap bang tai khoan ADMIN (khong phai INFINITE — nut nay khong render cho INFINITE).
2. Vao `/admin/hoi-vien/[id]` cua user can cap.
3. Click nut **"Cap hang Infinite"**.
4. De huy: click **"Huy hang Infinite"** → user tro ve role `VIP` hoac `GUEST` (tuy `memberCategory`).

> Luu y: Co the nang tu VIP/GUEST len INFINITE tu chinh UI nay. Endpoint dung:
> `PATCH /api/admin/users/[id]/role` voi body `{ role: "INFINITE" | "VIP" | "GUEST" }`.

### Khi INFINITE lam viec
- Vao trang admin binh thuong, nhin thay banner vang:
  *"Ban dang o che do Infinite (chi-doc). Moi thao tac sua/xoa deu bi vo hieu hoa."*
- Co the vao sau mot trang chi tiet, click link, mo tab moi — nhung khong the luu form.

---

## 18. Quan ly Menu navbar

### Tong quan
Navbar cong khai (Trang chu, Gioi thieu, Nghien cuu, MXH Tram Huong, Hoi vien) duoc
**CMS-driven** qua model `MenuItem`. Admin co toan quyen CRUD: them / sua / an / xoa /
them submenu.

Truy cap: `/admin/menu`.

### Cau truc
- **1 cap submenu**: moi menu cha co the co nhieu con; menu con **khong co** cau con rieng.
- Hien tai seed 5 menu cha + 14 submenu (nhom duoi Gioi thieu, MXH Tram Huong, Hoi vien).

### Bo cuc trang
- **Cot trai**: cay menu (top-level → children), them nut **"+ Them submenu"** tren tung menu cha.
- **Cot phai**: form tao/sua.

### Cac field quan trong
| Field | Mo ta |
|-------|-------|
| `label` | Nhan hien thi (bat buoc) |
| `href` | Duong dan (vd `/gioi-thieu`, `https://fb.com/...`) |
| `parentId` | Menu cha (null = top-level) |
| `sortOrder` | Thu tu hien thi — so nho hien truoc |
| `isVisible` | An/hien cong khai |
| `isNew` | Badge "Moi" ben canh label |
| `comingSoon` | Badge "Sap ra mat" + disable click |
| `openInNewTab` | Mo tab moi |
| `matchPrefixes[]` | **Override highlight** — cac prefix pathname khi match thi menu nay active |
| `menuKey` | Key noi bo (vd `about`, `research`) lien ket voi registry trong code |

### `matchPrefixes` — override highlight
Neu admin muon 1 menu "Nghien cuu" cung active khi user vao `/tai-lieu-khoa-hoc`, them
prefix do vao `matchPrefixes`. Match tu `matchPrefixes` **thang** match tu registry code
(`lib/route-menu-map.ts`).

### `menuKey`
Key dinh danh menu cha de registry code (danh sach `{prefix, menuKey}` cho ~34 public route)
co the fallback active. Cac key hop le: `home`, `about`, `research`, `social`, `members`.

### Cache
- Menu tree cache 60s (`getMenuTree()` trong `lib/menu.ts`).
- Moi mutation (POST/PATCH/DELETE) tu dong clear cache.

### Validate
- API chan vong cha-con (khong the set `parentId` bang chinh ID node).
- API chan tao submenu cap 2 (1 cap thoi).

---

## 19. Gallery anh nen trang chu (`/admin/gallery`)

> **Muc dich**: Upload 1 bo anh phong canh (rung tram, canh dep...) lam **background xuyen suot toan bo trang cong khai**. He thong tu dong chon 1 anh moi ngay, ap dung cho tat ca user truy cap trong ngay do.

### Logic chon anh
- Moi ngay (theo mui gio **Viet Nam, YYYY-MM-DD**), he thong pick **deterministic** 1 anh trong so cac anh `isActive = true`.
- Deterministic = hash ngay → index → **moi user cung ngay thay cung 1 anh**, giup CDN cache tot + trai nghiem nhat quan.
- 00:00 giao sang ngay moi → anh tu dong doi sang anh khac trong list active.

### Bo cuc trang
- Nut **"+ Them anh"** → upload qua dialog (Cloudinary, folder `gallery`, resize toi da 2560px canh lon).
- **Preview grid**: xem truoc tat ca anh, inline sua `label`, `sortOrder`, toggle `isActive`, nut xoa.

### Cac field
| Field | Mo ta |
|-------|-------|
| `imageUrl` | URL Cloudinary (auto fill sau upload) |
| `label` | Nhan noi bo (vd "Rung tram Khanh Hoa") — khong hien thi cong khai |
| `sortOrder` | Thu tu hien thi trong admin grid (khong anh huong thuat toan pick) |
| `isActive` | Co vao pool pick hay khong — tat = tam an |

### Khuyen nghi khi upload
- Kich thuoc toi thieu **1920x1080**, uu tien landscape 16:9 hoac rong hon.
- **Phong canh it chi tiet** (bau troi, rung xa, texture) — tranh anh co nhieu chu / khuon mat / dong goc phai → vi noi dung cac section se chong len anh (ban trong suot).
- **Ton mau am nha / trung tinh** → khong lam choi mau voi brand.
- 5-15 anh la du cho 1 vong quay thoai mai (neu 15 anh → 15 ngay moi lap lai).

### Che do INFINITE
- Admin INFINITE (chi-doc) van xem duoc danh sach nhung moi nut upload / edit / xoa se disabled (`useAdminReadOnly()`).

---

## 20. Tin nhan lien he tu website (`/admin/lien-he`)

Truy cap: `/admin/lien-he`. Hien tat ca tin nhan khach gui qua form `/lien-he` cong khai.

### Luong du lieu
- Khach dien form name / email / phone / message → POST `/api/contact`
- API **luu vao DB truoc** (`ContactMessage` table) → sau do gui email thong bao qua Resend (best-effort)
- Du email bi spam-filter, tin nhan van hien tren admin UI → khong bo sot

### Thao tac
- Bang sap xep: NEW (cho xu ly) len dau, roi newest-first
- Badge **do** "Moi" ben ten nguoi gui neu status = NEW
- Cot Lien he: mailto/tel link → click goi/reply trong 1 cham
- Noi dung: line-clamp-3, co nut "Xem them" khi dai
- Cot **Trang thai**: select box doi:
  - **NEW** — cho xu ly (tinh vao badge chuong thong bao)
  - **HANDLED** — da lien he lai / xu ly xong
  - **ARCHIVED** — luu tru (spam, trung, khong can xu ly)

Khi doi sang HANDLED hoac ARCHIVED, he thong tu dong ghi lai `handledBy` (admin nao xu ly)
va `handledAt` (thoi diem) → tim lich su sau nay de doi chieu.

### Notification
Tin nhan NEW tu dong xuat hien:
- Badge do tren menu "Lien he" trong sidebar
- Trong dropdown chuong (workflow `contact`) o header
- Cap nhat moi 30s (poll) + refetch khi focus tab

---

## 21. Duyet bai viet cua hoi vien

### Tai sao co moi truong nay
Tu phien ban hien tai, MOI bai viet do hoi vien dang (qua `/feed` hoac `/feed/tao-bai`)
deu PHAI qua admin kiem duyet truoc khi cong khai. Co che:
- Bai moi dang → `status: PENDING`
- Tac gia thay bai cua minh ngay trong feed, kem badge vang "Cho duyet"
- NGUOI KHAC khong thay bai PENDING — feed filter loai ra, truy cap truc tiep
  URL `/bai-viet/[id]` tra 404
- Admin duyet → `status: PUBLISHED` → cong khai voi moi nguoi
- Admin tu choi → `status: LOCKED` + `moderationNote` (ly do). Tac gia thay
  banner do voi ly do de sua lai; con sua → status tu PENDING ve lai hang cho

### Admin bypass
Bai do admin tao (role=ADMIN) thi tu dong PUBLISHED (khong qua cho duyet).
INFINITE, VIP, va user binh thuong KHONG bypass — moi tier phai qua kiem duyet.

### Khi co bai moi cho duyet
- Sidebar: menu "Duyet bai viet" hien badge do voi so luong bai cho duyet
- NotificationBell (chuong o header): workflow `post` trong dropdown
- Badge poll 30s tu api `/api/admin/pending-counts`

### Cach xu ly
1. Truy cap: `/admin/bai-viet/cho-duyet`
2. Moi bai hien:
   - Avatar + ten + email tac gia
   - Noi dung plain text preview
   - Anh dinh kem (toi da 4 anh hien — con lai click "Xem chi tiet")
   - Thoi gian dang
3. Cac nut hanh dong:
   - **"Xem chi tiet ↗"**: mo tab moi xem bai day du (admin co quyen xem bai PENDING)
   - **"Duyet"** (xanh): confirm → bai PUBLISHED, cap nhat cache feed
   - **"Tu choi"** (do): prompt nhap ly do (5-500 ky tu) → bai LOCKED + `moderationNote`

### Luu y xu ly
- Duyet nhanh: uu tien bai dau hang (sort theo `createdAt ASC`, bai cu nhat len dau)
- Ly do tu choi NEN CU THE de user sua dung: "Hinh anh khong lien quan trang huong"
  tot hon "Noi dung khong phu hop"
- Tac gia edit bai bi tu choi → bai tu dong quay ve PENDING + xoa
  `moderationNote` cu. Admin se thay lai trong hang cho voi noi dung moi.

### Khac biet voi bai cao vi pham (Section 6)
- **Duyet bai** (section nay): pre-moderation, bai moi chua bao gio cong khai
- **Bao cao vi pham**: post-moderation, bai da cong khai nhung user report vi pham
  → auto-lock khi 5+ reports → admin xu ly qua `/admin/bao-cao`

Ca 2 khi LOCKED: moderation reject dung `moderationNote`, auto-lock tu report
dung `lockReason`. Tac gia thay banner khac nhau (do/vang) de phan biet nguon goc.

---

> **Lien he ky thuat**: Khi gap su co ngoai pham vi tai lieu nay, lien he doi ngu ky thuat qua email/Zalo da cung cap.
