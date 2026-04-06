# API Documentation — Hoi Tram Huong Viet Nam

> Reference cho mobile app hoac tich hop ben thu 3 trong tuong lai.
> Base URL: `https://[domain]`
> Auth: JWT token trong cookie `next-auth.session-token`

---

## Authentication

Tat ca API yeu cau auth su dung NextAuth session cookie. Gui cookie trong moi request.

### Roles
| Role | Quyen |
|------|------|
| GUEST | Chi doc (han che) |
| VIP | Doc + ghi (bai viet, san pham, chung nhan) |
| ADMIN | Toan quyen |

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
Tao bai viet moi. Yeu cau: VIP hoac ADMIN.

**Body:**
```json
{
  "title": "Tieu de (optional)",
  "content": "<p>Noi dung HTML, toi thieu 50 ky tu</p>"
}
```

**Response:** `201 { post: Post }`

**Errors:**
- `401` — Chua dang nhap
- `400` — Noi dung qua ngan
- `429` — Da dang 3 bai hom nay

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

### POST /api/admin/users
Tao VIP moi. Yeu cau: ADMIN.

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
- Co `password`: tai khoan active ngay
- Co `sendInvite: true` (khong co password): gui email moi, tai khoan inactive

**Errors:** `409` — Email da ton tai

### POST /api/admin/users/{id}/toggle-active
Bat / tat tai khoan VIP. Yeu cau: ADMIN.

### POST /api/admin/users/{id}/resend-invite
Gui lai email moi (tao token moi 48h). Yeu cau: ADMIN.

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

## 6. Other

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
Dat mat khau va kich hoat tai khoan.

**Body:** `{ "token": "xxx", "email": "xxx", "password": "xxx" }`

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
