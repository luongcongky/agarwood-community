# Tai lieu Du an — Hoi Tram Huong Viet Nam

> Phien ban hien tai: **3.3** — 04/2026
> Phase 1-6 + Dieu le integration + Van ban phap quy + TipTap editor enhancements + **Journalistic redesign (V2)**

## Danh sach tai lieu

| # | File | Doi tuong | Noi dung |
|---|------|----------|---------|
| 01 | [Huong dan Admin](01-huong-dan-admin.md) | Ban quan tri | Van hanh hang ngay + Van ban phap quy + Don ket nap + Che do xem |
| 02 | [Huong dan VIP](02-huong-dan-vip.md) | Hoi vien | Dang nhap, ho so, dang bai, chung nhan, gia han, don ket nap Hoi vien chinh thuc |
| 03 | [Business Document](03-business-document.md) | Ca 2 ben | Quy trinh, fees theo Dieu le, phan hang hoi vien, SLA, Van ban phap quy |
| 04 | [Technical Document](04-technical-document.md) | Developer | Codebase, ERD moi (MemberCategory, NewsCategory), Tiptap v3, Navbar mode, Import scripts |
| 05 | [Architecture Decisions](05-architecture-decisions.md) | Developer | 34 ADR — them ADR-033 (Journalistic V2 redesign), ADR-034 (Lazy-load + unstable_cache Date) |
| 06 | [API Documentation](06-api-documentation.md) | Developer | 30+ endpoints — them MembershipApplication, phap-ly admin CRUD, news category |
| 07 | [Demo Flow Tests](../testing/demo-flow/README.md) | QA / Demo | 2 E2E test suite (VIP 16 buoc + Admin 12 buoc), ghi video tu dong |

## Ai doc gi

| Vai tro | Tai lieu can doc |
|---------|-----------------|
| Admin (ngay dau) | 01 (muc 1-10), 03 (muc 1, 2, 3, 5, 7, 12) |
| Admin nhan **Van ban phap quy / Don ket nap** (moi) | 01 (muc 11, 12, 13) |
| Hoi vien moi | 02 (muc 1-10) |
| Hoi vien muon **Hoi vien chinh thuc** (moi) | 02 (muc 11), 03 (muc 1.0, 1.3.1) |
| Developer moi | 04, 05, 06 |
| Developer implement **TipTap editor**/**Import scripts** | 04 (muc 10.6, 12), 05 (ADR-018, 019, 020) |
| Developer implement **Navbar mode** | 04 (muc 10.5), 05 (ADR-017) |
| Developer sua **chrome (SiteHeader/CategoryBar/SiteFooter)** | 05 (ADR-033) |
| Developer them route list voi **lazy-load pattern** | 05 (ADR-034) |
| Khi co tranh chap | 03 (muc 4, 9) |
| Khi tich hop mobile/3rd party | 06 |
| Khi can demo san pham / quay video | 07 |

## Changelog gan nhat (3.3 — Journalistic redesign, 2026-04)

- **Chrome redesign**: `Navbar` cu -> `SiteHeader` (utility strip + masthead +
  CategoryBar sticky) + `SiteFooter`. Apply ca cho `(public)` va `(member)`
  layouts → feed co cung look voi public pages.
- **CategoryBar moi**: 8 items chinh + dropdown "Gioi thieu" 4 sub-items
  (Ban lanh dao, Hoi vien, Van ban phap ly, Dieu le) + 2 auth CTAs (Dang nhap
  outlined + Dang ky amber) cho guest. Sticky top-0. Active highlight via
  `usePathname` + prefix match.
- **UserMenu session-aware**: `variant="light"` ở masthead cho logged-in user —
  avatar 56-64px bang logo Hoi + ten truoc avatar font-black match H1.
- **Article detail V2** (`/tin-tuc/[slug]`, `/nghien-cuu/[slug]`): Merriweather
  serif H1, sapo bold prefix "VAWA - ", byline single-line, 2-col + sticky
  sidebar, `ArticleToolbar` dọc ben trai (share/comment/print/zoom), shared
  `SidebarList` component (Tin noi bat + Moi dang).
- **Article list V2** (`/tin-tuc`, `/nghien-cuu`): hero ngang (image-left +
  text-right) + 3 sub-hero grid + lazy-load 10 items/batch qua server action +
  `IntersectionObserver`. Mobile DOM order: Hero → Aside → Latest. KHONG
  pagination URL.
- **Perf wins**: `unstable_cache` cho default list variants (5-10 min tuy page),
  Suspense stream sidebar, Merriweather tải chi 1 weight, remove DOMPurify khoi
  client bundle (sanitize-on-save đã đủ).
- **Feed updates**: Filter chips moved ABOVE editor, remove "Tat ca"/"Chung
  nhan" → chi NEWS + PRODUCT, default = NEWS. PRODUCT mode editor hien form
  (ten/danh muc select/gia/tieu de/noi dung). Like/comment/share icon-only.
  Fix optimistic post status để badge "Cho duyet" hien dung.
- **CTA "Nop don chung nhan"**: reloc tu cuoi trang len top banner giua filter
  + grid o `/san-pham-chung-nhan` (above-the-fold visibility).
- **5 trang Gioi thieu + submenu** cleanup chrome (bo brand-800 banner + beige
  wash + white card) + cache hot queries (leaders, members, documents,
  siteConfig) 10-30 phut.
- **unstable_cache Date pattern**: new `normalizeDate(d: Date | string | null)`
  pattern cho tat ca consumer sau cache read → tranh `TypeError:
  .toLocaleDateString is not a function`.

## Changelog 3.2 (Dieu le integration)

- **Dieu le Hoi**: 3 hang hoi vien (OFFICIAL / AFFILIATE / HONORARY) + fees dung voi Dieu le (1-2tr nien lien thay 5-10tr)
- **Don ket nap workflow**: `/ket-nap` (user) + `/admin/hoi-vien/don-ket-nap` (admin) + `MembershipApplication` model + email notifications
- **Van ban phap quy**: `/phap-ly` public (3 tabs) + `/admin/phap-ly` admin CRUD + 8 PDF da import
- **Menu restructure**: Public menu moi (Trang chu / Tin tuc / Nghien cuu / Doanh nghiep / San pham / Quyen loi)
- **Navbar mode detection**: theo pathname (khong theo role) — VIP/ADMIN tren trang cong khai thay menu public
- **TipTap v3 editor**: Drag-resize image voi React NodeView, text-align, sticky toolbar, queueMicrotask pattern fix flushSync
- **Content import**: 7 bai nghien cuu + 48 bai tin tuc tu trang cu, images tu dong migrate Cloudinary
- **AgarwoodPlaceholder** component: fallback 🌿 icon thong nhat cho moi ảnh/avatar thieu
