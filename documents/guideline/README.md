# Tai lieu Du an — Hoi Tram Huong Viet Nam

> Phien ban hien tai: **3.2** — 04/2026
> Phase 1-6 + Dieu le integration + Van ban phap quy + TipTap editor enhancements

## Danh sach tai lieu

| # | File | Doi tuong | Noi dung |
|---|------|----------|---------|
| 01 | [Huong dan Admin](01-huong-dan-admin.md) | Ban quan tri | Van hanh hang ngay + Van ban phap quy + Don ket nap + Che do xem |
| 02 | [Huong dan VIP](02-huong-dan-vip.md) | Hoi vien | Dang nhap, ho so, dang bai, chung nhan, gia han, don ket nap Hoi vien chinh thuc |
| 03 | [Business Document](03-business-document.md) | Ca 2 ben | Quy trinh, fees theo Dieu le, phan hang hoi vien, SLA, Van ban phap quy |
| 04 | [Technical Document](04-technical-document.md) | Developer | Codebase, ERD moi (MemberCategory, NewsCategory), Tiptap v3, Navbar mode, Import scripts |
| 05 | [Architecture Decisions](05-architecture-decisions.md) | Developer | 20 ADR — them ADR-017~020 (Navbar mode, TipTap flushSync, NodeView, Import scripts) |
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
| Khi co tranh chap | 03 (muc 4, 9) |
| Khi tich hop mobile/3rd party | 06 |
| Khi can demo san pham / quay video | 07 |

## Changelog gan nhat (3.2 — Dieu le integration)

- **Dieu le Hoi**: 3 hang hoi vien (OFFICIAL / AFFILIATE / HONORARY) + fees dung voi Dieu le (1-2tr nien lien thay 5-10tr)
- **Don ket nap workflow**: `/ket-nap` (user) + `/admin/hoi-vien/don-ket-nap` (admin) + `MembershipApplication` model + email notifications
- **Van ban phap quy**: `/phap-ly` public (3 tabs) + `/admin/phap-ly` admin CRUD + 8 PDF da import
- **Menu restructure**: Public menu moi (Trang chu / Tin tuc / Nghien cuu / Doanh nghiep / San pham / Quyen loi)
- **Navbar mode detection**: theo pathname (khong theo role) — VIP/ADMIN tren trang cong khai thay menu public
- **TipTap v3 editor**: Drag-resize image voi React NodeView, text-align, sticky toolbar, queueMicrotask pattern fix flushSync
- **Content import**: 7 bai nghien cuu + 48 bai tin tuc tu trang cu, images tu dong migrate Cloudinary
- **AgarwoodPlaceholder** component: fallback 🌿 icon thong nhat cho moi ảnh/avatar thieu
