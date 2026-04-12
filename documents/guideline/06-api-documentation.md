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

### Roles (cap nhat Phase 2)
| Role | Quyen |
|------|------|
| GUEST | Free tier — dang ky xong dung ngay, post 5 bai/thang |
| VIP | Hoi vien dong phi — quota cao + uu tien hien thi trang chu |
| ADMIN | Toan quyen, quota khong gioi han |

> **Phase 2 breaking change**: Bo flow "GUEST cho duyet". User dang ky xong la `isActive: true` ngay,
> co the dang nhap va post bai. VIP la nang cap thuong (qua membership fee), khong phai gate.

---

## 1. Posts (Feed)

### GET /api/posts
Lay danh sach bai viet (cursor pagination).

**Query params:**
| Param | Type | Mo ta |
|-------|------|-------|
| cursor | string | ID bai viet cuoi cung (optional, trang dau khong can) |

**Response:** `{ posts: Post[] }`

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
Tao bai viet moi. **Phase 2: cho phep moi user dang nhap (GUEST/VIP/ADMIN), khong gioi han 3 bai/ngay nua.**

**Body:**
```json
{
  "title": "Tieu de (optional)",
  "content": "<p>Noi dung HTML, toi thieu 50 ky tu</p>",
  "category": "GENERAL"
}
```

`category` (optional, default `GENERAL`):
- `GENERAL` — bai feed thuong
- `NEWS` — tin tuc doanh nghiep (co the len section 5 trang chu neu user la VIP)
- `PRODUCT` — tin san pham (co the len section 6 trang chu neu user la VIP)

**Response:** `201 { post: Post }`

**Errors:**
- `401` — Chua dang nhap
- `400` — Noi dung qua ngan (< 50 ky tu)
- `429` — Het quota thang nay (vi du: GUEST 5 bai/thang). Response body co `quota: { used, limit, remaining, resetAt }`

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

### POST /api/admin/users/{id}/reset-password
Dat lai mat khau hoi vien. Yeu cau: ADMIN. Khong ap dung cho tai khoan ADMIN.

**Process:**
1. Xoa token cu cua email hoi vien
2. Tao token moi (48h)
3. Gui email voi link `/dat-mat-khau?token=...&email=...`

**Response:** `{ success: true }`

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
Them field `category` cho body:

```json
{
  "category": "GENERAL"  // hoac "RESEARCH"
}
```

`GENERAL` → hien thi `/tin-tuc`. `RESEARCH` → hien thi `/nghien-cuu`.

---

## 9. Other

### POST /api/upload
Upload anh len Cloudinary. Yeu cau: VIP hoac ADMIN.

**Body:** FormData voi field `file` (image/*, max 5MB)

**Response:** `{ secure_url: "https://res.cloudinary.com/..." }`

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
