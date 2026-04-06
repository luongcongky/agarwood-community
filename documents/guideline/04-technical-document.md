# Tai lieu Ky thuat — Hoi Tram Huong Viet Nam

> Danh cho developer moi join hoac doi maintain he thong.
> Cap nhat: 04/2026

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
│   │       ├── truyen-thong/   # CRM don truyen thong
│   │       ├── tin-tuc/        # Quan ly tin tuc
│   │       ├── bao-cao/        # Bao cao vi pham
│   │       └── cai-dat/        # Cai dat he thong
│   ├── (member)/               # Layout VIP (navbar)
│   │   ├── layout.tsx
│   │   ├── tong-quan/          # Dashboard VIP
│   │   ├── feed/               # Feed cong dong + tao bai
│   │   ├── ho-so/              # Ho so ca nhan (4 tab)
│   │   ├── gia-han/            # Gia han membership
│   │   ├── chung-nhan/         # Nop don + lich su chung nhan
│   │   ├── thanh-toan/         # Lich su thanh toan
│   │   ├── doanh-nghiep/       # Chinh sua DN
│   │   └── san-pham/           # Tao/sua san pham
│   ├── (auth)/                 # Auth pages (login, register, dat mat khau)
│   ├── (public)/               # Public pages (trang chu, tin tuc, SP, DN, dich vu)
│   └── api/                    # API Routes
│       ├── auth/               # NextAuth + verify-token + set-password
│       ├── posts/              # Feed CRUD + react + report + lock
│       ├── admin/              # Admin-only endpoints
│       │   ├── users/          # CRUD user + toggle + resend invite
│       │   ├── payments/       # Confirm + reject CK
│       │   ├── certifications/ # Approve + reject + refund
│       │   ├── media-orders/   # Update status
│       │   ├── news/           # CRUD tin tuc
│       │   ├── reports/        # Xu ly bao cao
│       │   └── settings/       # Luu SiteConfig
│       ├── membership/         # Gia han
│       ├── certification/      # Nop don
│       ├── media-orders/       # Dat dich vu
│       ├── upload/             # Cloudinary upload
│       └── my-products/        # SP cua VIP
├── components/
│   ├── features/layout/        # Navbar, Footer, AdminSidebar, UserMenu
│   └── ui/                     # Shared UI (Avatar, Button, Sheet, etc.)
├── lib/
│   ├── auth.ts                 # NextAuth full config (Prisma adapter)
│   ├── auth.config.ts          # Edge-safe config (cho proxy/middleware)
│   ├── prisma.ts               # Prisma singleton + connection pool
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
User (1) ──── (1) Company ──── (*) Product ──── (*) Certification
  │                                                       │
  ├──── (*) Membership                                    │
  ├──── (*) Payment ────────────────────────────── (0..1) ─┘
  ├──── (*) Post ──── (*) PostReaction
  │            └──── (*) Report
  │            └──── (*) PostTag ──── Tag
  ├──── (*) MediaOrder
  └──── (*) Account (NextAuth)

SiteConfig (key-value store doc lap)
VerificationToken (NextAuth)
```

### Models chinh:
| Model | Records du kien | Ghi chu |
|-------|----------------|---------|
| User | ~100 VIP + 1 Admin | Gioi han boi max_vip_accounts |
| Company | ~100 (1:1 voi VIP) | |
| Product | ~500 | ~5 SP/DN |
| Post | ~5000/nam | ~50 bai/thang |
| Payment | ~200/nam | Membership + cert fee |
| Certification | ~100/nam | |
| MediaOrder | ~50/nam | |
| News | ~100/nam | |
| SiteConfig | ~20 keys | Config he thong |

---

## 4. Authentication & Authorization

### JWT Strategy
- `lib/auth.config.ts`: Edge-safe config dung trong proxy.ts
- `lib/auth.ts`: Full config voi Prisma adapter + credentials provider
- JWT chua: userId, role, membershipExpires
- maxAge: 30 ngay

### Route Protection (proxy.ts)
```
MEMBER_PREFIXES (VIP + ADMIN):
  /tong-quan, /feed/tao-bai, /company, /certification,
  /gia-han, /ho-so, /chung-nhan, /thanh-toan/lich-su,
  /doanh-nghiep/chinh-sua, /san-pham/tao-moi

ADMIN_PREFIXES (chi ADMIN):
  /dashboard, /members, /certifications, /media-orders, /admin

AUTH_PATHS (redirect neu da login):
  /login, /register, /dat-mat-khau
```

### Logic:
- Guest truy cap MEMBER route -> redirect /login
- VIP truy cap ADMIN route -> redirect /
- VIP membership het han truy cap MEMBER route -> redirect /membership-expired
- Da login truy cap /login -> redirect /admin hoac /tong-quan

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
- Post: authorPriority+createdAt (composite), createdAt, status, isPremium
- Payment: userId, type, status, payosOrderCode, createdAt
- Product: companyId, certStatus, slug
- Certification: productId, applicantId, status

---

## 6. Caching Strategy

| Nhom trang | revalidate | Ly do |
|-----------|-----------|-------|
| Admin tat ca | 0 (realtime) | Can data moi nhat |
| Admin dashboard | 60s | Alert refresh 1 phut |
| VIP realtime | 0 | Feed, profile, thanh toan |
| Public listing | 3600s (1h) | Trang chu, tin tuc, SP |
| Public detail | 1800-3600s | Chi tiet tin, SP, DN |

---

## 7. Email (Resend)

### Cac email tu dong:
| Trigger | Nguoi nhan | Subject |
|---------|-----------|---------|
| Admin tao VIP (invite) | VIP | Chao mung gia nhap |
| Admin resend invite | VIP | Kich hoat tai khoan |
| VIP xac nhan CK membership | Admin | [Hoi TH] Ten vua CK Xd |
| Admin confirm payment | VIP | Membership da kich hoat |
| Admin reject payment | VIP | CK bi tu choi + ly do |
| VIP nop don chung nhan | Admin | Ten nop don CN SP |
| Admin duyet chung nhan | VIP | Chuc mung + ma CN |
| Admin tu choi chung nhan | VIP | Ly do tu choi |
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
npm run test:e2e      # Chay tat ca 47 tests
```
- 5 file test: auth, VIP pages, admin pages, public pages, performance
- Config: playwright.config.ts (chromium, auto start dev server)

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
```

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
