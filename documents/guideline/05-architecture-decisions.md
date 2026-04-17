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

## ADR-011: Open Posting (Phase 2) — Bo flow "GUEST cho duyet"

### Boi canh
Phien ban truoc: User dang ky -> tao voi `isActive: false` -> admin duyet -> thanh VIP -> moi post duoc.
Khach hang yeu cau: "Account nao cung dang ky va dang bai duoc, khac biet la VIP co quota cao + uu tien hien thi."

### Quyet dinh
1. User dang ky -> `isActive: true` ngay -> dang nhap va post duoc
2. Role `GUEST` la free tier (post 5 bai/thang, khong len trang chu)
3. Role `VIP` la nang cap qua membership fee (post 15-30-∞ bai/thang + uu tien)
4. Auto-activate legacy GUEST inactive (pre-Phase 2 user) khi sign in lan dau

### Trade-offs
- (+) Conversion funnel ngan hon — user thay duoc gia tri ngay
- (+) Khong can admin xu ly hang ngay
- (+) Spam pressure thap (quota 5/thang giu vung)
- (-) Khong screen duoc spam account ngay tu dau (chap nhan, quota la phong tuyen)
- (-) Mat khai niem "ban quan tri xet duyet" (khach hang dong y)

### Migration
- Schema khong doi
- Auth callback: them auto-activate cho legacy `isActive: false` + `role: GUEST`
- Register API: doi `isActive: false` -> `true`
- proxy.ts: bo redirect GUEST -> /cho-duyet, them LOGGED_IN_PREFIXES cho /feed/tao-bai

---

## ADR-012: Quota System (Phase 2) — Per-tier monthly limits

### Boi canh
Sau khi mo posting cho moi user, can chong spam va tao dong luc nang cap VIP. Yeu cau: hard cap theo thang, dem reset dau thang sau.

### Quyet dinh
- 4 tier: GUEST 5 / VIP★ 15 / VIP★★ 30 / VIP★★★ ∞
- Quota luu o SiteConfig key-value, fallback defaults trong `lib/quota.ts`
- Cache 60s o server, check khi POST /api/posts
- Bo dem bai DELETED -> chong gian lan xoa-rebuild

### Khong dung
- Token bucket / sliding window — qua phuc tap cho usecase nho
- Per-day limit (3/ngay cu) — user post don gian gap kho cuoi ngay
- Redis rate limiter — them dependency, ham y deploy phuc tap

### Cach hoat dong
```ts
const usage = await getQuotaUsage(userId)
if (usage.limit !== -1 && usage.used >= usage.limit) return 429
```
GET /api/posts/quota tra quota cho UI chip "Da dung 3/5 bai thang nay".

---

## ADR-013: Newspaper Homepage (Phase 3) — 6 sections + cached rotation

### Boi canh
Khach hang muon trang chu kieu bao chi, khong phai marketing landing. Co sections rieng cho tin Hoi, ban tin hoi vien, SP chung nhan, banner quang cao, tin DN, tin SP.

### Quyet dinh
- 6 section: Tin Hoi (S1) / Ban tin hoi vien (S2 right rail) / Carousel SP (S3) / Banner placeholder (S4) / Tin DN (S5) / Tin SP (S6)
- Layout grid: S1+S2 cung row (2/3 + 1/3), S3-S6 full width
- `lib/homepage.ts` chua tat ca data fetcher voi `unstable_cache(revalidate: 300, tags)`
- Section 5+6 phan biet boi `Post.category` (NEWS / PRODUCT) — schema mới Phase 2
- Section 5+6 chi show bai cua VIP (`isPremium=true`); Section 2 rotating slots cho phep ca non-VIP

### Section 2 — rotating algorithm
- 3 slot top: VIP cao nhat theo `authorPriority desc` (sticky)
- 6 slot rotate: weighted random tu pool 50, refresh moi 5 phut
- Seed = 5-min bucket → mọi user trong cung window thay cung ket qua (deterministic)
- Mulberry32 PRNG inline 8 dong code, khong dep moi

### Carousel S3 — CSS-only marquee
- 60s loop, hover pause, fade mask 2 dau
- Khong dung JS — server-rendered, accessible, khong layout shift
- Inline `<style>` block cho keyframes (khong phu thuoc global CSS)

---

## ADR-014: Featured Pin (Phase 4) — Manual curation thay vi auto-rank

### Boi canh
Khach hang duoc hoi: top 10 DN va top 20 SP duoc rank tu dong (theo metric) hay admin chon tay? Tra loi: **admin chon tay**.

### Quyet dinh
- Schema: `Company.isFeatured + featuredOrder`, `Product.isFeatured + featuredOrder`
- Admin UI tai `/admin/tieu-bieu` voi 2 tab (SP / DN), toggle + number input cho thu tu
- Auto-save voi optimistic UI + rollback khi API fail
- Validate VIP-only o API layer (`owner.role === "VIP"`) — chong gian lan
- Khi unfeatured, tu dong clear `featuredOrder = null`

### Tai sao khong auto-rank
- Khach muon kiem soat content tren landing page (co the curate theo chien dich)
- Khong co metric "trending" san sang trong DB
- Don gian hoa logic — admin xu ly bang tay it lan trong nam

### Cache invalidation
- Sau khi admin pin/unpin: `revalidateTag("homepage", "max")` va `revalidateTag("products"/"companies", "max")`
- Trang chu va landing page se thay doi sau ~5 phut (stale-while-revalidate window)

---

## ADR-015: Landing Page (Phase 5) — Conversion page tach roi trang chu

### Boi canh
Khach hang muon **2 trang khac nhau**: trang chu (newspaper, daily news) va landing (conversion to VIP).

### Quyet dinh
- Route `/landing` rieng (khong la `/`)
- Menu navbar them "Quyen loi hoi vien" → /landing (label dich tu "Landing page" cho friendly hon)
- 6 section: Hero / Stats / Top 10 DN / Top 20 SP hot trend / Tier comparison / Final CTA
- Tier comparison 4 cot (Khach / VIP★ / VIP★★ Bac / VIP★★★ Vang) voi badge "Pho bien nhat" o tier giua
- proxy.ts: GUEST hit MEMBER_PREFIXES → redirect /landing (Phase 2 truoc do redirect /, Phase 5 sua)

### Why "Landing page" → "Quyen loi hoi vien"
- "Landing page" la thuat ngu ky thuat, khong phu hop end-user 40-60 tuoi
- Match dung intent (gioi thieu benefit), distinct voi `/hoi-vien` (directory)
- SEO friendly keyword

### SEO + conversion
- JSON-LD `Organization` schema voi member count dong
- Meta description + Open Graph + Twitter Card
- 3 CTA primary "Dang ky VIP" rai khap page (Hero, Tier card x4, Final CTA)
- Trust signal: "Dang ky mien phi • Khong can the tin dung • Kich hoat ngay"

---

## ADR-017: Banner Quang cao (Phase 6 — SPEC) — Gia flat + quota theo tier

### Boi canh
Khach hang yeu cau co flow tu dang ky banner quang cao. Phase 5 da tao placeholder o
Section 4 trang chu. Phase 6 can chot business rules truoc khi code.

### Quyet dinh (chot 04/2026)

**1. Doi tuong su dung — moi user dang nhap (KHONG VIP-only)**
- Khac voi cac tinh nang VIP khac (chung nhan SP, gia han, ho so)
- Ly do: Banner la nguon doanh thu, mo rong cho ca GUEST de tang revenue + lower friction
- GUEST tu nhien co quota thap (1 mau/thang) -> dong luc nang cap

**2. Gia FLAT 1tr/mau/thang — KHONG discount theo tier**
- Da xem xet phuong an "discount theo tier" (Phase 5 ban dau de placeholder 10%/25%)
- Khach chot: gia bang nhau de don gian + minh bach
- Khac biet giua tier nam o **quota** (so mau), khong phai gia tien

**3. Quota theo tier — chong spam + dong luc nang cap VIP**
| Tier | Quota |
|------|------|
| GUEST | 1 mau/thang |
| VIP★ | 5 mau/thang |
| VIP★★ Bac | 10 mau/thang |
| VIP★★★ Vang | 20 mau/thang |

- Quota dem so banner ACTIVE trong cung 1 thang lich
- Reset 0h ngay 1 hang thang (giong quota bai post)
- Gia han KHONG dem vao quota moi

**4. Hien thi: max 20 slot rotate, 5 giay/banner**
- Khac voi tu duy thuong (1 banner co dinh): banner rotate giua nhieu user
- Ly do: cong bang giua cac user dong tien, tao "live wall" cho hoi cong dong
- 5 giay = du de doc title + click neu quan tam, khong qua nhanh

**5. Priority chon 20 slot khi co > 20 banner ACTIVE**
- VIP★★★ Vang -> VIP★★ Bac -> VIP★ -> GUEST
- Trong cung tier: random hoac newest first
- Tao incentive ro rang: dong tien VIP cao hon -> co kha nang xuat hien chac chan hon

**6. Cho phep gia han banner**
- User co the gia han banner ACTIVE sap het han (< 7 ngay)
- Phi gia han = 1tr × so thang gia han them
- KHONG can admin duyet noi dung lai (chi confirm CK)
- KHONG dem vao quota thang moi
- Ly do: giam friction cho user da co banner duoc duyet, tang retention

### Trade-offs
- (+) Mo cho GUEST -> tang doanh thu, conversion
- (+) Quota la phong tuyen chong spam, khong can moderation phuc tap
- (+) Rotation 5s tao "live ad wall" — fair share giua cac user
- (-) Khong thay duoc 1 banner co dinh — co the giam CTR cho moi banner rieng le
- (-) Priority co the gay tranh chap (VIP it duoc hien hon GUEST nhieu hon)
- (-) 1tr flat la gia thap — lai theo doanh thu it nhung volume cao

### Quyet dinh tuong lai (chua chot)
- Tang ky thuat hien thi (vd 7s thay vi 5s neu can doc nhieu)
- Phi cao hon cho slot dac biet (vd: top fold, hero banner)
- Analytics: track impression + CTR cho moi banner

### Implementation note
- Schema can: `Banner` model + `BannerStatus` enum + `PaymentType.BANNER_FEE`
- Bo `BannerPosition` (chot Phase 6: chi 1 vi tri HOMEPAGE_MAIN)
- Helper `lib/bannerQuota.ts` tuong tu `lib/quota.ts` cho post quota
- Component `<HomepageBannerSlot />` rewrite — fetch top 20 + auto-rotate (client component voi `setInterval`)

---

## ADR-016: Recharts Dynamic Import

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

---

## ADR-017: Navbar mode detection qua pathname (khong qua role)

### Boi canh
Ban dau Navbar chon menu theo `session.user.role`: VIP → menu member, ADMIN → menu admin, GUEST → menu public. Khach hang yeu cau **moi user** (bao gom VIP/ADMIN) khi xem trang cong khai deu thay menu cong khai giong nhu guest, de tranh nham lan.

### Quyet dinh
Chon menu Navbar theo **pathname**, khong theo role. `proxy.ts` set header `x-pathname` vao moi response. Navbar (server component) doc header va detect mode:

```ts
const MEMBER_PATH_PREFIXES = ["/tong-quan", "/gia-han", "/ho-so", "/chung-nhan",
  "/doanh-nghiep-cua-toi", "/thanh-toan", "/ket-nap", "/tai-lieu"]
const ADMIN_PATH_PREFIXES = ["/admin"]

function detectMode(pathname: string): "public" | "member" | "admin" {
  if (ADMIN_PATH_PREFIXES.some(p => pathname.startsWith(p))) return "admin"
  if (MEMBER_PATH_PREFIXES.some(p => pathname.startsWith(p))) return "member"
  return "public"
}
```

### Ly do
- **Khong gay nham lan**: Admin tren `/` van thay menu cong khai → giong nhu khach → verify duoc UX cong khai
- **Tach biet intent**: User phai *co y* vao khu vuc quan tri (qua dropdown) → khong vo tinh bi dua vao trang member
- **/feed la public**: Ngay ca VIP vao `/feed` cung thay menu cong khai (vi `/feed` khong o trong MEMBER_PATH_PREFIXES)

### UserMenu bo sung 2 item mode-based
- **Public mode + VIP/ADMIN**: "Vao khu vuc quan tri" / "Vao trang quan tri" → navigate `/tong-quan` hoac `/admin`
- **Member/admin mode**: "Ve trang cong khai" → navigate `/`

### Admin sidebar co link "Ve trang cong khai"
Vi admin layout khong dung Navbar (dung AdminSidebar thay), can nut rieng trong sidebar — positioned sau Dang xuat, styling accent nen noi bat.

### Implementation
- `proxy.ts`: helper `passThrough()` goi `NextResponse.next()` + set `x-pathname`
- `Navbar.tsx`: `const [session, headersList] = await Promise.all([auth(), headers()])` → `pathname = headersList.get("x-pathname") ?? "/"`
- `UserMenu.tsx`: nhan `mode` prop tu Navbar

---

## ADR-018: TipTap v3 + React 19 — flushSync patterns

### Boi canh
Editor `/admin/tin-tuc/[id]` dung `@tiptap/react@3.22` voi custom NodeView
(`ResizableImageView` co drag handles). React 19 strict hon ve flushSync, throw
loi `flushSync was called from inside a lifecycle method` trong 3 tinh huong:

1. Load page voi nhieu images → Tiptap's `ReactNodeViewRenderer` goi flushSync khi mount cac NodeView song song
2. Goi `editor.chain().updateAttributes(...)` trong onClick handler → transaction trigger NodeView re-render → flushSync khi React dang trong lifecycle
3. Su dung state tu `useEditor` bang cach goi `editor.isActive("bold")` trong JSX render → cantrigger chain re-render

### Quyet dinh
Ap dung 3 lop fix:

**1. `shouldRerenderOnTransaction: false` + `useEditorState` hook**
```ts
const editor = useEditor({
  extensions: [...],
  immediatelyRender: true,        // Tranh SSR race — file la "use client" roi
  shouldRerenderOnTransaction: false, // Tat auto-rerender tren moi transaction
})

const editorState = useEditorState({
  editor,
  selector: ({ editor }) => ({
    isBold: editor?.isActive("bold"),
    isImage: editor?.isActive("image"),
    isAlignCenter: editor?.isActive({ textAlign: "center" }),
    // ... subscribe tung piece state can thiet cho toolbar
  }),
})
```
`useEditorState` dung `useSyncExternalStore` noi bo → safe pattern, khong flushSync.

**2. `queueMicrotask` wrap editor mutations trong event handlers**
```ts
onClick={() => {
  const newSrc = window.prompt("URL:")
  if (newSrc) {
    // Defer ra khoi React lifecycle hien tai
    queueMicrotask(() => {
      editor.chain().focus().updateAttributes("image", { src: newSrc }).run()
    })
  }
}}
```

**3. Drag-resize commit o NodeView cung queueMicrotask**
Trong `onMouseUp` cua ResizableImageView, wrap `updateAttributes` de tranh conflict voi React re-render khi selection change.

### Trade-offs
- (+) 0 flushSync errors (verified via Playwright)
- (+) Toolbar state van responsive (useEditorState)
- (+) UX khong bi cham (microtask ~0.1ms delay, unnoticeable)
- (-) Code them boilerplate (queueMicrotask wrap moi editor mutation)
- (-) `useEditorState` can list ALL state pieces upfront — khong auto

### Testing
Playwright headless test 7 action points: load / click Bold / click Image / click Reset size / click URL (prompt) / drag SE handle / click align Center. Tat ca → 0 errors.

---

## ADR-019: TipTap Custom NodeView cho drag-resize + text-align image

### Boi canh
Can nang cap editor cho admin phep: resize anh bang drag (thay vi input px), align anh trai/giua/phai, va preserve ra HTML output.

### Quyet dinh
Tao `ResizableImage` extension — extend `@tiptap/extension-image` voi:

1. **`addAttributes`**: Them `width` + `height` attributes. Render HTML voi inline `style="width: X; height: Y"` de preserve khi render `/tin-tuc/[slug]` cong khai.

2. **`addNodeView`**: `ReactNodeViewRenderer(ResizableImageView)` — custom React component de ve drag handles + hien ring khi selected.

### ResizableImageView layout (2 lop wrap)
```tsx
<NodeViewWrapper className="block w-full" style={{ textAlign }}>
  <div className="relative inline-block">
    <img style={{ width, height }} />
    {selected && <>{3 handles}</>}
  </div>
</NodeViewWrapper>
```

- **Outer**: block + `text-align` tu `node.attrs.textAlign` (TipTap `TextAlign` extension set) → vi tri anh trong row
- **Inner**: relative inline-block → context cho handles position absolute

### Drag math
3 handles: E (phai-giua), S (duoi-giua), SE (goc duoi-phai).
- Mousedown: capture start position + start size + aspect ratio
- Mousemove: compute delta → update img.style directly (realtime, smooth)
- `lastSizeRef` luu gia tri intended (khong phai rendered — rendered co the bi cap boi CSS `max-width`)
- Mouseup: commit `lastSizeRef` vao node attrs qua `updateAttributes` (wrapped trong queueMicrotask — xem ADR-018)

### CSS traps
- Tailwind `prose` plugin default set `img { max-width: 100% }` → override bang `max-w-none!` (important modifier Tailwind v4)
- Wrapper `inline-block` khong respect parent's `text-align` (chi respect cho *children*) → dung `block w-full` outer de text-align co khong gian

### Trade-offs
- (+) UX tuong tu Google Docs — intuitive
- (+) Text align preserve trong HTML output
- (-) NodeView them ~200 LOC
- (-) Phai debug nhiev CSS trap (max-width, prose, sticky)
- (-) Tang compile time cho page editor (them React component)

### Why not a package?
Co 3rd-party packages cho drag-resize (vd `tiptap-imagresize`) nhung:
- Chua update len TipTap 3.22
- Khong ho tro text-align integration
- Chi 200 LOC custom → maintain de hon la depend vao package ngoai tam kiem soat

---

## ADR-020: Import scripts + Legacy site crawling

### Boi canh
Khach hang co mot website cu `hoitramhuongvietnam.org` voi data that: 9 doanh nghiep doi tac + 8 van ban phap quy + 7 bai nghien cuu + 48 bai tin tuc. Can import vao platform moi ma khong can nhap tay.

### Quyet dinh
Viet **scripts tu dong** voi pattern 2 step:

**Step 1 — Import metadata**:
- `scripts/import-research-articles.ts` — 7 bai nghien cuu (hardcoded list)
- `scripts/import-news-articles.ts` — 48 bai tu JSON file
- Chi tao News record voi placeholder content + thumbnail Cloudinary

**Step 2 — Crawl full content**:
- `scripts/crawl-research-content.ts` — flag `--category=GENERAL|RESEARCH`
- Doc `News.sourceUrl` tu DB → fetch HTML → parse `.single-post` container → extract images → upload Cloudinary → rewrite src → sanitize DOMPurify → update `News.content`

### Ly do tach 2 step
- **Step 1 nhanh**, cho user thay data ngay tren UI (thumbnail + title + source link)
- **Step 2 cham** (network + Cloudinary), co the chay lai voi idempotent check (skip da crawl via placeholder marker)
- Failure isolation: neu 1 bai fail, khac khong bi anh huong

### Common patterns o all scripts
1. Load env manually (tsx khong auto-load `.env.local`)
2. Dynamic require Prisma/Cloudinary sau khi env loaded
3. TLS workaround: `NODE_TLS_REJECT_UNAUTHORIZED=0` (legacy cert)
4. Idempotent: check existing record truoc khi create/update
5. Batched error handling: log + tiep tuc (khong abort)

### Legacy site DOM pattern
Sau khi inspect, xac dinh trang cu dung template chung voi main content o `.single-post > .blog_details`. Selectors:
- Title: first `<h4>` in `.single-post`
- Content: `.blog_details` innerHTML
- Images: `<img>` bat dau voi `../images/` (relative) hoac `images/` (broken relative → fallback root)
- Related posts: `.media.post_item` (strip)
- Iframes: whitelist YouTube + Vimeo, strip others

### Trade-offs
- (+) Data that import nhanh — ~1 phut cho toan bo 55 bai (7 research + 48 news)
- (+) Images luu Cloudinary → khong phu thuoc trang cu
- (+) Scripts idempotent → safe chay nhieu lan
- (-) Legacy site template thay doi se break scripts
- (-) Scripts la one-shot, khong phai cron — chi chay khi setup

---

## ADR-021: Footer editable qua SiteConfig + tag-based revalidation

### Boi canh
Khach hang yeu cau tu sua noi dung footer (gioi thieu ngan, gio lam viec, co so
phap ly, copyright, quick links) ma khong can developer deploy lai. Truoc day
cac gia tri nay hard-code trong `components/features/layout/Footer.tsx`.

### Quyet dinh
- Footer doc cac key sau tu SiteConfig, co fallback mac dinh trong code neu key trong:
  `footer_brand_desc`, `footer_working_hours`, `footer_legal_basis`,
  `footer_copyright_notice`, `footer_quick_links`
- `footer_quick_links` dung format text don gian, moi dong 1 link: `Nhan|duong-dan`
  (Footer tu parse, khong can JSON de admin sua de hon)
- Admin UI `/admin/cai-dat` them nhom **"Footer website"** trong `SettingsForm.tsx`,
  support `type: "textarea"` cho cac field nhieu dong
- Bo sung `association_phone_2`, `association_website`, `zalo_url` vao nhom
  "Thong tin Hoi" (truoc day thieu tren UI du da co trong SiteConfig)
- API `app/api/admin/settings/route.ts` goi `revalidateTag("footer", "max")` +
  `revalidateTag("site-config", "max")` sau khi save -> Footer cap nhat ngay,
  khong can doi TTL
- Seed script `scripts/seed-footer-settings.ts` idempotent, tao defaults khi key
  chua ton tai (khong ghi de)

### Ly do
- **Pipe-separated format**: Admin 40-60 tuoi khong quen JSON. Format
  `Nhan|duong-dan` de hieu, de sua, van parse duoc deterministic
- **Tag-based invalidation**: Pattern da quen thuoc trong codebase (homepage,
  banners...) — khong can hoc pattern moi
- **Fallback trong code**: Neu admin xoa nham key, Footer van hoat dong

### Trade-offs
- (+) Khong can deploy cho thay doi noi dung footer
- (+) Seed script giu default o 1 cho — de update
- (-) Them ~5 keys SiteConfig (khong dang ke)
- (-) Format `Nhan|duong-dan` khong validate URL — admin phai go dung

---

## ADR-022: Homepage streaming + blur placeholder — LCP uu tien main content

### Boi canh
Truoc day `app/(public)/page.tsx` dung `Promise.all` fetch tat ca 6-7 sections
cung luc roi render mot lan. TTFB cham vi phai doi section cham nhat (thuong la
CertifiedProductsCarousel hoac banner query). LCP bi anh huong vi anh hien trang
truoc khi load.

### Quyet dinh
**1. Progressive streaming voi Suspense boundary co chon loc**
- Bo `Promise.all` top-level — moi section fetch rieng trong component con
- Wrap `<Suspense fallback={<Skeleton/>}>` cho: banner TOP/MID,
  CertifiedProductsCarousel, `LatestPostsSection` (Tin DN + Tin SP), PartnersCarousel
- **KHONG wrap Suspense** (co chu y): `NewsSection` (Tin Hoi) + `MemberNewsRail`
  (Ban tin hoi vien) — de block initial HTML flush, dam bao main content luon
  co mat khi first paint
- List pages co `loading.tsx` rieng: `/tin-tuc`, `/san-pham-doanh-nghiep`

**2. Cloudinary blur placeholder**
- `lib/imageBlur.ts` export `BRAND_BLUR_DATA_URL` — PNG base64 8×5 warm-beige
  (~120B), dung `placeholder="blur" blurDataURL={...}` tren `next/image`
- Optional helper `cloudinaryBlurUrl(publicId)` — gen blur tu chinh anh khi can
  accuracy cao (transform `w_8,q_10,e_blur:1000`)
- Ap dung: PostCard (3 variants), NewsSection, CertifiedProductsCarousel,
  marketplace product grid

### Ly do
- **Uu tien LCP cua main content**: Nguoi dung vao trang chu can thay Tin Hoi
  ngay — khong chap nhan skeleton cho section chinh. Cac section phu (banner,
  carousel) stream sau, CLS=0 nho skeleton cung kich thuoc
- **Constant blur placeholder**: 1 data URL dung chung -> khong can query
  Cloudinary cho placeholder -> nhe, cache-friendly. Warm-beige match brand
  khong bi "xam xit" nhu default
- **Helper co san**: `cloudinaryBlurUrl()` san sang cho case can accuracy cao
  (vd hero image) ma khong phai refactor

### Trade-offs
- (+) LCP on dinh hon — Tin Hoi luon hien khi first paint
- (+) Perceived performance tot — blur thay vi man trang
- (+) TTFB van chap nhan duoc (Tin Hoi cache 300s)
- (-) TTFB cao hon 1 chut so voi full-streaming (moi section wrap Suspense)
- (-) Hard-code BRAND_BLUR_DATA_URL — doi mau brand phai re-gen (toi gian)
- (-) Them 3 files (`NewsSection`, `LatestPostsSection`, `skeletons`) —
  tach concern ro rang hon nen chap nhan

### Khi nao review lai
- Neu query Tin Hoi cham > 500ms -> can xem xet wrap Suspense va chap nhan
  skeleton cho section nay
- Neu them hero image co anh chat luong cao -> dung `cloudinaryBlurUrl()` thay
  vi constant

---

## ADR-023: Cap width upload theo ngu canh (folder-based preset)

### Boi canh
Truoc day `/api/upload` ap cap chung 1600px cho moi anh qua Cloudinary transform
`c_limit,w_1600`. Hop ly cho hero/san pham nhung lang phi cho logo doi tac
(render ~200px), anh trong post (content max-width ~800px) va qua it cho banner
full-width desktop 2560px+.

### Quyet dinh
- Server `app/api/upload/route.ts` co bang preset `FOLDER_MAX_WIDTH`:
  - `bai-viet` → 1200, `tin-tuc` → 1600, `san-pham` → 1600,
    `doi-tac` → 600, `doanh-nghiep` → 1600, `banner` → 2560,
    default → 1600
- Client co the ghi de qua FormData `maxWidth` — server kep `200..4000` truoc
  khi fallback ve preset. Da ap dung tai `CompanyEditForm.tsx`
  (logo → 600, cover → 1920)
- Cloudinary `crop: "limit"` giu nguyen — chi downscale, khong upscale
- WebP + `quality: "auto"` khong doi
- Khong schema change, khong migration — anh cu giu nguyen

### Ly do
- **Byte thuc te giam manh** cho logo/anh nho: 600px ~ 1/7 diem anh so voi 1600px,
  keo theo giam mang luoi mobile va LCP
- **Preset server-side** tranh rui ro client gui cap qua cao hoac sai, van co
  escape-hatch qua `maxWidth` cho truong hop dac biet (cover full-bleed 1920)
- **Kep 200..4000** chan abuse (upscale 8K) va sai so (maxWidth=0 hoac NaN)
- **Khong touch du lieu cu**: goi la toi gian, roll-forward an toan

### Trade-offs
- (+) Byte tai ve giam, LCP mobile tot hon
- (+) Logo doi tac sac net dung do phan giai render (khong phi pixel)
- (+) Banner 2560 du cho man hinh 2K/4K
- (-) Them 1 bang mapping can dong bo voi folder convention — doi ten folder
  phai update bang
- (-) Anh cu van 1600px (khong re-encode) — chap nhan vi re-upload thu cong khi can

### Khi nao review lai
- Neu them folder moi → bo sung vao `FOLDER_MAX_WIDTH` (khong de default 1600
  lang phi byte)
- Neu Cloudinary ho tro responsive breakpoints rong hon → cos nhac chuyen sang
  `w_auto` + DPR-aware thay vi cap cung

---

## ADR-024: Role INFINITE = admin read-only (tai su dung enum Role)

### Boi canh
Lanh dao Hoi (Chu tich, Pho Chu tich) can xem moi du lieu admin (hoi vien, thanh toan,
chung nhan, bao cao) de giam sat, nhung khong tham gia tac nghiep → khong duoc sua/xoa/
duyet. Co 2 huong:
1. **Separate permission system**: them bang `Permission`, `RolePermission` → RBAC day du.
2. **Them 1 gia tri Role moi**: `INFINITE` = admin chi-doc, reuse flow auth hien tai.

### Quyet dinh
Chon (2) — them gia tri `INFINITE` vao enum `Role`. 2 helper trong `lib/roles.ts`:
```ts
isAdmin(role)        // ADMIN + INFINITE → cho phep vao view admin
canAdminWrite(role)  // chi ADMIN → cho phep mutation
```
Mutation API dung `canAdminWrite()`, view API/page dung `isAdmin()`.

### Ly do
- **RBAC full** qua moi so voi nhu cau: chi 1 "use case" duy nhat (read-only admin) — khong
  can bang `Permission` cho 1 diem phan quyen.
- **Reuse JWT**: role da co trong JWT, khong can thay doi auth shape. Session callback
  khong thay doi.
- **Proxy/middleware de xu ly**: `proxy.ts` cho phep INFINITE vao `/admin/*` giong ADMIN,
  ko phai rewrite route matching.
- **Hien bao cao/log roi rang**: log mutation kem role snapshot — INFINITE khong bao gio
  xuat hien trong audit mutation.
- **UX nhat quan**: disable nut kem tooltip + banner top page → user hieu ngay minh o
  che do chi-doc, khong kich chi ra error 403.

### Cach thuc hien
- Migration `20260415000000_add_infinite_role` them gia tri vao enum.
- Layout `app/(admin)/layout.tsx` render banner canh bao khi role=INFINITE.
- Moi admin API route mutation (POST/PATCH/DELETE) replace `role === "ADMIN"` bang
  `canAdminWrite(role)`.
- UI button mutation wrap voi check `canAdminWrite()` → `disabled` + `title` tooltip.
- Admin list/detail pages: `export const revalidate = 0` → tranh cache cross-user cho
  hydration mismatch giua ADMIN va INFINITE.
- INFINITE bo qua check `membershipExpires` trong proxy (khong phai VIP).

### Trade-offs
- (+) Thay doi toi thieu, roll-forward an toan, Prisma type generation tu dong.
- (+) Dev moi chi can doc `lib/roles.ts` la hieu model phan quyen.
- (-) Neu tuong lai can them role thu 5 (vd "Editor" chi sua News), se phai pattern-repeat
  helper. Khi do moi can cos nhac refactor sang RBAC table.
- (-) Bat buoc audit moi API route mutation: quen 1 endpoint la INFINITE co the ghi duoc.
  Giam thieu bang grep `session.user.role === "ADMIN"` va replace toan bo.

### Khi nao review lai
- Khi co > 2 role read-only khac nhau (vd "Editor", "Auditor") → chuyen sang bang
  `Permission` va map qua role.

---

## ADR-025: Navbar Menu CMS — hybrid DB + code registry

### Boi canh
Navbar cong khai truoc day hard-code trong `lib/nav-links.ts` — thay doi label hoac them
muc phai re-deploy. Admin yeu cau co the tu quan ly menu (them/an/sort/submenu).
Dong thoi van can highlight "active" menu chinh xac khi user vao sub-page (vd
`/tin-tuc/[slug]` phai highlight "Nghien cuu" hoac "MXH Tram Huong").

### Quyet dinh
**Hybrid**:
1. **DB-driven** cho noi dung: model `MenuItem` (label, href, parent, sortOrder,
   isVisible, badges...) admin CRUD qua `/admin/menu`.
2. **Registry code** cho active highlight fallback: `lib/route-menu-map.ts` map
   `{prefix → menuKey}` cho 34 public route.
3. **Admin-first priority**: neu `MenuItem.matchPrefixes` co match → thang registry.

### Ly do
**DB-driven cho noi dung**:
- Admin khong can deploy de doi navbar — nhu News, Partner, Banner.
- Submenu 1 cap du dung cho 3 nhom lon (Gioi thieu / MXH / Hoi vien) — khong can deeper
  tree gay phuc tap UX.

**Registry code cho active highlight**:
- Public page co hang chuc route khong tuong ung 1-1 voi menu item (vd `/privacy`,
  `/login`, `/tin-tuc/[slug]`). Neu luu trong DB: admin phai biet moi route → de sai.
- Code biet ro app routes (co coverage script check).
- `menuKey: null` trong registry → co quyen "khong highlight gi" cho auth/legal/404.

**Admin-first priority**:
- Admin ghi `matchPrefixes` → override code. Vi du admin muon "Nghien cuu" active khi
  user vao `/tai-lieu-khoa-hoc` — just add prefix, khong can code change.
- Neu admin khong set → fallback registry code (default behavior).
- Mutually exclusive: neu co bat ky node nao match `href`/`matchPrefixes` → KHONG fallback
  registry → tranh conflict 2 menu cung active.

### Cach thuc hien
- `lib/menu-active.ts` → `getActiveNodeIds(tree, pathname)` thuc thi thuat toan 3 buoc.
- `NavDesktopMenu` + `NavMobile` la client component dung `usePathname()` → re-render khi
  route doi trong layout group (van de cu: navbar server component trong layout group
  khong re-render giua cac route cung group).
- Cache menu tree 60s, tu clear khi admin write.
- Coverage guard: `scripts/check-route-menu-coverage.ts` fail CI neu public route moi
  chua khai registry.

### Trade-offs
- (+) Admin tu quan ly noi dung + override highlight ma khong deploy.
- (+) Default behavior (registry) van dung cho ~95% case.
- (+) Mutually exclusive: 0 risk conflict 2 menu cung active.
- (+) Coverage script bat route moi chua khai registry — tranh silent regression.
- (-) 2 nguon su that cho active (DB + code) → dev moi phai hieu "admin-first priority".
  Mitigate bang comment day du trong `lib/menu-active.ts` + ADR nay.
- (-) Client-side active detection tang bundle navbar ~2KB (usePathname + algorithm).

### Khi nao review lai
- Neu cay menu sau nay can deeper (> 1 cap) → schema can `depth` guard + UI redesign.
- Neu registry ngay cang phuc tap (> 100 route) → cos nhac chuyen hoan toan sang
  `matchPrefixes` trong DB + admin UI de them bulk.

---

## ADR-026: Hero Gallery — `unstable_cache` + daily deterministic pick

### Boi canh
Round-6 them feature **anh nen gallery** cho toan bo trang cong khai. Admin upload N anh, he thong phai:
1. Chon 1 anh cho moi request.
2. Cho phep admin toggle `isActive` va thay doi phan anh anh ra **ngay lap tuc** tren homepage.
3. Khong lam giam perf (HeroBackdrop render trong layout public → chay tren moi page).

Hai quyet dinh con ban-cai ky.

### Quyet dinh

**1. Dung Next.js `unstable_cache` (tag-based) thay cho in-memory module cache.**

```ts
export const getDailyHeroImage = unstable_cache(
  async () => { /* query DB + pick */ },
  ["hero-daily"],
  { tags: ["hero-images"], revalidate: 300 },
)
export const clearHeroCache = () => revalidateTag("hero-images")
```

**2. Daily deterministic pick (hash YYYY-MM-DD mui gio VN) thay cho random moi request.**

```ts
const key = formatInTimeZone(new Date(), "Asia/Ho_Chi_Minh", "yyyy-MM-dd")
const idx = fnv1a(key) % active.length
```

### Ly do

**`unstable_cache` thay module cache**:
- Pattern tu nhien ban dau: `let cached: HeroImage | null = null` trong `lib/hero.ts`, API handler set `cached = null` khi mutation.
- Thuc te trong Next dev (va production serverless): **module graph cua API route va cua layout renderer bi isolate** — bien module-level set tu API handler **khong visible** tu layout renderer → admin toggle nhung user van thay anh cu cho toi khi Next tu invalidate (hoac restart).
- `unstable_cache` dung persistent cache layer cua Next + `revalidateTag` di qua cache layer do → cross-process invalidate hoat dong dung.
- Tradeoff: API van `unstable_` → Next co the rename. Chap nhan vi la primitive chinh thuc duoc document, khong co alternative on-dinh hon o Next 16.

**Daily deterministic pick**:
- Neu random moi request: moi F5 thay anh khac → user kho chiu, CDN/browser khong cache duoc hero image (moi request moi URL).
- Neu deterministic theo `userId`: user chua login thi sao? Va anh se "stuck" 1 nguoi vao 1 anh mai → phi gallery.
- Daily deterministic = cai bang: moi user cung thay cung anh trong ngay (cache CDN + browser hit 100%), nhung moi ngay moi anh (trai nghiem tuoi moi, showcase du bo gallery trong ~N ngay).
- Mui gio VN: bao dam "ngay moi" flip dung 00:00 VN, khong phai 00:00 UTC (se flip luc 7:00 VN — kho hieu).
- FNV-1a: fast, deterministic, distribution du tot cho N < 100 anh. Khong can crypto.

### Cach thuc hien
- `lib/hero.ts` (~40 LoC) — `getDailyHeroImage` + `clearHeroCache`.
- Moi mutation trong `/api/admin/gallery` goi **ca 2**:
  - `clearHeroCache()` — invalidate tag.
  - `revalidatePath("/", "layout")` — **bat buoc chu "layout"**, vi HeroBackdrop trong `(public)/layout.tsx`; arg mac dinh chi invalidate "page" khong xuong toi layout cache.
- E2E guard: `e2e/gallery-toggle.spec.ts` — admin deactivate anh → reload homepage → expect `hero-backdrop` doi (hoac mat).

### Trade-offs
- (+) Cross-process invalidate hoat dong trong ca dev va prod.
- (+) CDN cache hit cao (URL on-dinh 24h).
- (+) User experience nhat quan — khong flicker anh giua cac page nav.
- (+) E2E cover revalidate bug → tranh regression.
- (-) Dung `unstable_` API → co risk rename o major upgrade. Mitigate: grep de rename 1 lan.
- (-) Neu admin upload anh moi va muon "see it now", phai reload → co the cam thay cham neu browser cache HTML. Chap nhan — admin workflow khong phai real-time.

### Khi nao review lai
- Neu can hien thi anh khac nhau theo loai trang (vd homepage vs `/tin-tuc`) → them field `scope` va logic pick theo scope.
- Neu so anh active > 100 va muon weight theo `sortOrder` (vd anh A hien gap 2 anh B) → thay FNV-1a index bang cumulative-weight selection.
- Neu Next cho ra `cache()` stable API thay the `unstable_cache` → migrate.
