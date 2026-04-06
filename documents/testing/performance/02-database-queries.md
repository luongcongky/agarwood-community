# Performance Test — Database Queries

## Ket qua audit code

### Promise.all (parallel queries)
| File | Status |
|------|--------|
| app/(member)/feed/page.tsx | PASS — Promise.all cho posts + sidebar |
| app/(admin)/admin/page.tsx | PASS — Promise.all cho 37 queries |
| app/(member)/ho-so/page.tsx | PASS — Promise.all cho user + memberships |
| app/(member)/tong-quan/page.tsx | PASS — Promise.all cho 5 queries |
| app/(admin)/admin/hoi-vien/page.tsx | PASS — Promise.all cho members + counts |

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
4. **Kiem tra**: Moi request chi fetch 20 records

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
