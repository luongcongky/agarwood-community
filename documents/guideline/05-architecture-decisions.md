# Architecture Decision Records (ADR)
## Hoi Tram Huong Viet Nam

> Tai lieu giai thich TAI SAO chon cac giai phap ky thuat hien tai.
> Danh cho developer maintain he thong ve sau.

---

## ADR-001: Chon Next.js App Router

### Boi canh
Can 1 framework co the render server-side (SEO cho trang san pham, tin tuc) dong thoi co client interactivity (feed, editor, form).

### Quyet dinh
Chon Next.js 16 voi App Router (khong Pages Router).

### Ly do
- **Server Components**: Giam JS gui ve client, tang toc do load. Phan lon trang admin va public la server component.
- **Route Groups**: `(admin)`, `(member)`, `(public)`, `(auth)` — moi nhom co layout rieng ma khong anh huong URL.
- **Server Actions**: Goi DB truc tiep tu component, khong can tao API route rieng (dung cho ho so, san pham, doanh nghiep).
- **ISR (revalidate)**: Trang tinh cache 1 gio, trang dong realtime — cau hinh bang 1 dong `export const revalidate`.
- **Proxy/Middleware**: Route protection chay o Edge, khong can server rieng.

### Rui ro
- NextAuth v5 con beta — co the co breaking changes
- App Router co nhieu subtleties (params la Promise, Suspense boundary cho useSearchParams)
- Tailwind v4 co thay doi class names (bg-gradient-to-br -> bg-linear-to-br)

### Giai phap rui ro
- Lock phien ban trong package.json
- Doc docs tai `node_modules/next/dist/docs/` truoc khi code (ghi trong AGENTS.md)

---

## ADR-002: Chon PostgreSQL (Supabase) voi Prisma

### Boi canh
Can database relational cho du lieu co quan he phuc tap (User -> Company -> Product -> Certification).

### Quyet dinh
PostgreSQL hosted tren Supabase, truy cap qua Prisma ORM voi adapter-pg.

### Ly do
- **Supabase**: Free tier du cho 100 VIP users, co connection pooling (PgBouncer), backup tu dong.
- **Prisma**: Type-safe queries, migration tool, schema-first design. Developer experience tot nhat cho TypeScript.
- **adapter-pg**: Ket noi truc tiep PostgreSQL, khong can Prisma Accelerate.
- **Khong dung Supabase client**: Tranh vendor lock-in, co the doi sang PostgreSQL bat ky luc nao.

### Trade-offs
- Khong dung Supabase Realtime (chua can cho 100 users)
- Khong dung Supabase Auth (dung NextAuth de kiem soat toan bo auth flow)
- Khong dung Row Level Security (bao mat o application layer qua API routes)

---

## ADR-003: JWT Strategy cho Authentication

### Boi canh
Can auth strategy hoat dong o ca Edge Runtime (middleware/proxy) va Node.js Runtime (API routes).

### Quyet dinh
Dung NextAuth v5 voi JWT strategy (khong dung database sessions).

### Ly do
- **Edge-safe**: proxy.ts chay o Edge Runtime, khong the query DB. JWT chua role + membershipExpires trong token, doc duoc o Edge.
- **Performance**: Moi request khong can query DB de check session. Chi can decode JWT.
- **Simplicity**: 1 auth config (auth.config.ts) cho Edge, 1 full config (auth.ts) cho Node.js.

### Cach thuc hien
- `auth.config.ts`: Edge-safe, co session callback map JWT claims -> session.user
- `auth.ts`: Full config voi Prisma adapter, credentials provider, jwt callback set role
- `proxy.ts`: Import auth tu auth.config.ts (khong import Prisma)

### Nhuoc diem
- JWT khong the revoke tuc thi (can doi token expire)
- Role thay doi khong phan anh ngay (can re-login)
- maxAge 30 ngay — chap nhan duoc cho ung dung nay

---

## ADR-004: Chuyen khoan Thu cong thay vi Payment Gateway

### Boi canh
Hoi can thu phi membership va chung nhan. Co 2 lua chon: Payment Gateway (PayOS, VNPay) hoac chuyen khoan thu cong.

### Quyet dinh
Chuyen khoan thu cong — VIP chuyen khoan, admin xac nhan bang tay.

### Ly do
- **Target users**: Doanh nhan 40-60 tuoi, quen voi chuyen khoan ngan hang, it quen voi thanh toan online.
- **So luong nho**: ~100-200 giao dich/nam — admin xu ly bang tay duoc.
- **Chi phi**: Khong mat phi payment gateway (1-2% moi giao dich).
- **Don gian**: Khong can webhook, khong can xu ly refund tu dong.
- **Tin cay**: Khong phu thuoc vao 3rd party payment service uptime.

### CK Description format
- Membership: `HOITRAMHUONG-MEM-{INITIALS}-{YYYYMMDD}`
- Certification: `HOITRAMHUONG-CERT-{INITIALS}-{YYYYMMDD}`
- Noi dung chuyen khoan giup admin doi chieu nhanh voi bank statement

### Idempotency
- Khong cho tao 2 payment PENDING cung luc cho 1 user (check truoc khi tao)
- Admin chi confirm/reject payment dang PENDING

### Khi nao can chuyen sang Payment Gateway
- Khi so luong VIP > 500 va admin khong xu ly kip
- Khi can thu phi tu khach hang ngoai hoi (dich vu truyen thong)

---

## ADR-005: Hybrid Feed Ranking

### Boi canh
Feed can hien thi bai viet theo thu tu co y nghia — khong chi moi nhat, ma con phai uu tien hoi vien dong nhieu phi.

### Quyet dinh
authorPriority = contributionTotal (snapshot khi tao bai). Sort theo authorPriority DESC, createdAt DESC.

### Ly do
- **Don gian**: Khong can Cron job phuc tap de tinh feedScore
- **Cong bang**: Hoi vien dong nhieu phi -> bai viet len cao hon
- **Transparent**: VIP biet ro: dong nhieu hon = uu tien cao hon

### Cach hoat dong
1. Khi VIP tao bai: `authorPriority = user.contributionTotal`
2. Khi admin confirm payment: `post.updateMany({ authorPriority: newTotal })` cho tat ca bai cua VIP do
3. Feed sort: `[{ isPromoted: desc }, { authorPriority: desc }, { createdAt: desc }]`

### Trade-offs
- Khong co engagementScore (so "Huu ich") trong ranking — don gian hoa v1
- Bai cu cua VIP moi dong tien duoc cap nhat authorPriority (khong chi bai moi)
- Admin co the ghim bai (isPromoted) de override ranking

### Tuong lai (v2)
- Them feedScore = contributionScore (40%) + engagementScore (40%) + recencyScore (20%)
- Cron job 15 phut tinh lai feedScore
- Cursor pagination da san sang cho thay doi nay

---

## ADR-006: Chung nhan San pham — Badge System

### Boi canh
Gia tri cot loi cua hoi la chung nhan chat luong san pham tram huong. Can he thong cap badge uy tin.

### Quyet dinh
certStatus workflow 6 trang thai + ma chung nhan HTHVN-{NAM}-{SO} + trang verify public.

### Ly do
- **6 trang thai** phu hop voi quy trinh thuc te: DRAFT -> PENDING -> UNDER_REVIEW -> APPROVED / REJECTED -> REFUNDED
- **Ma chung nhan** co the in len bao bi, QR code -> xac minh tai /verify/[slug]
- **Hoan tien tu dong** khi tu choi: hien TK ngan hang cho admin CK lai

### Flow
```
VIP nop don + CK 5tr
  -> Admin confirm CK -> status = PENDING
  -> Admin xet duyet (online hoac offline)
  -> Duyet: badge URL + email + ma HTHVN-2026-0001
  -> Tu choi: email + ly do + hien TK hoan tien
```

---

## ADR-007: Server Actions vs API Routes

### Boi canh
Next.js App Router co 2 cach xu ly mutations: Server Actions va API Routes.

### Quyet dinh
Dung ca 2, tuy theo context:

| Dung Server Actions | Dung API Routes |
|-------------------|----------------|
| Profile update (ho-so) | Post CRUD (/api/posts) |
| Company update (doanh-nghiep) | Payment confirm/reject |
| Product create/update (san-pham) | Certification approve/reject |
| Password change | Upload file |
| | Media order create |

### Ly do
- **Server Actions**: Tot cho form submit don gian, type-safe, khong can fetch. Zod validation chay o server.
- **API Routes**: Tot cho client-side interactions (optimistic updates, infinite scroll, toggle reactions). Can khi client component goi async.

### Quy tac
- Neu component la server component hoac form submit 1 lan -> Server Action
- Neu component can optimistic UI, polling, hoac goi tu nhieu noi -> API Route

---

## ADR-008: Khong dung Realtime (WebSocket)

### Boi canh
Feed cong dong co can realtime updates (bai moi, reaction moi)?

### Quyet dinh
Khong dung Realtime. Refresh theo trang la du.

### Ly do
- **100 VIP users**: Quy mo nho, khong can realtime
- **Complexity**: WebSocket tang do phuc tap deploy, debug, va chi phi infrastructure
- **UX**: Nguoi dung luc nao cung co the F5 hoac scroll de thay bai moi. Infinite scroll da fetch data moi.
- **Alternative**: ISR revalidate cho public pages, revalidate=0 cho dashboard

### Khi nao can Realtime
- Khi so luong VIP > 500 va co nhu cau chat/notification
- Khi can push notification cho admin khi co payment moi

---

## ADR-009: DOMPurify cho XSS Protection

### Boi canh
TipTap editor tao HTML content. dangerouslySetInnerHTML render HTML ra trang. Vector XSS ro rang.

### Quyet dinh
Dung isomorphic-dompurify de sanitize HTML o CA server lan client.

### Ly do
- **Defense in depth**: Sanitize khi luu (server) VA khi render (client)
- **isomorphic**: Chay duoc o ca Node.js (API route) va browser (client component)
- **Nhe**: ~15KB, khong anh huong performance

### Vi tri sanitize
- POST /api/posts: `DOMPurify.sanitize(content)` truoc khi luu
- POST /api/admin/news: tuong tu
- FeedClient.tsx: `DOMPurify.sanitize(post.content)` truoc khi render
- tin-tuc/[slug]/page.tsx: tuong tu
- tao-bai/page.tsx: preview cung sanitize

---

## ADR-010: Recharts Dynamic Import

### Boi canh
Recharts library ~200KB. Chi dung tren trang /admin (dashboard charts).

### Quyet dinh
Dynamic import voi ssr:false qua wrapper component (DashboardChartsLoader).

### Ly do
- **Bundle size**: Khong load 200KB Recharts tren tat ca cac trang
- **SSR**: Recharts dung DOM APIs, khong compatible voi SSR
- **Wrapper**: Server Component khong dung duoc `dynamic({ ssr: false })` truc tiep -> can client wrapper

### Pattern
```
page.tsx (Server) -> DashboardChartsLoader (Client, dynamic import)
                     -> DashboardCharts (Recharts components)
```
