# Performance Test — Caching Strategy

## Ket qua audit code

### Revalidate values (da kiem tra + fix)
| Trang | revalidate | Ly do |
|-------|-----------|-------|
| / (trang chu) | 300 (5m) | Page-level revalidate; moi section dung `unstable_cache` (300-600s) tagged `homepage` -> cron warm |
| /tin-tuc | 3600 | Listing tin tuc, cache 1h |
| /tin-tuc/[slug] | 1800 (30m) | Chi tiet tin, **da fix** (truoc: khong co) |
| /san-pham-chung-nhan | 3600 | Listing SP, cache 1h |
| /san-pham/[slug] | 3600 | Chi tiet SP, **da fix** (truoc: khong co) |
| /doanh-nghiep/[slug] | 3600 | Profile DN, **da fix** (truoc: khong co) |
| /hoi-vien | 3600 | Danh sach hoi vien |
| /feed | 60 | Feed page cache 1m, sidebar banner stream rieng qua Suspense |
| /tong-quan | 0 | Dashboard VIP can realtime |
| /ho-so | 0 | Profile ca nhan |
| /gia-han | 0 | Trang thai membership |
| /thanh-toan/lich-su | 0 | Lich su payment |
| /admin | 60 | Alert panel refresh 60s |
| /admin/* | 0 | Tat ca trang admin can realtime |

### Cron warm-homepage (Hobby/Pro)
- File: `app/api/cron/warm-homepage/route.ts`, schedule trong `vercel.json`
- Hobby (free): `0 23 * * *` UTC = 06:00 VN, daily — warm truoc peak sang
- Pro (upgrade): doi sang `*/5 * * * *` de warm mooi 5 phut
- Logic: `revalidateTag("homepage", "max")` -> Promise.all goi 5 fetcher chinh trong `lib/homepage.ts`
- Auth: `Bearer ${CRON_SECRET}` (Vercel Cron tu gui)

## Kich ban kiem tra

### TC-PERF-CACHE-01: Trang chu cache 5 phut + section unstable_cache
1. Truy cap / -> ghi nhan response header
2. **Kiem tra**: Header `Cache-Control` hoac `x-nextjs-cache` cho thay ISR (page-level revalidate=300)
3. Doi 5 giay -> truy cap lai
4. **Kiem tra**: Response tra ve tu cache (nhanh hon)
5. Thay doi data trong DB -> truy cap lai ngay
6. **Kiem tra**: Van hien data cu (cache chua het han 5 phut hoac section TTL 300-600s)
7. **Kiem tra**: Tung section (Tin Hoi, Ban tin hoi vien, San pham chung nhan, ...) load qua Suspense + skeleton, HTML dau flush nhanh

### TC-PERF-CACHE-CRON: Cron warm-homepage
1. (Sau khi deploy) Vercel dashboard -> Crons -> kiem tra `warm-homepage` chay daily 06:00 VN
2. Goi tay endpoint: `curl -H "Authorization: Bearer $CRON_SECRET" https://[domain]/api/cron/warm-homepage`
3. **Kiem tra**: Response `{ warmed: true, sections: 5, elapsedMs: 100-300 }`
4. **Kiem tra**: Lan tiep theo vao trang chu sau cron tick -> TTFB warm (~20ms thay vi cold ~350ms)

### TC-PERF-CACHE-02: Feed khong cache (revalidate=0)
1. Truy cap /feed
2. **Kiem tra**: Moi request deu fetch DB moi (khong cache)
3. VIP dang bai moi
4. Reload /feed -> **Kiem tra**: Bai moi hien ngay

### TC-PERF-CACHE-03: Admin dashboard refresh 60s
1. Login Admin -> /admin
2. Tao 1 payment PENDING moi
3. Doi 60 giay -> reload /admin
4. **Kiem tra**: Alert panel hien payment moi
5. **Kiem tra**: KPI cards cap nhat

### TC-PERF-CACHE-04: Trang tin tuc chi tiet cache 30 phut
1. Truy cap /tin-tuc/[slug]
2. Admin sua noi dung tin tuc
3. Truy cap lai ngay -> **Kiem tra**: Van hien noi dung cu
4. Doi 30 phut (hoac goi revalidatePath) -> **Kiem tra**: Hien noi dung moi

### TC-PERF-CACHE-05: revalidatePath khi admin sua cai dat
1. Admin -> /admin/cai-dat -> doi phi membership
2. Click Luu
3. Truy cap /gia-han ngay
4. **Kiem tra**: Phi moi hien thi ngay (revalidatePath da duoc goi)

### TC-PERF-CACHE-06: revalidateTag("footer") + ("site-config") khi doi footer
1. Admin -> /admin/cai-dat -> nhom "Footer website" -> doi `footer_brand_desc`
2. Click Luu
3. Refresh bat ky trang cong khai
4. **Kiem tra**: Footer hien noi dung moi ngay (khong can doi TTL)
5. **Ly do**: API `/api/admin/settings` goi `revalidateTag("footer", "max")` +
   `revalidateTag("site-config", "max")` sau khi upsert thanh cong
6. Pattern nay dung chung cho moi key co tag `footer` trong `unstable_cache`

## Ket qua
- [ ] TC-PERF-CACHE-01: PASS / FAIL
- [ ] TC-PERF-CACHE-02: PASS / FAIL
- [ ] TC-PERF-CACHE-03: PASS / FAIL
- [ ] TC-PERF-CACHE-04: PASS / FAIL
- [ ] TC-PERF-CACHE-05: PASS / FAIL
- [ ] TC-PERF-CACHE-06: PASS / FAIL
- [ ] TC-PERF-CACHE-CRON: PASS / FAIL
