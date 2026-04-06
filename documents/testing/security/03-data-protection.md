# Security Audit — Data Protection

## Ket qua audit code (da kiem tra)
- Password hash: PASS (bcryptjs cost 12, khong MD5/SHA1)
- So TK ngan hang: PASS (khong log ra console, khong hien trong error)
- .env khong commit: PASS (.gitignore co .env*)
- Slug/cuid trong URL: PASS (khong expose raw userId)

## Kich ban kiem tra thu cong

### TC-SEC-DATA-01: Password hash bang bcrypt cost >= 12
1. Kiem tra DB: SELECT "passwordHash" FROM users LIMIT 1
2. **Kiem tra**: Hash bat dau bang "$2b$12$" (bcrypt cost 12)
3. **Kiem tra**: KHONG phai MD5 (32 hex chars) hoac SHA1 (40 hex chars)

### TC-SEC-DATA-02: So TK ngan hang khong leak
1. Xem network tab khi load /ho-so (tab Ngan hang)
2. **Kiem tra**: So TK chi hien trong response cua chinh minh
3. Xem /admin/hoi-vien/[id] (tab Thanh toan)
4. **Kiem tra**: So TK hien cho admin (hop le)
5. Xem /doanh-nghiep/[slug] (public page)
6. **Kiem tra**: So TK KHONG hien tren trang public
7. **Kiem tra**: Console.log khong in ra so TK

### TC-SEC-DATA-03: .env khong commit len GitHub
1. Chay: git log --all --full-history -- .env .env.local
2. **Kiem tra**: Khong co commit nao chua .env
3. Kiem tra .gitignore co dong .env*

### TC-SEC-DATA-04: API response khong tra ve passwordHash
1. Goi GET /api/posts -> xem response
2. **Kiem tra**: author object khong co passwordHash
3. Goi GET /api/my-products -> xem response
4. **Kiem tra**: Khong co truong nhay cam
5. Xem Prisma queries trong code -> tat ca deu dung `select` (khong select *)

### TC-SEC-DATA-05: Session token bao mat
1. Xem cookie next-auth.session-token
2. **Kiem tra**: Cookie co flag HttpOnly (khong doc duoc bang JS)
3. **Kiem tra**: Cookie co flag SameSite (chong CSRF)
4. **Kiem tra**: Cookie co flag Secure (chi gui qua HTTPS) — chi check production

### TC-SEC-DATA-06: Cloudinary URL khong leak private data
1. Xem URL anh san pham tren trang public
2. **Kiem tra**: URL chi chua public Cloudinary path
3. **Kiem tra**: KHONG chua API key hoac secret trong URL

### TC-SEC-DATA-07: Error message khong leak stack trace
1. Goi API voi data sai format:
   ```
   POST /api/posts { content: 123 }
   ```
2. **Kiem tra**: Response la JSON error message ngan gon
3. **Kiem tra**: KHONG chua stack trace, file path, hoac internal error

### TC-SEC-DATA-08: DB connection string an toan
1. Xem .env.local -> DATABASE_URL
2. **Kiem tra**: Khong chua trong bat ky file nao ngoai .env*
3. **Kiem tra**: Prisma client dung connection pooling (max: 20)
4. **Kiem tra**: SSL chi bat khi production + non-localhost

## Ket qua
- [ ] TC-SEC-DATA-01: PASS / FAIL
- [ ] TC-SEC-DATA-02: PASS / FAIL
- [ ] TC-SEC-DATA-03: PASS / FAIL
- [ ] TC-SEC-DATA-04: PASS / FAIL
- [ ] TC-SEC-DATA-05: PASS / FAIL
- [ ] TC-SEC-DATA-06: PASS / FAIL
- [ ] TC-SEC-DATA-07: PASS / FAIL
- [ ] TC-SEC-DATA-08: PASS / FAIL
