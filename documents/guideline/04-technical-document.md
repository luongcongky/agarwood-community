# Tai lieu Ky thuat — Hoi Tram Huong Viet Nam

> Danh cho developer moi join hoac doi maintain he thong.
> Cap nhat: 04/2026 — Phase 1-6 + Dieu le integration + Van ban phap quy + TipTap v3 editor enhancements

---

## 1. Tong quan Cong nghe

| Thanh phan | Cong nghe | Phien ban |
|-----------|----------|----------|
| Framework | Next.js (App Router) | 16.2.2 |
| Runtime | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Database | PostgreSQL (Supabase) | — |
| ORM | Prisma (adapter-pg) | 7.6.0 |
| Auth | NextAuth v5 (JWT strategy) | 5.0.0-beta.30 |
| Styling | Tailwind CSS v4 | 4.x |
| Charts | Recharts | 3.8.1 |
| Rich Text | TipTap | 3.22.1 |
| Email | Resend | 6.10.0 |
| Image | Cloudinary | 2.9.0 |
| Validation | Zod | 4.3.6 |
| XSS Protection | isomorphic-dompurify | 3.7.1 |
| Unit Test | Vitest + Testing Library | 4.1.2 |
| E2E Test | Playwright | 1.59.1 |

---

## 2. Cau truc Codebase

```
agarwood-community/
├── app/                        # Next.js App Router
│   ├── (admin)/                # Layout admin (sidebar + mobile nav)
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx        # Dashboard tong quan
│   │       ├── hoi-vien/       # Quan ly hoi vien
│   │       ├── thanh-toan/     # Xac nhan CK
│   │       ├── chung-nhan/     # Xet duyet chung nhan
│   │       ├── tieu-bieu/      # [Phase 4] Pin top 20 SP + top 10 DN
│   │       ├── truyen-thong/   # CRM don truyen thong
│   │       ├── tin-tuc/        # Quan ly tin tuc
│   │       ├── bao-cao/        # Bao cao vi pham
│   │       └── cai-dat/        # Cai dat he thong
│   ├── (member)/               # Layout Hoi vien (navbar)
│   │   ├── layout.tsx
│   │   ├── tong-quan/          # Dashboard Hoi vien
│   │   ├── feed/               # Feed cong dong + tao bai
│   │   ├── ho-so/              # Ho so ca nhan (4 tab)
│   │   ├── gia-han/            # Gia han membership
│   │   ├── chung-nhan/         # Nop don + lich su chung nhan
│   │   ├── thanh-toan/         # Lich su thanh toan
│   │   ├── doanh-nghiep/       # Chinh sua DN
│   │   └── san-pham/           # Tao/sua san pham
│   ├── (auth)/                 # Auth pages (login, register, dat mat khau)
│   ├── (public)/               # Public pages
│   │   ├── page.tsx            # [Phase 3] Trang chu bao chi 6 section
│   │   ├── landing/            # [Phase 5] Landing page quyen loi Hoi vien
│   │   ├── san-pham-tieu-bieu/ # [Phase 4] Top 20 SP tieu bieu (admin pin)
│   │   ├── tin-tuc/            # Tin tuc Hoi
│   │   ├── san-pham-chung-nhan/# SP da chung nhan
│   │   ├── doanh-nghiep/[slug] # Trang DN
│   │   └── ... (gioi thieu, hoi vien, dich vu, dieu le, lien he)
│   └── api/                    # API Routes
│       ├── auth/               # NextAuth + verify-token + set-password + register
│       ├── posts/              # Feed CRUD + react + report + lock
│       │   └── quota/          # [Phase 2] GET quota thang user hien tai
│       ├── admin/              # Admin-only endpoints
│       │   ├── users/          # CRUD user + toggle + resend invite + reset password
│       │   ├── payments/       # Confirm + reject CK
│       │   ├── certifications/ # Approve + reject + refund
│       │   ├── products/[id]/featured/   # [Phase 4] PATCH pin SP tieu bieu
│       │   ├── companies/[id]/featured/  # [Phase 4] PATCH pin DN tieu bieu
│       │   ├── media-orders/   # Update status
│       │   ├── news/           # CRUD tin tuc
│       │   ├── reports/        # Xu ly bao cao
│       │   └── settings/       # Luu SiteConfig
│       ├── membership/         # Gia han
│       ├── certification/      # Nop don
│       ├── media-orders/       # Dat dich vu
│       ├── upload/             # Cloudinary upload
│       └── my-products/        # SP cua Hoi vien
├── components/
│   ├── features/
│   │   ├── layout/             # Navbar, Footer, AdminSidebar, UserMenu, SocialLinks (Phase 1)
│   │   └── homepage/           # [Phase 3] PostCard, MemberNewsRail, CertifiedProductsCarousel, HomepageBannerSlot
│   └── ui/                     # Shared UI (Avatar, Button, Sheet, etc.)
├── lib/
│   ├── auth.ts                 # NextAuth full config (Prisma adapter)
│   ├── auth.config.ts          # Edge-safe config (cho proxy/middleware)
│   ├── prisma.ts               # Prisma singleton + connection pool
│   ├── tier.ts                 # Tier helpers (Bac/Vang thresholds)
│   ├── quota.ts                # [Phase 2] Monthly post quota helper (5/15/30/-1)
│   ├── homepage.ts             # [Phase 3] Cached data fetchers + rotation logic
│   ├── utils.ts                # cn() utility
│   └── constants/
│       ├── banks.ts            # 21 ngan hang VN
│       └── agarwood.ts         # Danh muc SP, vung nguyen lieu, hang
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
├── proxy.ts                    # Middleware (route protection)
├── e2e/                        # Playwright E2E tests
├── __tests__/                  # Vitest unit tests
└── documents/                  # Tai lieu du an
```

---

## 3. ERD — Entity Relationship Diagram

```
User (1) ──── (0..1) Company ──── (*) Product ──── (*) Certification
  │              ↑ chi BUSINESS                           │
  ├──── (*) Membership                                    │
  ├──── (*) Payment ────────────────────────────── (0..1) ─┘
  ├──── (*) Post ──── (*) PostReaction
  │            └──── (*) Report
  │            └──── (*) PostTag ──── Tag
  ├──── (*) MediaOrder
  └──── (*) Account (NextAuth)

SiteConfig (key-value store doc lap)
VerificationToken (NextAuth)
Document (Google Drive)
```

### User.accountType
| Gia tri | Mo ta | Company | SP/CN |
|---------|-------|---------|-------|
| BUSINESS | Doanh nghiep | Bat buoc | Co |
| INDIVIDUAL | Ca nhan / Chuyen gia | Khong co | Khong |

### Models chinh:
| Model | Records du kien | Ghi chu |
|-------|----------------|---------|
| User | ~100 Hoi vien + 1 Admin | accountType + **memberCategory** (OFFICIAL/AFFILIATE/HONORARY) |
| Company | ~70-80 (chi BUSINESS Hoi vien) | 0..1 voi User, **representativeName/Position** (Dieu 7.2c) |
| Product | ~500 | ~5 SP/DN |
| Post | ~5000/nam | ~50 bai/thang |
| Payment | ~200/nam | Membership + cert fee |
| Certification | ~100/nam | |
| MediaOrder | ~50/nam | |
| News | ~100-200 (admin nhap + crawled) | **category** (GENERAL/RESEARCH), **sourceUrl**, **originalAuthor** |
| **MembershipApplication** | ~50-100 | Don ket nap (Dieu 11) — status + reviewer + reject reason |
| Document | ~20 legal + N tai lieu | **DIEU_LE/QUY_CHE/GIAY_PHEP** + issuer + sortOrder |
| SiteConfig | ~25 keys | Config he thong (them `join_fee_*`) |

### Enums moi (Dieu le integration):
```prisma
enum MemberCategory {
  OFFICIAL     // Hoi vien chinh thuc (day du quyen)
  AFFILIATE    // Lien ket (DN khong du tieu chuan hoac FDI)
  HONORARY     // Danh du (uy tin, dong gop)
}

enum ApplicationStatus {
  PENDING      // da nop, cho Ban Thuong vu xet
  APPROVED     // Chu tich ky quyet dinh cong nhan
  REJECTED     // bi tu choi
}

enum NewsCategory {
  GENERAL      // tin tuc — /tin-tuc
  RESEARCH     // nghien cuu khoa hoc — /nghien-cuu
}

// DocumentCategory: them 3 gia tri
enum DocumentCategory {
  CONG_VAN_DEN, CONG_VAN_DI, BIEN_BAN_HOP, QUYET_DINH, HOP_DONG,
  DIEU_LE      // Dieu le Hoi (public o /phap-ly tab 1)
  QUY_CHE      // Quy che noi bo (public o /phap-ly tab 2)
  GIAY_PHEP    // Giay phep dai hoi (public o /phap-ly tab 3)
}
```

### Migrations gan day (Phase Dieu le):
- `add_member_category_and_representative` — `MemberCategory` + `Company.representativeName/Position`
- `add_membership_application` — model mới cho don ket nap
- `add_news_category` — `News.category` (`NewsCategory` enum)
- `add_news_source_url` — `News.sourceUrl` (crawl reference)
- `add_news_original_author` — `News.originalAuthor`
- `add_legal_doc_categories` — `DocumentCategory` them 3 enum values + `Document.issuer` + `Document.sortOrder`

---

## 4. Authentication & Authorization

### JWT Strategy
- `lib/auth.config.ts`: Edge-safe config dung trong proxy.ts
- `lib/auth.ts`: Full config voi Prisma adapter + 2 providers
- JWT chua: userId, role, membershipExpires
- maxAge: 30 ngay

### Auth Providers
| Provider | Muc dich | Ghi chu |
|----------|---------|---------|
| Google OAuth | Dang nhap / Dang ky nhanh | Khong can nho mat khau, auto-link neu email trung |
| Credentials | Dang nhap bang email + mat khau | Flow truyen thong, dung cho invite email + reset password |

**Google OAuth flow (Phase 2 — bo flow cho duyet):**
1. User click "Dang nhap bang Google" → Google consent screen
2. Email da ton tai → auto-link Google account → login OK
3. Email moi → tao user GUEST voi `isActive: true` → email admin notification → redirect `/feed`
4. Legacy user (`isActive: false` + role GUEST tu pre-Phase 2) → auto-activate khi sign in → cho login

**Role semantics (Phase 2):**
- `GUEST` = Tai khoan co ban — dang ky xong dung duoc ngay, post duoc voi quota thap (5 bai/thang)
- `VIP` = Hoi vien dong phi — quota cao + uu tien hien thi trang chu
- `ADMIN` = ban quan tri — toan quyen + quota khong gioi han

**Env vars can thiet:**
```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```
> Tao tai Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs.
> Redirect URI: `https://[domain]/api/auth/callback/google`

### Route Protection (proxy.ts) — updated Phase 2 + Phase 5
```
MEMBER_PREFIXES (Hoi vien + ADMIN, han membership):
  /tong-quan, /company, /certification, /gia-han, /ho-so,
  /chung-nhan, /thanh-toan/lich-su, /doanh-nghiep/chinh-sua,
  /san-pham/tao-moi, /tai-lieu

LOGGED_IN_PREFIXES (bat ky user dang nhap, ke ca GUEST):
  /feed/tao-bai     # Phase 2: open posting cho moi user

ADMIN_PREFIXES (chi ADMIN):
  /dashboard, /members, /certifications, /media-orders, /admin

AUTH_PATHS (redirect neu da login):
  /login, /register, /dat-mat-khau, /dang-ky, /cho-duyet
```

### Logic:
- Khach (chua login) truy cap MEMBER route -> redirect /login?callbackUrl=...
- GUEST truy cap MEMBER route -> redirect **/landing** (Phase 5: gioi thieu nang cap Hoi vien)
- Guest/GUEST truy cap LOGGED_IN route -> can login truoc, sau do co the dung
- Hoi vien truy cap ADMIN route -> redirect /
- Hoi vien membership het han truy cap MEMBER route -> redirect /membership-expired
- Hoi vien/ADMIN da login truy cap /login -> redirect /admin hoac /tong-quan
- GUEST da login truy cap /login -> redirect /feed (khong con bi force /cho-duyet)

---

## 5. Database

### Connection
- PostgreSQL qua Supabase (production) hoac localhost (dev)
- Prisma adapter-pg voi connection pooling (max: 20)
- SSL chi bat khi production + non-localhost
- Singleton pattern trong lib/prisma.ts

### Migrations
```bash
npx prisma migrate dev          # Dev migration
npx prisma db seed              # Seed data
MIGRATE_TARGET=supabase npx prisma migrate deploy  # Production
```

### Indexes
- User: role, contributionTotal, displayPriority
- Post: authorPriority+createdAt, createdAt, status, isPremium, **category+createdAt**, **category+isPremium+authorPriority** (Phase 2)
- Payment: userId, type, status, payosOrderCode, createdAt
- Product: companyId, certStatus, slug, **isFeatured+featuredOrder** (Phase 2)
- Company: slug, isPublished, **isFeatured+featuredOrder** (Phase 2)
- Certification: productId, applicantId, status

### Schema changes Phase 2 (migration `phase2_post_category_featured_flags`)
```prisma
enum PostCategory {
  GENERAL   // bai feed thuong (default)
  NEWS      // tin tuc doanh nghiep — section 5 trang chu
  PRODUCT   // tin san pham — section 6 trang chu
}

model Post {
  category PostCategory @default(GENERAL)
  // ... existing fields
}

model Company {
  isFeatured    Boolean @default(false)  // admin pin top 10 DN
  featuredOrder Int?                     // null = chua pin
  // ...
}

model Product {
  isFeatured    Boolean @default(false)  // admin pin top 20 SP
  featuredOrder Int?
  // ...
}
```

### Quota system (lib/quota.ts) — Phase 2
| Role | Default quota/thang | SiteConfig key |
|------|---------------------|----------------|
| Tai khoan co ban | 5 | `quota_guest_monthly` |
| Hoi vien ★ | 15 | `quota_vip_1_monthly` |
| Hoi vien ★★ Bac | 30 | `quota_vip_2_monthly` |
| Hoi vien ★★★ Vang | -1 (unlimited) | `quota_vip_3_monthly` |
| ADMIN | -1 (hardcoded) | — |

- Cache 60s, fallback defaults neu config keys khong ton tai
- Check khi POST /api/posts; bo dem bai DELETED de tranh gian lan

---

## 6. Caching Strategy

| Nhom trang | revalidate | Ly do |
|-----------|-----------|-------|
| Admin tat ca | 0 (realtime) | Can data moi nhat |
| Admin dashboard | 60s | Alert refresh 1 phut |
| Hoi vien realtime | 0 | Feed, profile, thanh toan |
| **Trang chu (Phase 3)** | **300s** | Newspaper layout, rotating slots refresh 5 min |
| **/landing (Phase 5)** | **600s** | Marketing page, doi data 10 phut |
| **/san-pham-tieu-bieu (Phase 4)** | **600s** | Pin list it thay doi |
| Public listing | 3600s (1h) | Tin tuc, SP, DN |
| Public detail | 1800-3600s | Chi tiet tin, SP, DN |

### Phase 3 — Trang chu Newspaper Layout
6 section, query chia trong `lib/homepage.ts` voi `unstable_cache`:

| Section | Data fetcher | Cache | Filter chinh |
|---------|-------------|-------|-------------|
| 1. Tin tuc Hoi | `getAssociationNews` | 300s | News.isPublished, sort isPinned + publishedAt |
| 2. Ban tin hoi vien (right rail) | `getTopVipMemberPosts` (3 top) + `getRotatingMemberPosts` (5 rotating) | 300s | isPremium=true (top), bao gom Tai khoan co ban (rotate) |
| 3. SP tieu bieu (carousel) | `getFeaturedProductsForHomepage` | 600s | isFeatured=true + owner.role=VIP (Hoi vien) |
| 4. Banner quang cao | placeholder | — | Phase 6: Banner model |
| 5. Tin DN moi nhat | `getLatestPostsByCategory("NEWS")` | 300s | isPremium=true, category=NEWS |
| 6. Tin SP moi nhat | `getLatestPostsByCategory("PRODUCT")` | 300s | isPremium=true, category=PRODUCT |

**Rotating slots algorithm** (right rail):
- Pool 50 bai, exclude top Hoi vien da hien thi
- Weighted random: `score = (authorPriority + 1) * (0.5 + rng())`
- Seed = `Math.floor(Date.now() / 300_000)` (5-min bucket) → deterministic trong 5 phut
- Mulberry32 PRNG inline (~8 dong code)

**Cache invalidation tags**: `homepage`, `news`, `posts`, `products`, `companies`
- Admin pin/unpin → `revalidateTag("homepage", "max")` + tag tuong ung
- Next 16 yeu cau profile arg thu 2 — dung `"max"` cho stale-while-revalidate dai nhat

---

## 7. Email (Resend)

### Cac email tu dong:
| Trigger | Nguoi nhan | Subject |
|---------|-----------|---------|
| Admin tao Hoi vien (invite) | Hoi vien | Chao mung gia nhap |
| Admin resend invite | Hoi vien | Kich hoat tai khoan |
| Admin reset password | Hoi vien | Dat lai mat khau |
| User dang ky qua Google | Admin | [Dang ky moi qua Google] Ten |
| Hoi vien xac nhan CK membership | Admin | [Hoi TH] Ten vua CK Xd |
| Admin confirm payment | Hoi vien | Membership da kich hoat |
| Admin reject payment | Hoi vien | CK bi tu choi + ly do |
| Hoi vien nop don chung nhan | Admin | Ten nop don CN SP |
| Admin duyet chung nhan | Hoi vien | Chuc mung + ma CN |
| Admin tu choi chung nhan | Hoi vien | Ly do tu choi |
| Khach dat dich vu TT | Khach + Admin | Xac nhan don + thong bao |
| Admin doi status media order | Khach | Theo tung status |

### Config:
```
RESEND_API_KEY=re_xxx (trong .env.local)
From: "Hoi Tram Huong Viet Nam <noreply@hoitramhuong.vn>"
```

---

## 8. File Upload (Cloudinary)

- Endpoint: POST /api/upload
- Auth: required (khong cho GUEST)
- MIME: chi image/*
- Max size: 5MB
- Folder: agarwood/posts
- Response: { secure_url }

### Config:
```
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

## 9. Testing

### Unit Tests (Vitest)
```bash
npm test              # Chay 1 lan
npm run test:watch    # Watch mode
```
- 16 test cases (login page)
- Config: vitest.config.ts (jsdom, react plugin)

### E2E Tests (Playwright)
```bash
npm run test:e2e      # Chay tat ca tests
```
- 8 file test: auth, Hoi vien pages, admin pages, public pages, performance, mobile responsive
- Config: playwright.config.ts (chromium, auto start dev server)
- Video recording: bat (`video: "on"`), output: `e2e/test-results/`
- Viewport: 1280x720

### Demo Flow Tests (Playwright — Video Recording)

2 test suite chay tuan tu (serial), seed data moi tu dau, ghi video tung buoc.
Dung de **demo san pham** va **luu tru huong dan su dung**.

```bash
# Hoi vien flow (16 test cases)
npx playwright test e2e/vip-demo-flow.spec.ts --headed

# Admin flow (12 test cases)
npx playwright test e2e/admin-demo-flow.spec.ts --headed

# Ca 2
npx playwright test e2e/vip-demo-flow.spec.ts e2e/admin-demo-flow.spec.ts --headed
```

**Hoi vien Demo Flow** (`e2e/vip-demo-flow.spec.ts` — 16 steps):
| Step | Noi dung |
|------|---------|
| 00 | Seed du lieu demo moi |
| 01 | Hoi vien dang nhap |
| 02 | Xem Dashboard tong quan |
| 03 | Cap nhat ho so ca nhan (4 tab) |
| 04 | Quan ly profile doanh nghiep |
| 05 | Tao san pham moi |
| 06 | Doc Feed cong dong |
| 07 | Dang bai viet len Feed |
| 08 | Nop don chung nhan SP (3 buoc) |
| 09 | Gia han membership (chon phi, CK, ghi chu) |
| 10 | Xem lich su thanh toan |
| 11 | Xem lich su chung nhan |
| 12 | Admin xac nhan chuyen khoan |
| 13 | Admin xet duyet chung nhan |
| 14 | Admin quan ly hoi vien |
| 15 | Admin Dashboard tong quan |

**Admin Demo Flow** (`e2e/admin-demo-flow.spec.ts` — 12 steps):
| Step | Noi dung |
|------|---------|
| 00 | Seed du lieu demo moi |
| 01 | Admin dang nhap |
| 02 | Dashboard — KPI, alerts, bieu do |
| 03 | Xac nhan chuyen khoan (confirm/reject) |
| 04 | Xet duyet chung nhan SP (review 2 cot) |
| 05 | Quan ly hoi vien (tabs, search, chi tiet) |
| 06 | Tao hoi vien moi |
| 07 | Quan ly tin tuc |
| 08 | Xu ly bao cao vi pham (khoa bai, bo qua) |
| 09 | Quan ly don truyen thong (CRM) |
| 10 | Cai dat he thong (phi, ngan hang, hang) |
| 11 | Tong ket — Dashboard sau khi xu ly |

**Luu y:**
- Can start dev server truoc (`npm run dev`)
- Video output: `e2e/test-results/` (file `.webm`)
- Tai khoan demo: `admin@hoitramhuong.vn` / `trankhanh@tramhuongkhanhhoa.vn` / `Demo@123`

---

## 10. Deploy

### Environment Variables can thiet:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://... (cho migrations)
AUTH_SECRET=xxx (>32 chars)
NEXTAUTH_URL=https://[domain]
RESEND_API_KEY=re_xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CRON_SECRET=xxx (>32 chars, for Phase 6 banner-expire cron)

# Google Drive OAuth — for /admin/cai-dat PDF upload
# Reuse GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET của NextAuth,
# hoặc tạo riêng GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET
GOOGLE_DRIVE_REFRESH_TOKEN=1//xxx  (lấy 1 lần qua OAuth Playground, xem guide)
GOOGLE_DRIVE_ROOT_FOLDER_ID=xxx    (folder ID trên My Drive của user OAuth)
```

### Google Drive Setup (OAuth delegation)

**Vì sao OAuth thay vì Service Account?** Google disabled service account storage
quota từ 04/2024. Service account không thể upload vào "My Drive" nữa, bắt buộc
phải dùng Shared Drive (Workspace paid) hoặc OAuth delegation (Gmail cá nhân được).

**Setup 1 lần — lấy refresh token qua OAuth Playground:**

1. Đảm bảo OAuth client trong Google Cloud Console đã add redirect URI:
   `https://developers.google.com/oauthplayground`
   (Cloud Console → APIs & Services → Credentials → Edit OAuth 2.0 Client ID → Add URI)

2. Mở https://developers.google.com/oauthplayground

3. Click icon ⚙ (góc trên phải) → check **"Use your own OAuth credentials"**
   - Paste `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` từ .env.local
   - Close gear menu

4. Panel trái "Select & authorize APIs":
   - Scroll tìm **"Drive API v3"**
   - Check scope: `https://www.googleapis.com/auth/drive`
   - Click **Authorize APIs** (nút xanh)

5. Google consent screen hiện ra:
   - Chọn account sẽ upload file (vd: hoitramhuongvietnam2010@gmail.com)
   - Click "Advanced" nếu cảnh báo → "Go to [app] (unsafe)" → Allow

6. Quay lại Playground, bước 2 "Exchange authorization code for tokens":
   - Click **Exchange authorization code for tokens**
   - Response hiện bên phải có `refresh_token` — **copy giá trị này**

7. Paste vào `.env.local`:
   ```
   GOOGLE_DRIVE_REFRESH_TOKEN=1//0xxxxxxxxxxxxxxxxxxxx
   ```

8. Lấy `GOOGLE_DRIVE_ROOT_FOLDER_ID`:
   - Vào drive.google.com với account vừa OAuth
   - Tạo folder mới (vd "Hội Trầm Hương — Tài liệu")
   - Mở folder → URL có dạng `https://drive.google.com/drive/folders/1AbC...`
   - Copy phần ID sau `/folders/`
   - Paste vào `.env.local`: `GOOGLE_DRIVE_ROOT_FOLDER_ID=1AbC...`

9. Restart dev server (`Ctrl+C` → `npm run dev`) để load env mới.

10. Test upload: `/admin/cai-dat` → section "Điều lệ Hội" → upload PDF.

**Nếu refresh token expire sau 7 ngày** (OAuth app đang ở trạng thái Testing):
- Cloud Console → APIs & Services → OAuth consent screen → **Publishing status**
- Click **PUBLISH APP** (status "In production" — refresh token không expire nữa)
- Hoặc add account đang dùng làm **Test user** để giữ 7 ngày

### Cron Jobs (Phase 6)
Dinh nghia trong `vercel.json`:
- `/api/cron/banner-expire` — chay 0h hang ngay (UTC)
  - Expire banner ACTIVE co `endDate < now` → set `EXPIRED`
  - Gui email warning cho banner sap het han (< 7 ngay)

**Auth**: Vercel Cron tu dong gui header `Authorization: Bearer ${CRON_SECRET}`.
Endpoint check header va tra 401 neu sai.

**Test manual**:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/banner-expire
```

**Alternative scheduler** (ngoai Vercel): cai `cronjob.org`, `crontab-guru` external,
hoac Windows Task Scheduler goi curl theo lich.

### Build & Start:
```bash
npm run build         # Production build
npm start             # Start production server
```

### Deploy Vercel:
1. Connect GitHub repo
2. Set environment variables
3. Build command: `npm run build`
4. Output: `.next`
5. Prisma: Add build script `prisma generate` truoc `next build`

### Deploy self-hosted:
1. Clone repo + npm install
2. Set .env.local
3. npx prisma migrate deploy
4. npm run build && npm start
5. Reverse proxy (nginx) tro ve port 3000

---

## 10.5 Navbar mode detection (pathname-based)

**Van de**: Truoc day Navbar chon menu theo `session.user.role` — Hoi vien on public
pages van thay menu member. User muon public menu cho *moi user* tru khi vao
area quan tri.

**Giai phap**: Navbar chon menu theo **pathname**, khong theo role.

**Luong**:
1. `proxy.ts` set header `x-pathname` vao moi response qua helper `passThrough()`
2. `Navbar` (server component) doc qua `headers()` API
3. `detectMode(pathname)`:
   - `/admin/*` → `admin` mode (nhung admin layout dung sidebar, khong render Navbar)
   - `/tong-quan`, `/gia-han`, `/ho-so`, `/chung-nhan`, `/doanh-nghiep-cua-toi`, `/thanh-toan`, `/ket-nap`, `/tai-lieu` → `member` mode
   - Moi pathname khac → `public` mode (bao gom `/feed`, `/tin-tuc`, `/nghien-cuu`, `/san-pham-doanh-nghiep`...)
4. `Navbar` render `PUBLIC_LINKS` / `BUSINESS_LINKS` / `INDIVIDUAL_LINKS` theo mode + accountType
5. `UserMenu` dropdown them item mode-based:
   - Public mode + Hoi vien → "Vao khu vuc quan tri" → `/tong-quan`
   - Public mode + ADMIN → "Vao trang quan tri" → `/admin`
   - Member/admin mode → "Ve trang cong khai" → `/`

**Admin sidebar** van co link "Ve trang cong khai" o cuoi nav (sau Dang xuat)
voi styling accent nen de phat hien.

---

## 10.6 TipTap v3 editor (/admin/tin-tuc/[id])

### Editor config
```tsx
useEditor({
  extensions: [
    StarterKit,
    ResizableImage.configure({ inline: false, HTMLAttributes: { class: "editor-image" } }),
    TextAlign.configure({ types: ["heading", "paragraph", "image"], alignments: ["left","center","right","justify"] }),
  ],
  immediatelyRender: true,           // Client-only component — tranh SSR hydration race voi NodeView
  shouldRerenderOnTransaction: false, // Tranh flushSync-in-lifecycle voi React 19
})
```

### ResizableImage extension — Custom NodeView

File: `app/(admin)/admin/tin-tuc/[id]/ResizableImageView.tsx`

Wrapper 2-layer:
- **Outer**: `block w-full` + `style.textAlign` tu `node.attrs.textAlign` → quyet dinh vi tri ngang
- **Inner**: `relative inline-block` → container cho img + drag handles

3 drag handles (absolute positioned):
- **E** (phai-giua): drag ngang → resize width
- **S** (duoi-giua): drag doc → resize height
- **SE** (goc duoi-phai): drag → resize ca 2, giu aspect ratio

Pattern: mousemove update `lastSizeRef` + inline style; mouseup commit qua `updateAttributes` wrapped trong `queueMicrotask` (tranh flushSync).

### React 19 + TipTap 3 — flushSync fix

**Van de**: TipTap's `ReactNodeViewRenderer` dung `flushSync` noi bo khi NodeView update. React 19 strict hon, throw khi flushSync call trong lifecycle/render.

**3 fix layer**:
1. `shouldRerenderOnTransaction: false` + `useEditorState` hook cho toolbar state (useSyncExternalStore — safe pattern)
2. `immediatelyRender: true` tranh race voi NodeView mount
3. `queueMicrotask` wrap moi `editor.chain().updateAttributes()` call trong event handlers

### Sticky toolbar
- Container `.rounded-xl border bg-white shadow-sm` (khong overflow-hidden)
- Toolbar div: `sticky top-0 z-20 rounded-t-xl bg-brand-50/95 backdrop-blur`
- Phai fix admin layout `h-screen overflow-hidden` de `<main overflow-auto>` thuc su co scroll → sticky track main thay vi window

### CSS override
```ts
// Ghi de prose plugin's img max-width
className="... max-w-none!"
// Tailwind v4 important modifier: "class!" (khong phai "!class")
```

---

## 11. Conventions & Patterns

### File naming
- Pages: `app/(group)/route/page.tsx` (server component)
- Client components: PascalCase (vd: `FeedClient.tsx`, `CompanyTabs.tsx`)
- Server actions: `_actions.ts` trong cung thu muc voi page
- API routes: `app/api/[domain]/route.ts`

### Data flow
- Server Component fetch data voi Prisma
- Serialize dates thanh ISO string truoc khi truyen cho client
- Client component nhan props, quan ly state voi useState
- Mutations: Server Actions (Zod validation) hoac API routes

### Security
- HTML content: DOMPurify.sanitize() truoc khi luu va truoc khi render
- Auth: Kiem tra session + role o moi API route va Server Action
- Input: Zod validation cho Server Actions, manual validation cho API routes
- Slug: Regex /^[a-z0-9-]+$/
- Password: bcryptjs cost 12

---

## 12. Import/Migration scripts

Thu muc `scripts/` chua cac one-shot scripts cho migration data tu website cu
`hoitramhuongvietnam.org`. Tat ca dung chung pattern load `.env.local` → use
Prisma client → TLS workaround cho legacy site.

### Partners (9 DN)
- `scripts/seed-partners.ts` — tao 9 Hoi vien doi tac thuc te voi Hoi vien Bac
- Logo upload Cloudinary folder `agarwood-community/members/`
- Idempotent: check Cloudinary resource trước upload
- `scripts/fix-cloudinary-double-prefix.ts` — migration fix URL co double prefix

### Van ban phap quy (8 PDF legal docs)
- `scripts/import-legal-documents.ts` — download 8 PDF tu trang cu + upload Google Drive
- Tao records Document voi category DIEU_LE/QUY_CHE
- `CATEGORY_FOLDERS` map category → Drive folder (VBPQ - *)

### News content (Research + General)
- `scripts/import-research-articles.ts` — metadata 7 bai nghien cuu (step 1)
- `scripts/import-news-articles.ts` — metadata 48 bai tin tuc tu JSON
- `scripts/crawl-research-content.ts` — step 2: crawl full HTML + image migration
  - Cho phep `--category=GENERAL|RESEARCH` flag
  - `--force` re-crawl all, `--slug=xxx` crawl 1 bai
  - DOM parse voi `jsdom` + `.single-post` selector (template chung cua trang cu)
  - Image pipeline: download → upload Cloudinary folder `agarwood-community/research/{slug}/` → rewrite src
  - Semantic clean via DOMPurify voi `ALLOWED_TAGS` whitelist
  - Empty detection: text < 100 ky tu va khong co ảnh → giữ placeholder

### Common patterns
- Load env manually (tsx khong auto-load .env.local):
  ```ts
  function loadEnvLocal() { /* parse .env.local + set process.env */ }
  loadEnvLocal()
  // Sau do dynamic-require prisma + cloudinary
  ```
- TLS workaround: `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"` (legacy site cert)
- Idempotency: check DB slug/public_id truoc khi tao/upload

---

## 13. AgarwoodPlaceholder component

File: `components/ui/AgarwoodPlaceholder.tsx`

Component chung cho **tat ca fallback** (thieu avatar, thieu logo, thieu ảnh san pham, thieu cover tin tuc...). Icon mac dinh: **🌿** (la tram).

**Props**:
- `size`: xs | sm | md | lg | xl
- `shape`: square | rounded | full
- `tone`: brand | light | dark
- `className`: custom (thuong `w-X h-Y`)

**Vi du**:
```tsx
// Logo fallback trong /hoi-vien card
<AgarwoodPlaceholder className="w-16 h-16" shape="full" size="sm" />

// Thumbnail san pham khi khong co anh
<AgarwoodPlaceholder className="w-full h-full" size="lg" shape="square" />

// Cover tin tuc hero
<AgarwoodPlaceholder className="h-full w-full" size="xl" shape="square" tone="dark" />
```

Da thay cho 11 location fallback (hoi-vien, page home, san-pham-doanh-nghiep, tin-tuc, nghien-cuu, san-pham-chung-nhan, san-pham/[slug], doanh-nghiep/[slug], CertifiedProductsCarousel, PostCard, v.v.).
