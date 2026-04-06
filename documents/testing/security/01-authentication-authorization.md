# Security Audit — Authentication & Authorization

## Ket qua audit code (da kiem tra)
- AUTH_SECRET: PASS (43 chars, .env.local)
- JWT maxAge: PASS (da fix: 30 ngay explicit)
- 9/9 API routes co auth check: PASS
- 4/4 Server Actions co session check: PASS
- UserId khong expose trong URL: PASS
- .env trong .gitignore: PASS

## Kich ban kiem tra thu cong

### TC-SEC-AUTH-01: AUTH_SECRET du manh
1. Mo .env.local -> kiem tra AUTH_SECRET
2. **Kiem tra**: Chuoi > 32 ky tu
3. **Kiem tra**: Khong phai gia tri mac dinh cua NextAuth
4. **Kiem tra**: Khong trung voi bat ky secret nao khac

### TC-SEC-AUTH-02: JWT token expire dung
1. Login VIP -> kiem tra cookie next-auth.session-token
2. Decode JWT (jwt.io) -> kiem tra exp field
3. **Kiem tra**: Token het han sau 30 ngay (khong phai vo han)

### TC-SEC-AUTH-03: API routes kiem tra role server-side
1. Dung curl/Postman goi truc tiep (khong qua UI):
   ```
   POST /api/admin/users (khong co session cookie)
   ```
2. **Kiem tra**: Tra ve 401/403 (khong phai 500)
3. Goi voi cookie VIP:
   ```
   POST /api/admin/users (voi session cookie VIP)
   ```
4. **Kiem tra**: Tra ve 403 "Forbidden"

### TC-SEC-AUTH-04: Server Actions kiem tra session
1. Mo DevTools -> Console -> goi server action truc tiep:
   ```js
   // Co gang goi updateProfile khong co session
   ```
2. **Kiem tra**: Tra ve { error: "Chua dang nhap" }

### TC-SEC-AUTH-05: Khong expose userId trong URL public
1. Xem source HTML cua cac trang public
2. **Kiem tra**: Khong co userId (cuid) trong HTML/URL
3. **Kiem tra**: Chi dung slug cho URL cong khai

### TC-SEC-AUTH-06: Double-check role sau middleware
1. Dung DevTools thay doi role trong cookie/localStorage
2. Truy cap /admin
3. **Kiem tra**: Van bi redirect vi middleware check JWT server-side
4. **Kiem tra**: Server component cung check role (defense in depth)

### TC-SEC-AUTH-07: Inactive user khong login duoc
1. Admin vo hieu hoa 1 VIP (isActive = false)
2. VIP co dang nhap
3. **Kiem tra**: Login that bai (authorize return null khi isActive=false)
4. **Kiem tra**: Thong bao loi chung (khong tiet lo "tai khoan bi khoa")

### TC-SEC-AUTH-08: Membership het han -> block dung route
1. Login VIP co membership het han
2. Truy cap /feed -> **Kiem tra**: OK (feed la public)
3. Truy cap /feed/tao-bai -> **Kiem tra**: Redirect /membership-expired
4. Truy cap /gia-han -> **Kiem tra**: Redirect /membership-expired
5. Truy cap /chung-nhan/nop-don -> **Kiem tra**: Redirect /membership-expired

## Ket qua
- [ ] TC-SEC-AUTH-01: PASS / FAIL
- [ ] TC-SEC-AUTH-02: PASS / FAIL
- [ ] TC-SEC-AUTH-03: PASS / FAIL
- [ ] TC-SEC-AUTH-04: PASS / FAIL
- [ ] TC-SEC-AUTH-05: PASS / FAIL
- [ ] TC-SEC-AUTH-06: PASS / FAIL
- [ ] TC-SEC-AUTH-07: PASS / FAIL
- [ ] TC-SEC-AUTH-08: PASS / FAIL
