# Functional QA Testing — Hoi Tram Huong Viet Nam

## Tong quan
- 8 nhom test flow
- 132 test case (103 active + 29 spec cho Phase 6)
- 3 role can test: Guest/Khach, Tai khoan co ban, Hoi vien, Admin

## Tai khoan test (sau khi `npx prisma db seed`)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hoitramhuong.vn | Demo@123 |
| Hoi vien ★★★ Vang | binhnv@hoitramhuong.vn | Demo@123 |
| Hoi vien ★★★ Vang | levanminh@tramhuongquangnam.vn | Demo@123 |
| Hoi vien ★★ Bac | nguyenthilan@tinhdautramhuong.vn | Demo@123 |
| Hoi vien ★★ Bac | phamducthang@nhangthom.vn | Demo@123 |
| Hoi vien ★ | dangvantuan@tramhuongdaknong.vn | Demo@123 |
| GUEST | (dang ky moi tai /dang-ky — kich hoat ngay) | (do user dat) |

## Danh sach file test

| # | File | So TC | Muc do | Phase |
|---|------|-------|--------|-------|
| 01 | [01-flow-thanh-toan.md](01-flow-thanh-toan.md) | 8 | Cao | — |
| 02 | [02-flow-chung-nhan.md](02-flow-chung-nhan.md) | 9 | Cao | — |
| 03 | [03-flow-phan-quyen.md](03-flow-phan-quyen.md) | 22 | Cao | Update Phase 2+5 |
| 04 | [04-flow-feed.md](04-flow-feed.md) | 13 | Trung binh | Update Phase 2 |
| 05 | [05-flow-email.md](05-flow-email.md) | 10 | Trung binh | — |
| 06 | [06-flow-khac.md](06-flow-khac.md) | 13 | Trung binh | — |
| **07** | **[07-flow-tieu-bieu.md](07-flow-tieu-bieu.md)** | **25** | **Cao** | **Phase 4 — moi** |
| **08** | **[08-flow-banner-quang-cao.md](08-flow-banner-quang-cao.md)** | **29** | **SPEC** | **Phase 6 — chua impl** |

## Cach chay test
1. Chay `npm run dev` de khoi dong dev server
2. Dam bao DB local co seed data (`npx prisma db seed`)
3. Mo tung file test theo thu tu 01 -> 06
4. Danh dau PASS/FAIL cho tung test case
5. Ghi chu loi gap phai vao cuoi moi file

## Thu tu uu tien
1. Flow Phan quyen (03) — chay dau tien vi anh huong tat ca flow khac
2. Flow Thanh toan (01) — core business
3. Flow Chung nhan (02) — core business
4. Flow Tieu bieu (07) — moi (Phase 4) — test seed data va admin pin
5. Flow Feed (04) — feature chinh, co quota va category
6. Flow Email (05) — xac nhan email hoat dong
7. Flow Khac (06) — cac tinh nang phu
8. Flow Banner (08) — **SKIP** cho den khi Phase 6 implement

## Demo Flow Tests (E2E + Video)

Ngoai 60 test case thu cong, du an co 2 test suite Playwright chay tu dong va ghi video:

| File | Doi tuong | So buoc | Muc dich |
|------|----------|---------|---------|
| `e2e/vip-demo-flow.spec.ts` | Hoi vien | 16 | Demo toan bo flow hoi vien |
| `e2e/admin-demo-flow.spec.ts` | Admin | 12 | Demo toan bo flow quan tri |

- Seed data tu dau, chay tuan tu, du lieu xuyensuot
- Video output: `e2e/test-results/` (file `.webm`)
- Dung de demo san pham, luu tru huong dan su dung
- Xem chi tiet: [documents/testing/demo-flow/README.md](../demo-flow/README.md)

## Luu y
- Reset DB ve seed data truoc moi lan test: `npx prisma db seed`
- Mot so TC can chinh DB truc tiep (vd: doi createdAt de test alert 24h)
- Email test can cau hinh Resend API key thuc (hoac dung Resend sandbox)
- **Phase 4** — sau khi seed, da co san:
  - 3 doanh nghiep featured (Khanh Hoa #1, Quang Nam #2, Sai Gon #3)
  - 5 san pham featured (theo featuredOrder 1-5)
  - 3 san pham vua dang ky (DRAFT, createdAt 2-36 gio truoc)
- **Phase 6** (08-flow-banner) la SPEC document — chua co code, chua chay duoc
