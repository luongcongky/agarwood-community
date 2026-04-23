# API Documentation — Hoi Tram Huong Viet Nam

> Reference cho mobile app hoac tich hop ben thu 3 trong tuong lai.
> Base URL: `https://[domain]`
> Auth: JWT token trong cookie `next-auth.session-token`

---

## Authentication

Tat ca API yeu cau auth su dung NextAuth session cookie. Gui cookie trong moi request.

### Auth Providers
| Provider | Endpoint | Ghi chu |
|----------|---------|---------|
| Google OAuth | `/api/auth/callback/google` | Dang nhap / dang ky nhanh, auto-link email trung |
| Credentials | `/api/auth/callback/credentials` | Dang nhap bang email + mat khau |

### Roles (cap nhat Phase 2 + INFINITE)
| Role | Quyen |
|------|------|
| GUEST | Free tier — dang ky xong dung ngay, post 5 bai/thang |
| VIP | Hoi vien dong phi — quota cao + uu tien hien thi trang chu |
| ADMIN | Toan quyen, quota khong gioi han |
| INFINITE | **Admin chi-doc** — xem moi admin endpoint (GET) nhu ADMIN, **moi mutation (POST/PATCH/PUT/DELETE) tra 403**. Guard dung `canAdminWrite()` trong `lib/roles.ts`. |

> **Mutation guard chung**: tat ca admin endpoint mutation (bao gom cac endpoint da doc
> trong tai lieu nay) hien dung `canAdminWrite(role)` — INFINITE bi 403. Endpoint chi-doc
> (GET) dung `isAdmin(role)` — ADMIN + INFINITE deu vao duoc.

> **Phase 2 breaking change**: Bo flow "GUEST cho duyet". User dang ky xong la `isActive: true` ngay,
> co the dang nhap va post bai. VIP la nang cap thuong (qua membership fee), khong phai gate.

---

## 1. Posts (Feed)

### GET /api/posts
Lay danh sach bai viet (cursor pagination). Ho tro filter theo category + chung nhan
phuc vu MXH Tram Huong (gop feed + marketplace).

**Query params:**
| Param | Type | Mo ta |
|-------|------|-------|
| cursor | string | ID bai viet cuoi cung (optional, trang dau khong can) |
| category | enum | `GENERAL` / `NEWS` / `PRODUCT` — loc theo loai bai. Bo trong = tat ca |
| certified | "1" | Khi `=1` chi tra bai PRODUCT co `product.certStatus=APPROVED` |

**Response:** `{ posts: Post[] }` — moi `Post` voi `category=PRODUCT` se kem field `product` (sidecar metadata):
```json
{
  "category": "PRODUCT",
  "product": {
    "id": "cuid",
    "name": "Tram huong Khanh Hoa",
    "slug": "tram-khanh-hoa",
    "priceRange": "1tr-3tr",
    "category": "Tram tu nhien",
    "badgeUrl": null,
    "certStatus": "APPROVED"
  }
}
```

```json
{
  "posts": [
    {
      "id": "cuid",
      "authorId": "cuid",
      "title": "Tieu de",
      "content": "<p>HTML content</p>",
      "imageUrls": [],
      "status": "PUBLISHED",
      "isPremium": true,
      "isPromoted": false,
      "authorPriority": 20,
      "viewCount": 42,
      "createdAt": "2026-04-06T09:00:00.000Z",
      "author": {
        "id": "cuid",
        "name": "Nguyen Van A",
        "avatarUrl": null,
        "role": "VIP",
        "contributionTotal": 20000000,
        "company": { "name": "Tram Huong Ha Noi", "slug": "tram-huong-ha-noi" }
      },
      "reactions": [{ "type": "LIKE" }],
      "_count": { "reactions": 12 }
    }
  ]
}
```

### POST /api/posts
Tao bai viet moi. Cho phep moi user dang nhap (GUEST/VIP/ADMIN), check post quota theo thang.

**Body:**
```json
{
  "title": "Tieu de (optional)",
  "content": "<p>Noi dung HTML, toi thieu 50 ky tu</p>",
  "category": "GENERAL",
  "product": null
}
```

`category` (optional, default `GENERAL`):
- `GENERAL` — bai feed thuong
- `NEWS` — tin tuc doanh nghiep (co the len section 5 trang chu neu user la VIP)
- `PRODUCT` — bai san pham (xem `product` field ben duoi)

**MXH merge — composer gop**: khi `category="PRODUCT"` va body co `product`, server tao
ca `Post` + `Product` trong **1 transaction**, link qua `Product.postId`. Hien thi tren feed
voi product card variant + nut "Xem chi tiet" → `/san-pham/[slug]`.

```json
"product": {
  "name": "Tram huong Khanh Hoa cao cap",
  "slug": "tram-khanh-hoa-cao-cap",
  "category": "Tram tu nhien",
  "priceRange": "1tr-3tr"
}
```

Khi `product` co mat:
- Server validate slug `^[a-z0-9-]+$`, kiem tra `Product.slug` unique
- Check ca **post quota** + **product quota** (lib/product-quota.ts)
- Server tu fetch `companyId` cua user neu co
- `imageUrls` + `description` cua Product duoc trich tu HTML content cua post

**Response:** `201 { post: Post }` — `Post` luon kem field `author` (id, name, avatarUrl, role,
accountType, contributionTotal, company), va kem `product` neu `category=PRODUCT`. Client co the
dung response truc tiep cho optimistic UI (vd FeedClient prepend post moi qua sessionStorage
hand-off khi redirect tu /feed/tao-bai → /feed).

**Moderation (2026-04 — them moi):** Bai moi duoc gan `status: "PENDING"` mac dinh,
chi co admin (role=ADMIN) tao bai moi tu dong PUBLISHED. INFINITE/VIP/user thuong
KHONG bypass. Sau khi tao:
- Tac gia thay bai cua minh trong feed voi badge "Cho duyet"
- Nguoi khac KHONG thay bai PENDING (feed filter loai ra)
- Truy cap URL `/bai-viet/{id}` khi PENDING → 404 cho nguoi khong phai owner/admin

Bai sau khi admin REJECT (`status: LOCKED` + `moderationNote`): cung an khoi public
(giong PENDING), chi owner/admin thay. Bai auto-lock tu 5+ reports (`status: LOCKED`
KHONG co `moderationNote`) van public de nguoi report xac nhan da xu ly.

Admin duyet qua `PATCH /api/admin/posts/{id}` (xem section 1.5 ben duoi).

**Cache invalidation:** Sau khi tao post thanh cong, server goi `revalidatePath("/[locale]/feed", "page")`
→ feed page (revalidate=60) bi invalidate ngay, bai moi hien tuc thi thay vi cho ~60s.

**Performance (refactor 2026-04 — ADR-028):** Truoc day handler chay 5-10 query tuan tu
voi 2-3 lan fetch `user` trung lap. Hien tai: 1 user fetch + `Promise.all([postCount, productCount,
slugConflict, company])` → giam ~50% round-trip (PRODUCT case ~10 → ~4). Xem ADR-028.

**Errors:**
- `401` — Chua dang nhap
- `400` — Noi dung qua ngan (< 50 ky tu) / slug khong hop le / ten SP qua ngan
- `409` — Slug san pham da ton tai
- `429` — Het quota post HOAC quota san pham thang nay. Response body co `quota`

### GET /api/posts/quota
Tra ve quota thang hien tai cua user dang dang nhap. Yeu cau: dang nhap.

**Response:**
```json
{
  "used": 3,
  "limit": 5,
  "remaining": 2,
  "resetAt": "2026-05-01T00:00:00.000Z"
}
```
- `limit: -1` = unlimited
- `remaining: -1` = unlimited
- Quota theo role/tier: GUEST 5 / VIP★ 15 / VIP★★ 30 / VIP★★★ -1 / ADMIN -1

### DELETE /api/posts/{id}
Xoa bai viet (soft delete). Yeu cau: tac gia hoac ADMIN.

**Response:** `{ success: true }`

### POST /api/posts/{id}/react
Toggle reaction "Huu ich". Yeu cau: VIP hoac ADMIN.

**Response:** `{ liked: boolean }`

### POST /api/posts/{id}/report
Bao cao bai viet. Yeu cau: VIP hoac ADMIN. Moi user chi bao cao 1 lan / bai.

**Body:**
```json
{ "reason": "Ly do bao cao" }
```

**Response:** `{ success: true }`
**Errors:** `409` — Da bao cao bai nay roi

### POST /api/posts/{id}/lock
Khoa / mo khoa bai viet. Yeu cau: ADMIN.

**Response:** `{ status: "LOCKED" | "PUBLISHED" }`

### PATCH /api/posts/{id}
Chinh sua noi dung bai. Yeu cau: tac gia hoac ADMIN.

**Body:**
```json
{ "title": "Tieu de moi", "content": "<p>Noi dung...</p>" }
```

**Moderation (2026-04):** Khi tac gia (khong phai admin) edit bai, bai tu dong
quay ve `status: "PENDING"` va clear cac field `moderationNote/moderatedAt/moderatedBy`.
Admin edit thi giu nguyen status hien tai.

**Response:** `{ success: true }`
**Errors:** `400` — noi dung < 50 ky tu. `403` — khong phai tac gia/admin. `404` — khong tim thay.

---

## 1.5 Post moderation (Admin-only, 2026-04)

### GET /api/admin/pending-counts
(Extend existing endpoint — xem section 4 chi tiet)

Response workflow `post` them moi:
```json
{
  "workflows": {
    "post": {
      "count": 5,
      "recent": [
        { "id": "...", "title": "...", "subtitle": "Nguyen Van A",
          "href": "/admin/bai-viet/cho-duyet?id=...", "createdAt": "..." }
      ]
    }
  }
}
```

### PATCH /api/admin/posts/{id}
Admin duyet hoac tu choi bai PENDING. Yeu cau: `canAdminWrite()` (ADMIN, khong INFINITE).

**Body — approve:**
```json
{ "action": "approve" }
```
Set `status: "PUBLISHED"`, clear `moderationNote`, cap nhat `moderatedAt/moderatedBy`.

**Body — reject:**
```json
{ "action": "reject", "note": "Ly do tu choi (5-500 ky tu)" }
```
Set `status: "LOCKED"`, luu `moderationNote`. Tac gia se thay banner do voi ly do,
co the chinh sua va gui lai.

**Response:** `{ ok: true }` khi thanh cong
**Errors:**
- `400` — action sai hoac note rong (reject)
- `403` — khong co quyen (role khong phai ADMIN)
- `404` — khong tim thay bai
- `409` — bai khong o trang thai PENDING (vd da duyet roi)

**Cache invalidation:** Goi `revalidatePath("/[locale]/feed", "page")` sau khi
update de feed moi nguoi (public) thay bai vua duyet ngay.

---

## 1B. Featured Pin (Phase 4 — Sản phẩm tiêu biểu)

### PATCH /api/admin/products/{id}/featured
Pin/unpin san pham vao danh sach "San pham tieu bieu". Yeu cau: ADMIN.

**Body:**
```json
{
  "isFeatured": true,
  "featuredOrder": 1
}
```

**Validate**: SP phai thuoc Company co `owner.role === "VIP"`. Tra `400` neu owner khong phai VIP.

**Response:** `{ id, isFeatured, featuredOrder }`

**Side effects:**
- Khi `isFeatured: false` → `featuredOrder` tu dong set null
- `revalidateTag("homepage", "max")` + `revalidateTag("products", "max")`

### PATCH /api/admin/companies/{id}/featured
Pin/unpin doanh nghiep vao Top 10 DN tieu bieu. Yeu cau: ADMIN.

**Body:** giong endpoint products above.

**Validate**: Company.owner.role === "VIP". Tra `400` neu khong phai VIP.

---

## 2. Membership & Payment

### POST /api/membership/renew
Tao yeu cau gia han membership. Yeu cau: VIP.

**Body:**
```json
{ "amount": 5000000 }
```
Chi chap nhan: membership_fee_min hoac membership_fee_max tu SiteConfig.

**Response:**
```json
{
  "orderCode": "1712345678901",
  "bankInfo": {
    "bankName": "Vietcombank",
    "accountNumber": "1234567890",
    "accountName": "HOI TRAM HUONG VIET NAM",
    "amount": 5000000,
    "description": "HOITRAMHUONG-MEM-NVA-20260406"
  }
}
```

**Errors:**
- `409` — Da co payment PENDING (idempotency)

### POST /api/admin/payments/{id}/confirm
Admin xac nhan chuyen khoan. Yeu cau: ADMIN.

**Response:** `{ success: true }`

**Side effects:**
- Payment status -> SUCCESS
- Membership status -> ACTIVE, gia han 1 nam
- User contributionTotal += amount
- User displayPriority = floor(newTotal / 1M)
- Post authorPriority updateMany
- Email gui cho VIP

### POST /api/admin/payments/{id}/reject
Admin tu choi chuyen khoan. Yeu cau: ADMIN.

**Body:**
```json
{ "reason": "Khong tim thay giao dich" }
```
Reason **bat buoc**.

**Response:** `{ success: true }`

---

## 3. Certification

### POST /api/certification/create-order
Nop don chung nhan SP. Yeu cau: VIP voi membership con han.

**Body:**
```json
{
  "productId": "cuid",
  "applicantNote": "Mo ta san pham",
  "isOnlineReview": true,
  "bankAccountName": "NGUYEN VAN A",
  "bankAccountNumber": "1234567890",
  "bankName": "Vietcombank"
}
```

**Response:**
```json
{
  "certId": "cuid",
  "paymentId": "cuid",
  "orderCode": "1712345678901",
  "bankInfo": { ... }
}
```

**Errors:**
- `403` — Membership het han
- `409` — SP da co don dang xu ly

### POST /api/admin/certifications/{id}/approve
Duyet chung nhan. Yeu cau: ADMIN.

**Body:** `{ "reviewNote": "Optional" }`

**Response:** `{ success: true, certCode: "HTHVN-2026-0001" }`

### POST /api/admin/certifications/{id}/reject
Tu choi chung nhan. Yeu cau: ADMIN.

**Body:** `{ "reviewNote": "Bat buoc — ly do tu choi" }`

### POST /api/admin/certifications/{id}/refund
Xac nhan da hoan tien. Yeu cau: ADMIN. Chi cho cert status = REJECTED.

---

## 4. Users (Admin)

### POST /api/auth/register
Dang ky tai khoan (free tier). **KHONG can auth.**

**Body:**
```json
{
  "accountType": "BUSINESS",
  "name": "Nguyen Van D",
  "email": "d@example.com",
  "phone": "0901234567",
  "companyName": "Tram Huong XYZ",
  "companyField": "Tram tu nhien",
  "reason": "Muon gia nhap..."
}
```
accountType: `BUSINESS` (tao Company) | `INDIVIDUAL` (khong tao Company)

**Phase 2 changes:**
- User tao voi `isActive: true` (kich hoat ngay), khong con cho admin duyet
- Bo slot limit `max_vip_accounts` o register (slot chi enforce khi nang cap VIP)
- Email confirmation: "Tai khoan da kich hoat" thay vi "Cho duyet 3 ngay"

### POST /api/admin/registrations/{id}
**Phase 2: deprecated**. Khong con flow duyet don dang ky. Endpoint co the bi xoa trong tuong lai.

### POST /api/admin/users
Tao VIP moi (thu cong). Yeu cau: ADMIN.

**Body:**
```json
{
  "name": "Nguyen Van D",
  "email": "d@example.com",
  "phone": "0901234567",
  "password": "12345678",
  "sendInvite": false
}
```

### POST /api/admin/users/{id}/toggle-active
Bat / tat tai khoan VIP. Yeu cau: ADMIN.

### POST /api/admin/users/{id}/resend-invite
Gui lai email moi (tao token moi 48h). Yeu cau: ADMIN.

### PATCH /api/admin/users/{id}/role
Cap / huy role dac biet (INFINITE). Yeu cau: **ADMIN** (INFINITE khong the tu nang cap /
xuong cap minh hoac user khac).

**Body:**
```json
{ "role": "INFINITE" }
```
Gia tri hop le: `"INFINITE" | "VIP" | "GUEST"` (khong cho set thang `ADMIN` qua endpoint nay).

**Response:** `{ success: true, user: { id, role } }`

**Side effects:**
- Khi set INFINITE: user bo qua check `membershipExpires` o cac route VIP.
- Khi huy (set VIP/GUEST): tuy `memberCategory` va `membershipExpires` van con han.

**Errors:**
- `401` — Chua dang nhap
- `403` — Role nguoi goi khong phai ADMIN (INFINITE cung bi 403 vi day la mutation)
- `400` — Gia tri role khong hop le

---

### POST /api/admin/users/{id}/reset-password
Dat lai mat khau hoi vien. Yeu cau: ADMIN. Khong ap dung cho tai khoan ADMIN.

**Process:**
1. Xoa token cu cua email hoi vien
2. Tao token moi (48h)
3. Gui email voi link `/dat-mat-khau?token=...&email=...`

**Response:** `{ success: true }`

### POST /api/auth/forgot-password
Hoi vien tu yeu cau dat lai mat khau tu trang `/quen-mat-khau`. **KHONG can auth.**

**Body:**
```json
{ "email": "user@example.com" }
```

**Process:**
1. Validate format email
2. Tim user theo email
3. Neu khong ton tai HOAC role = ADMIN -> van tra ve `{ success: true }` (chong email enumeration)
4. Xoa token cu, tao token moi (48h), luu VerificationToken
5. Gui email voi link `/dat-mat-khau?token=...&email=...` qua Resend

**Response:** luon `{ success: true }` (kể ca khi email khong ton tai)

**Security note:** luon tra success de attacker khong the dung endpoint nay de do email nao da dang ky.

**Errors:**
- `403` — Khong phai ADMIN
- `404` — Khong tim thay nguoi dung
- `400` — Khong the reset mat khau tai khoan ADMIN
- `500` — Khong the gui email

---

## 5. Media Orders

### POST /api/media-orders
Dat dich vu truyen thong. **KHONG can auth** (guest dat duoc).

**Body:**
```json
{
  "name": "Nguyen Van A",
  "email": "a@example.com",
  "phone": "0901234567",
  "companyName": "Tram Huong ABC",
  "serviceType": "ARTICLE_COMPANY",
  "requirements": "Mo ta yeu cau (>50 ky tu)",
  "targetKeywords": "tram huong tu nhien",
  "referenceUrl": "https://example.com",
  "budget": "5-10 trieu",
  "deadline": "2026-05-01"
}
```

serviceType: `ARTICLE_COMPANY | ARTICLE_PRODUCT | PRESS_RELEASE | SOCIAL_CONTENT`

**Response:** `{ success: true, orderRef: "MO-20260406-0042" }`

### PATCH /api/admin/media-orders/{id}
Cap nhat don. Yeu cau: ADMIN.

**Body:**
```json
{
  "status": "CONFIRMED",
  "assignedTo": "editor@example.com",
  "quotedPrice": 3000000,
  "internalNote": "Ghi chu noi bo",
  "deliveryFileUrls": ["https://cloudinary.com/..."],
  "cancelReason": "Ly do huy (khi CANCELLED)"
}
```

status: `NEW | CONFIRMED | IN_PROGRESS | DELIVERED | REVISION | COMPLETED | CANCELLED`

---

## 6. Membership Application (Don ket nap Hoi vien)

### POST /api/membership/application
User nop don xin ket nap Hoi vien chinh thuc. Yeu cau: dang nhap (GUEST/VIP).

**Body**:
```json
{
  "reason": "Ly do xin gia nhap, toi thieu 20 ky tu...",
  "requestedCategory": "OFFICIAL",
  "representativeName": "Ten nguoi dai dien (BUSINESS only)",
  "representativePosition": "Chuc vu (optional)"
}
```

`requestedCategory`: `OFFICIAL | AFFILIATE | HONORARY`

**Response**: `{ ok: true, applicationId: "cuid" }`

**Errors**:
- `400` — Reason < 20 ky tu hoac > 2000 ky tu
- `400` — BUSINESS account khong cung cap `representativeName`
- `409` — Da co don `PENDING` (idempotency block)

### GET /api/membership/application
User xem lich su don cua minh (sap xep moi nhat truoc). Yeu cau: dang nhap.

**Response**:
```json
{
  "applications": [
    {
      "id": "cuid",
      "status": "PENDING",
      "requestedCategory": "OFFICIAL",
      "submittedAt": "2026-04-11T...",
      "reviewedAt": null,
      "rejectReason": null
    }
  ]
}
```

### PATCH /api/admin/membership-applications/{id}
Admin duyet hoac tu choi don. Yeu cau: ADMIN.

**Body (APPROVE)**:
```json
{
  "action": "APPROVE",
  "finalCategory": "OFFICIAL"
}
```

**Body (REJECT)**:
```json
{
  "action": "REJECT",
  "rejectReason": "Ho so chua day du..."
}
```

**Side effects**:
- APPROVE: `user.memberCategory` cap nhat theo `finalCategory` + email chuc mung
- REJECT: don cap nhat `status: REJECTED` + `rejectReason` + email thong bao user

**Response**: `{ success: true }`

---

## 7. Van ban phap quy (admin)

### POST /api/admin/phap-ly
Upload van ban phap quy moi. Yeu cau: ADMIN.

**Body (FormData)**:
- `file` — PDF file, max 20MB
- `title` — tieu de
- `documentNumber` — so VB (vd "56/QD-VAWA")
- `issuedDate` — ngay ban hanh (YYYY-MM-DD)
- `issuer` — co quan ban hanh
- `description` — mo ta ngan
- `category` — `DIEU_LE | QUY_CHE | GIAY_PHEP`
- `sortOrder` — thu tu hien thi (number)

**Side effects**:
- Upload file len Google Drive folder tuong ung (`VBPQ - Dieu le`, v.v.)
- Tao `Document` record voi `isPublic: true`
- Tra ve Cloudinary URL + metadata

### PATCH /api/admin/phap-ly/{id}
Cap nhat metadata (khong doi file). Yeu cau: ADMIN.

**Body**:
```json
{
  "title": "...",
  "documentNumber": "...",
  "issuedDate": "2024-01-22",
  "issuer": "...",
  "description": "...",
  "sortOrder": 1,
  "isPublic": true
}
```

### DELETE /api/admin/phap-ly/{id}
Xoa van ban (ca Drive + DB). Yeu cau: ADMIN. Best-effort Drive delete.

---

## 8. News category (admin)

### POST /api/admin/news + PATCH /api/admin/news/{id}
Field `category` co 3 gia tri:

```json
{ "category": "GENERAL" }    // → hien thi /tin-tuc
{ "category": "RESEARCH" }   // → hien thi /nghien-cuu
{ "category": "LEGAL" }      // → render o /privacy hoac /terms theo slug co dinh
```

**Quy uoc slug cho LEGAL:**
- `chinh-sach-bao-mat` → trang `/privacy`
- `dieu-khoan-su-dung` → trang `/terms`

Trang fetch noi dung qua `lib/legal-pages.ts` (`unstable_cache` revalidate 600s, tag
`legal:<key>`). Admin sua noi dung qua `/admin/tin-tuc/[id]` chon category=LEGAL —
trang public tu cap nhat sau 10 phut.

---

## 9. Banner quang cao (Phase 6)

Banner quang cao chia 3 vi tri (`BannerPosition`):
- `TOP` — sau menu trang chu (ngang, aspect 5:1)
- `MID` — giua trang chu (sau khu San pham chung nhan, ngang 5:1)
- `SIDEBAR` — rail doc ben phai trang `/feed` (aspect 2:3, sticky khi scroll) — **added 2026-04**

### POST /api/banner
User dang ky banner — tao Banner + Payment trong 1 transaction.

**Body:**
```json
{
  "imageUrl": "https://res.cloudinary.com/.../banner.jpg",
  "targetUrl": "https://...",
  "title": "Tieu de banner (5-100 ky tu)",
  "startDate": "2026-04-15",
  "endDate": "2026-05-15",
  "position": "SIDEBAR"
}
```

**Note:** `position` chap nhan `"TOP" | "MID" | "SIDEBAR"`. Gia tri mac dinh / fallback = `"TOP"`.

**Response:** `{ bankInfo, price, paymentId, bannerId }`

**Errors:**
- `429` — Het quota banner thang nay theo tier (1 / 5 / 10 / 20)
- `400` — Date khong hop le, title sai do dai

### GET /api/banner/quota
Tra ve quota banner thang hien tai cua user.

### POST /api/admin/banner/{id}
Approve hoac reject banner. Yeu cau: ADMIN. `revalidateTag("banners","max")`.

---

## 10. Doi tac (Partner)

CRUD doi tac / co quan dien thai lien ket — hien thi tren PartnersCarousel marquee
trang chu. Phan loai qua enum `PartnerCategory` (GOVERNMENT, ASSOCIATION, RESEARCH,
ENTERPRISE, INTERNATIONAL, MEDIA, OTHER).

### POST /api/admin/partners
Tao moi. Yeu cau: ADMIN.

**Body:**
```json
{
  "name": "Dai Truyen hinh Viet Nam",
  "shortName": "VTV",
  "category": "MEDIA",
  "logoUrl": "https://res.cloudinary.com/.../doi-tac/04-2026/vtv.png",
  "websiteUrl": "https://vtv.vn",
  "description": "Dai Truyen hinh Quoc gia...",
  "sortOrder": 20,
  "isActive": true
}
```

Logo upload qua `/api/upload` voi `folder: "doi-tac"`. Khong co `logoUrl` → component
hien initials tren nen mau sinh tu hash ten.

### PATCH /api/admin/partners/{id}
Cap nhat ban ghi (cho phep gui mot phan field). `isActive=false` an khoi trang chu.

### DELETE /api/admin/partners/{id}
Xoa han ban ghi.

Sau moi mutation: `revalidateTag("partners","max")` → carousel trang chu cap nhat ngay.

---

## 10.5 Menu navbar (CMS)

Navbar cong khai duoc quan ly qua model `MenuItem` (1 cap submenu). Cache 60s, auto
invalidate moi khi write.

### GET /api/admin/menu
Tra ve cay menu day du (top-level + children). Yeu cau: `isAdmin()` (ADMIN + INFINITE).

**Response:**
```json
{
  "items": [
    {
      "id": "cuid",
      "label": "Gioi thieu",
      "href": "/gioi-thieu",
      "parentId": null,
      "sortOrder": 20,
      "isVisible": true,
      "isNew": false,
      "comingSoon": false,
      "openInNewTab": false,
      "matchPrefixes": ["/gioi-thieu", "/lien-he"],
      "menuKey": "about",
      "children": [
        { "id": "cuid", "label": "Lien he", "href": "/lien-he", ... }
      ]
    }
  ]
}
```

### POST /api/admin/menu
Tao menu item moi. Yeu cau: **ADMIN** (`canAdminWrite()` — INFINITE bi 403).

**Body:**
```json
{
  "label": "Tin tuc",
  "href": "/tin-tuc",
  "parentId": null,
  "sortOrder": 30,
  "isVisible": true,
  "isNew": false,
  "comingSoon": false,
  "openInNewTab": false,
  "matchPrefixes": ["/tin-tuc"],
  "menuKey": "news"
}
```

**Validate:**
- `label`, `href` bat buoc
- `parentId` neu co: phai ton tai va phai la top-level (khong cho submenu cua submenu)
- `menuKey` neu co: unique toan bang

**Response:** `201 { item: MenuItem }`

**Errors:**
- `403` — Khong phai ADMIN
- `400` — Parent la submenu (depth > 1) hoac menuKey trung
- `409` — menuKey duplicate

### PATCH /api/admin/menu/{id}
Cap nhat menu item. Yeu cau: **ADMIN**.

**Body:** partial — bat cu field nao trong `label, href, parentId, sortOrder, isVisible,
isNew, comingSoon, openInNewTab, matchPrefixes, menuKey`.

**Validate:**
- Chan vong: `parentId` khong duoc la chinh `id` hoac descendant
- Chan submenu cap 2
- `menuKey` unique

**Response:** `{ item: MenuItem }`

### DELETE /api/admin/menu/{id}
Xoa menu item. Yeu cau: **ADMIN**. Cascade xoa children (neu co).

**Response:** `{ success: true }`

**Side effects (tat ca write endpoints)**:
- `revalidateTag("menu-tree")` → navbar cong khai cap nhat trong vong ~60s (thuc te ngay
  khi tag invalidate).

---

## 11. Other

### POST /api/upload
Upload anh len Cloudinary. Yeu cau: dang nhap.

**Body:** FormData voi:
- `file` — image/*, max 5MB (bat buoc)
- `folder` — menu name (bat buoc, vd: `bai-viet`, `san-pham`, `tin-tuc`, `doanh-nghiep`,
  `banner`, `doi-tac`). Server tu them `MM-YYYY` sub-folder.
- `maxWidth` — (tuy chon) so px ghi de cap width mac dinh. Server kep trong khoang
  `200..4000`; gia tri ngoai khoang hoac khong hop le se fallback ve preset theo folder.

**Cap width mac dinh theo folder** (Cloudinary `crop: "limit"` — chi downscale):

| Folder | maxWidth | Ly do |
|--------|----------|-------|
| `bai-viet` | 1200px | Noi dung post render max-width ~800px |
| `tin-tuc` | 1600px | Hero + thumbnail tin tuc |
| `san-pham` | 1600px | Modal zoom san pham |
| `doi-tac` | 600px | Logo doi tac render ~200px |
| `doanh-nghiep` | 1600px | Default; client override: logo → 600, cover → 1920 |
| `banner` | 2560px | Banner full-width desktop |
| (default) | 1600px | Folder chua khai bao preset |

Output van la WebP + `quality: "auto"` (khong doi). Anh nho hon cap khong bi upscale.

**Response:** `{ secure_url: "https://res.cloudinary.com/...", url: "..." }`

### GET /api/my-products
Lay danh sach SP cua VIP hien tai. Yeu cau: VIP.

**Response:** `{ products: [{ id, name, slug, certStatus, imageUrls }] }`

### POST /api/admin/settings
Luu cai dat he thong. Yeu cau: ADMIN.

**Body:** `{ "key1": "value1", "key2": "value2" }`

### GET /api/auth/verify-token?token=xxx&email=xxx
Kiem tra token kich hoat tai khoan.

**Response:** `{ valid: true | false }`

### POST /api/auth/set-password
Dat mat khau va kich hoat tai khoan. Dung cho ca 2 flow: kich hoat lan dau va reset mat khau.

**Body:** `{ "token": "xxx", "email": "xxx", "password": "xxx" }`

**Side effects:**
- User.passwordHash cap nhat (bcrypt cost 12)
- User.isActive = true
- VerificationToken bi xoa (1 lan dung)

### POST /api/contact
Form lien he cong khai tai `/lien-he`. **KHONG can auth.**

**Body:**
```json
{
  "name": "Nguyen Van A",
  "email": "a@example.com",
  "phone": "0901234567",
  "message": "Noi dung lien he..."
}
```

**Validation:**
- `name`, `email`, `message`: bat buoc
- `email`: phai dung format
- Gioi han do dai: name/email ≤ 200, message ≤ 5000
- HTML escape toan bo input truoc khi render vao email

**Process (DB-first — updated 2026-04):**
1. `prisma.contactMessage.create({...})` — luu DB voi `status = "NEW"` (source of truth)
2. Gui email qua Resend toi `CONTACT_INBOX_EMAIL` (mac dinh: `hoitramhuongvietnam2010@gmail.com`) — best-effort, failure khong throw
   - `reply-to` = email nguoi gui
   - Subject: `[Lien he website] {name}`
3. Email that bai → log + van tra ve `{ success: true }`. Admin van thay tin nhan o `/admin/lien-he` + notification bell.

**Response:** `{ success: true }` | `{ error: "..." }`

**Env vars:**
- `RESEND_API_KEY` (bat buoc)
- `CONTACT_INBOX_EMAIL` (tuy chon, mac dinh fallback)

### PATCH /api/admin/contact-messages/[id]
Cap nhat trang thai / ghi chu noi bo cho tin nhan lien he. Yeu cau: `ADMIN` (write).

**Body:**
```json
{
  "status": "HANDLED",
  "adminNote": "Da goi lai hom qua, khach xac nhan..."
}
```

**Validation:**
- `status`: `"NEW" | "HANDLED" | "ARCHIVED"` (bat buoc)
- `adminNote`: optional string

**Side effects:**
- `handledById = session.user.id` + `handledAt = now()` khi status != `NEW`
- Next GET `/api/admin/pending-counts` tu dong tru count `contact` → sidebar badge + chuong cap nhat trong 30s.

**Response:** `{ message: ContactMessage }`

### GET /api/admin/pending-counts
Tra ve so muc cho xu ly cua 8 workflow admin. Feed badge sidebar + notification bell.
Yeu cau: `isAdmin()` — **ADMIN + INFINITE** doc duoc (INFINITE chi doc, khong mutate).

**Response:**
```json
{
  "total": 12,
  "workflows": {
    "membershipApplication": { "count": 2, "recent": [ { "id", "title", "subtitle?", "href", "createdAt" } ] },
    "payment":               { "count": 3, "recent": [...] },
    "certification":         { "count": 1, "recent": [...] },
    "banner":                { "count": 0, "recent": [] },
    "report":                { "count": 1, "recent": [...] },
    "mediaOrder":            { "count": 2, "recent": [...] },
    "consultation":          { "count": 1, "recent": [...] },
    "contact":               { "count": 2, "recent": [...] }
  }
}
```

**Queries:** 8 `findMany` song song, filter theo `status` field cua moi bang (da index). Tra ve top 3 item cu nhat cho moi workflow (sorted `createdAt ASC`).

**Cache:** `no-store` — moi request chay query moi. Client poll 30s/lan + refetch khi tab gain focus.

**Headers:** `Cache-Control: no-store`

### POST /api/admin/ai/translate
Dich noi dung Viet sang EN / ZH / AR qua Gemini. Yeu cau: `ADMIN` (write).

**Body (shape moi):**
```json
{
  "targetLocale": "ar",
  "fields": {
    "title":   "Cong ty TNHH San pham XYZ",
    "excerpt": "Nha cung cap tram huong hang dau...",
    "content": "<p>Noi dung HTML...</p>"
  }
}
```

**Body (legacy shape — van hoat dong):**
```json
{
  "targetLocale": "en",
  "title": "...",
  "excerpt": "...",
  "content": "..."
}
```

**Validation:**
- `targetLocale`: `"en" | "zh" | "ar"`
- `fields`: max 20 field / request
- Total chars: max 120,000 / request
- Bat buoc co it nhat 1 field non-empty

**Process:**
- Build prompt preserving HTML tags + image URLs + link URLs + CSS classes — chi dich visible text
- Goi Gemini qua cascade (`lib/gemini-models.ts`): 3 tang fallback voi ban-state tracking + 24h lazy ListModels cache
- Auto-extract JSON tu response (toleance code fences / markdown)

**Response (shape moi):**
```json
{
  "fields": {
    "title":   "...translated...",
    "excerpt": "...translated...",
    "content": "...translated..."
  },
  "_modelUsed": "gemini-flash-latest",
  "_attempts": 1
}
```

Back-compat: neu client dung legacy shape (title/excerpt/content), response cung expose cung field o top level.

**Errors:**
- `403` — khong phai ADMIN
- `503` — `GEMINI_API_KEY` chua cau hinh
- `400` — validate fail (empty / qua dai / targetLocale sai)
- `429` — tat ca model Gemini het quota / banned. Response `{ quotaExceeded: boolean, attempts: [...] }`
- `502` — AI tra ve JSON khong parse duoc sau 3 lan retry

**Env vars:** `GEMINI_API_KEY` (bat buoc).

**Debug:** `GET /api/admin/ai/translate/status` tra ve trang thai cascade (model dang dung, ban state, cache age).

---

## Gallery Hero (CMS)

Quan ly anh nen cho toan bo trang cong khai. Model `HeroImage`. He thong pick deterministic 1 anh moi ngay (mui gio VN).

**Permission**:
- `GET` — `isAdmin(role)` (ADMIN + INFINITE).
- `POST` / `PATCH` / `DELETE` — `canAdminWrite(role)` (chi ADMIN; INFINITE 403).

**Side effect moi mutation**: goi `clearHeroCache()` (`revalidateTag("hero-images")`) + `revalidatePath("/", "layout")`.

### GET /api/admin/gallery
List toan bo anh, sort theo `sortOrder` ASC.

**Response:**
```json
{
  "items": [
    {
      "id": "clx...",
      "imageUrl": "https://res.cloudinary.com/.../gallery/04-2026/xxx.jpg",
      "label": "Rung tram Khanh Hoa",
      "sortOrder": 0,
      "isActive": true,
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z"
    }
  ]
}
```

### POST /api/admin/gallery
Tao anh moi.

**Body:**
```json
{
  "imageUrl": "https://res.cloudinary.com/.../gallery/04-2026/xxx.jpg",
  "label": "Rung tram Khanh Hoa",
  "sortOrder": 0,
  "isActive": true
}
```
- `imageUrl`: bat buoc (upload truoc qua `POST /api/upload` folder `gallery`).
- `label`, `sortOrder`, `isActive`: optional (default: `null`, `0`, `true`).

**Response:** `{ item: HeroImage }`

### PATCH /api/admin/gallery/[id]
Partial update. Body chi can field muon doi.

```json
{ "label": "Ten moi", "isActive": false }
```

**Response:** `{ item: HeroImage }` | `404` neu khong tim thay.

### DELETE /api/admin/gallery/[id]
Xoa cung anh. **Khong** xoa file tren Cloudinary (de admin phuc hoi neu can — Cloudinary co the quet thu cong sau).

**Response:** `{ success: true }` | `404`.

---

## Error Format

Tat ca error tra ve JSON:
```json
{
  "error": "Mo ta loi bang tieng Viet"
}
```

HTTP Status codes:
- `400` — Bad request / validation error
- `401` — Chua dang nhap
- `403` — Khong co quyen (wrong role)
- `404` — Khong tim thay
- `409` — Conflict (duplicate)
- `429` — Rate limit
- `500` — Server error
