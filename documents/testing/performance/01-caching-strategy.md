# Performance Test — Caching Strategy

## Ket qua audit code

### Revalidate values (da kiem tra + fix)
| Trang | revalidate | Ly do |
|-------|-----------|-------|
| / (trang chu) | 3600 (1h) | Static content, it thay doi |
| /tin-tuc | 3600 | Listing tin tuc, cache 1h |
| /tin-tuc/[slug] | 1800 (30m) | Chi tiet tin, **da fix** (truoc: khong co) |
| /san-pham-chung-nhan | 3600 | Listing SP, cache 1h |
| /san-pham/[slug] | 3600 | Chi tiet SP, **da fix** (truoc: khong co) |
| /doanh-nghiep/[slug] | 3600 | Profile DN, **da fix** (truoc: khong co) |
| /hoi-vien | 3600 | Danh sach hoi vien |
| /feed | 0 (realtime) | Feed can moi nhat |
| /tong-quan | 0 | Dashboard VIP can realtime |
| /ho-so | 0 | Profile ca nhan |
| /gia-han | 0 | Trang thai membership |
| /thanh-toan/lich-su | 0 | Lich su payment |
| /admin | 60 | Alert panel refresh 60s |
| /admin/* | 0 | Tat ca trang admin can realtime |

## Kich ban kiem tra

### TC-PERF-CACHE-01: Trang chu cache 1 gio
1. Truy cap / -> ghi nhan response header
2. **Kiem tra**: Header `Cache-Control` hoac `x-nextjs-cache` cho thay ISR
3. Doi 5 giay -> truy cap lai
4. **Kiem tra**: Response tra ve tu cache (nhanh hon)
5. Thay doi data trong DB -> truy cap lai ngay
6. **Kiem tra**: Van hien data cu (cache chua het han)

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

## Ket qua
- [ ] TC-PERF-CACHE-01: PASS / FAIL
- [ ] TC-PERF-CACHE-02: PASS / FAIL
- [ ] TC-PERF-CACHE-03: PASS / FAIL
- [ ] TC-PERF-CACHE-04: PASS / FAIL
- [ ] TC-PERF-CACHE-05: PASS / FAIL
