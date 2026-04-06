# Security Audit — Input Validation & XSS

## Ket qua audit code (da kiem tra + fix)
- DOMPurify: DA CAI DAT (isomorphic-dompurify)
- Post content sanitize on save: PASS (app/api/posts/route.ts)
- Post content sanitize on render: PASS (FeedClient.tsx)
- News content sanitize on save: PASS (app/api/admin/news/route.ts)
- News content sanitize on render: PASS (tin-tuc/[slug]/page.tsx)
- News slug validation: PASS (regex /^[a-z0-9-]+$/)
- Product/Company slug validation: PASS (Zod regex trong server actions)
- File upload MIME check: PASS (server-side + Cloudinary)
- Search input SQL injection: PASS (Prisma parameterized queries)

## Kich ban kiem tra thu cong

### TC-SEC-XSS-01: TipTap content XSS — Post
1. Login VIP -> /feed/tao-bai
2. Trong editor, chuyen sang HTML mode (hoac inject qua DevTools)
3. Nhap noi dung:
   ```html
   <img src=x onerror="alert('XSS')">
   <script>alert('XSS')</script>
   Test content du 50 ky tu de qua validation lorem ipsum dolor sit amet
   ```
4. Submit bai viet
5. **Kiem tra**: Bai viet hien thi nhung KHONG co alert popup
6. **Kiem tra**: Tag <script> bi strip boi DOMPurify
7. **Kiem tra**: onerror attribute bi strip

### TC-SEC-XSS-02: TipTap content XSS — News (Admin)
1. Login Admin -> tao tin tuc moi
2. Nhap content co:
   ```html
   <img src=x onerror="document.location='https://evil.com'">
   ```
3. **Kiem tra**: Content bi sanitize khi luu vao DB
4. Xem tin tuc tren /tin-tuc/[slug]
5. **Kiem tra**: Khong co redirect, khong co script chay

### TC-SEC-XSS-03: XSS qua form input binh thuong
1. Dien ten cong ty: `<script>alert(1)</script>`
2. **Kiem tra**: Ten hien thi nhu text binh thuong (React tu dong escape)
3. Dien mo ta: `<img src=x onerror=alert(1)>`
4. **Kiem tra**: Mo ta hien thi nhu text (khong render HTML)
5. Luu y: Chi cac truong dung dangerouslySetInnerHTML moi can DOMPurify

### TC-SEC-XSS-04: File upload — chi nhan image
1. Login VIP -> upload anh san pham
2. Thu upload file .js doi duoi thanh .jpg
3. **Kiem tra**: Server tu choi (MIME type check)
4. Thu upload file .html
5. **Kiem tra**: Server tu choi
6. Thu upload file > 5MB
7. **Kiem tra**: Server tu choi voi thong bao ro rang

### TC-SEC-XSS-05: Slug injection
1. Login VIP -> tao san pham voi slug: `../../admin`
2. **Kiem tra**: Server tu choi (Zod regex chi cho a-z, 0-9, -)
3. Thu slug: `<script>alert(1)</script>`
4. **Kiem tra**: Server tu choi
5. Thu slug: `product-name-binh-thuong`
6. **Kiem tra**: Chap nhan

### TC-SEC-XSS-06: Search input injection
1. Admin -> /admin/hoi-vien -> search: `'; DROP TABLE users; --`
2. **Kiem tra**: Khong bi loi SQL injection (Prisma parameterized)
3. **Kiem tra**: Ket qua tra ve 0 (khong match)
4. Search: `<script>alert(1)</script>`
5. **Kiem tra**: Khong bi XSS (search text duoc escape trong UI)

### TC-SEC-XSS-07: API response khong leak data nhay cam
1. Goi GET /api/posts
2. **Kiem tra**: Response khong chua passwordHash
3. **Kiem tra**: Response khong chua email cua user khac (tru ten + avatar)
4. Goi GET /api/my-products
5. **Kiem tra**: Chi tra ve san pham cua user hien tai

### TC-SEC-XSS-08: Error message chung chung cho user
1. Login sai mat khau
2. **Kiem tra**: Thong bao "Email hoac mat khau khong chinh xac" (khong noi cu the email hay password sai)
3. Truy cap API admin khong co quyen
4. **Kiem tra**: Tra ve "Forbidden" (khong tiet lo chi tiet he thong)

## Ket qua
- [ ] TC-SEC-XSS-01: PASS / FAIL
- [ ] TC-SEC-XSS-02: PASS / FAIL
- [ ] TC-SEC-XSS-03: PASS / FAIL
- [ ] TC-SEC-XSS-04: PASS / FAIL
- [ ] TC-SEC-XSS-05: PASS / FAIL
- [ ] TC-SEC-XSS-06: PASS / FAIL
- [ ] TC-SEC-XSS-07: PASS / FAIL
- [ ] TC-SEC-XSS-08: PASS / FAIL
