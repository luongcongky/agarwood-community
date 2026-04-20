# Performance Test — Database Queries

## Ket qua audit code

### Promise.all (parallel queries)
| File | Status |
|------|--------|
| app/(member)/feed/page.tsx | PASS — Promise.all cho posts + sidebar (banner Suspense rieng) |
| app/(admin)/admin/page.tsx | PASS — Promise.all cho 37 queries |
| app/(member)/ho-so/page.tsx | PASS — Promise.all cho user + memberships |
| app/(member)/tong-quan/page.tsx | PASS — Promise.all cho 5 queries |
| app/(admin)/admin/hoi-vien/page.tsx | PASS — Promise.all cho members + counts |
| app/api/posts/route.ts (POST) | PASS — **da fix**: 1 user fetch + Promise.all([postCount, productCount, slugConflict, company]) thay vi 5-10 query tuan tu |

### Select chi field can thiet
| File | Status | Chi tiet |
|------|--------|---------|
| app/api/posts/route.ts | PASS | include author voi select cu the |
| app/(admin)/admin/hoi-vien/page.tsx | PASS | select 10 fields, khong select * |
| app/(member)/feed/page.tsx | PASS | author select 5 fields |

### Prisma indexes (da fix)
| Model | Field | Status |
|-------|-------|--------|
| Post | authorPriority + createdAt | PASS (composite index) |
| Post | createdAt | PASS |
| Post | status | PASS |
| Payment | status | PASS |
| Payment | userId | PASS |
| Payment | createdAt | PASS (**da fix** — truoc: MISSING) |
| User | role | PASS |
| User | contributionTotal | PASS |
| Certification | status | PASS |
| Certification | applicantId | PASS |
| News | (isPublished, isPinned, publishedAt) | PASS (**da them** — homepage news carousel query) |
| Banner | (status, position, startDate, endDate) | PASS (**da them** — covers full date-window filter cho TOP/MID/SIDEBAR) |

### Migration history baseline (db_push drift fix)
- File: `prisma/migrations/20260416200000_baseline_db_push_drift/`, `20260416300000_baseline_db_push_drift_part2/`
- Ly do: 5 table (`leaders`, `partners`, `surveys`, `survey_responses`, `consultation_requests`) + 5 enum + cot `banners.position` + index `banners(status,position,endDate)` + cot `products.postId` truoc day duoc tao qua `prisma db push` (khong qua migration)
- Hau qua: shadow DB cua `prisma migrate dev` rebuild thieu cac doi tuong nay -> migration sau (i18n columns) fail
- Fix: 2 baseline migration idempotent (CREATE TABLE IF NOT EXISTS + DO/EXCEPTION blocks). Marked applied bang `prisma migrate resolve --applied <name>` tren ca local va prod (khi deploy)

## Kich ban kiem tra

### TC-PERF-DB-01: Feed query khong N+1
1. Bat Prisma query log: DATABASE_URL voi ?log=query
2. Truy cap /feed
3. **Kiem tra**: Chi co 1-3 queries (khong phai N queries cho N posts)
4. **Kiem tra**: Query dung index (authorPriority, createdAt)

### TC-PERF-DB-02: Admin dashboard query parallel
1. Bat Prisma query log
2. Truy cap /admin
3. **Kiem tra**: Queries chay song song (Promise.all), khong tuan tu
4. **Kiem tra**: Tong thoi gian < 2 giay (du co nhieu queries)

### TC-PERF-DB-03: Pagination dung skip/take (khong fetch all)
1. Tao 50+ bai viet (hoac seed data)
2. Truy cap /feed -> scroll xuong
3. **Kiem tra**: API goi /api/posts?cursor=xxx (cursor pagination)
4. **Kiem tra**: Moi request chi fetch **10 records** (giam tu 20 -> 10 de TTFB nhanh hon)

### TC-PERF-DB-POST: POST /api/posts query parallel
1. Bat Prisma query log
2. Login Hoi vien -> POST 1 bai (loai PRODUCT) qua /feed/tao-bai
3. **Kiem tra**: Sau auth(), chi co 1 batch parallel queries (user + postCount + productCount + slugConflict + company), KHONG tuan tu
4. **Kiem tra**: Khong co query `user.findUnique` lap 2-3 lan (truoc khi fix co duplicate)
5. **Kiem tra**: Tong server time (sau auth) ~50-150ms thay vi ~150-300ms

### TC-PERF-DB-04: Admin hoi vien pagination
1. Truy cap /admin/hoi-vien
2. **Kiem tra**: Chi fetch 20 records (PAGE_SIZE)
3. Click trang 2
4. **Kiem tra**: Fetch 20 records tiep theo

### TC-PERF-DB-05: Connection pooling
1. Kiem tra lib/prisma.ts
2. **Kiem tra**: Pool max: 20 connections
3. **Kiem tra**: Singleton pattern (khong tao connection moi moi request)

## Ket qua
- [ ] TC-PERF-DB-01: PASS / FAIL
- [ ] TC-PERF-DB-02: PASS / FAIL
- [ ] TC-PERF-DB-03: PASS / FAIL
- [ ] TC-PERF-DB-04: PASS / FAIL
- [ ] TC-PERF-DB-05: PASS / FAIL
- [ ] TC-PERF-DB-POST: PASS / FAIL
