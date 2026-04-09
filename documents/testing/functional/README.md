# Functional QA Testing — Hoi Tram Huong Viet Nam

## Tong quan
- 6 nhom test flow
- 65 test case
- 3 role can test: Guest, VIP, Admin

## Tai khoan test
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hoi-tram-huong.vn | 123456 |
| VIP A | nguyen.van.a@tramhuong-hn.vn | 123456 |
| VIP B | tran.thi.b@tramhuong-hcm.vn | 123456 |
| VIP C | le.van.c@tramhuong-dn.vn | 123456 |

## Danh sach file test

| # | File | So TC | Muc do |
|---|------|-------|--------|
| 01 | [01-flow-thanh-toan.md](01-flow-thanh-toan.md) | 8 | Cao |
| 02 | [02-flow-chung-nhan.md](02-flow-chung-nhan.md) | 9 | Cao |
| 03 | [03-flow-phan-quyen.md](03-flow-phan-quyen.md) | 14 | Cao |
| 04 | [04-flow-feed.md](04-flow-feed.md) | 11 | Trung binh |
| 05 | [05-flow-email.md](05-flow-email.md) | 10 | Trung binh |
| 06 | [06-flow-khac.md](06-flow-khac.md) | 13 | Trung binh |

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
4. Flow Feed (04) — feature chinh
5. Flow Email (05) — xac nhan email hoat dong
6. Flow Khac (06) — cac tinh nang phu

## Demo Flow Tests (E2E + Video)

Ngoai 60 test case thu cong, du an co 2 test suite Playwright chay tu dong va ghi video:

| File | Doi tuong | So buoc | Muc dich |
|------|----------|---------|---------|
| `e2e/vip-demo-flow.spec.ts` | VIP | 16 | Demo toan bo flow hoi vien |
| `e2e/admin-demo-flow.spec.ts` | Admin | 12 | Demo toan bo flow quan tri |

- Seed data tu dau, chay tuan tu, du lieu xuyensuot
- Video output: `e2e/test-results/` (file `.webm`)
- Dung de demo san pham, luu tru huong dan su dung
- Xem chi tiet: [documents/testing/demo-flow/README.md](../demo-flow/README.md)

## Luu y
- Reset mat khau ve 123456 truoc moi lan test: chay script reset password
- Mot so TC can chinh DB truc tiep (vd: doi createdAt de test alert 24h)
- Email test can cau hinh Resend API key thuc (hoac dung Resend sandbox)
