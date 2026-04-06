# Security Audit — Rate Limiting & Abuse Prevention

## Ket qua audit code (da kiem tra)
- Post anti-spam: PASS (3 bai/ngay, app/api/posts/route.ts)
- Payment idempotency: PASS (khong cho tao 2 PENDING payment, app/api/membership/renew/route.ts)
- Cert duplicate check: PASS (khong cho nop don trung SP, app/api/certification/create-order/route.ts)
- Report 1 lan/user/post: PASS (@@unique constraint + check truoc khi tao)
- Login rate limit: CHUA CO (NextAuth khong co built-in, can middleware)
- Upload rate limit: CHUA CO (can them)
- Form submit rate limit: CHUA CO (can them cho /dich-vu)

## Kich ban kiem tra thu cong

### TC-SEC-RATE-01: Post anti-spam 3 bai/ngay
1. Login VIP -> dang bai 1, 2, 3 -> tat ca thanh cong
2. Dang bai 4
3. **Kiem tra**: Server tra 429 "Ban da dang 3 bai hom nay. Hen gap lai ban vao ngay mai nhe!"
4. **Kiem tra**: Tone than thien, khong phai loi he thong

### TC-SEC-RATE-02: Payment idempotency
1. Login VIP -> /gia-han -> tao payment
2. Mo tab moi -> /gia-han -> co tao payment lan 2
3. **Kiem tra**: Server tra 409 "Ban dang co yeu cau cho xac nhan"
4. **Kiem tra**: Chi co 1 record PENDING trong DB

### TC-SEC-RATE-03: Cert duplicate check
1. Login VIP -> /chung-nhan/nop-don -> nop don cho SP A
2. Co nop don lai cho SP A (dang PENDING)
3. **Kiem tra**: Server tra 409 "San pham nay dang co don dang xu ly"

### TC-SEC-RATE-04: Report chi 1 lan/user/post
1. Login VIP A -> report bai cua VIP B
2. **Kiem tra**: Thanh cong "Da gui bao cao"
3. Report lai cung bai do
4. **Kiem tra**: Server tra 409 "Ban da bao cao bai viet nay roi"

### TC-SEC-RATE-05: Auto-lock post khi 5+ report
1. Login 5 VIP khac nhau, moi nguoi report cung 1 bai
2. **Kiem tra**: Sau report thu 5, post.status chuyen thanh LOCKED
3. **Kiem tra**: post.lockReason = "Tu dong khoa do nhan 5+ bao cao"

### TC-SEC-RATE-06: Login brute force
1. Thu login sai 10 lan lien tiep voi cung email
2. **Kiem tra**: He thong van cho login (chua co rate limit)
3. **Luu y**: Day la diem can cai thien — nen them rate limit 5 lan/15 phut
4. **Recommendation**: Them middleware rate limit cho /api/auth/callback/credentials

### TC-SEC-RATE-07: Upload abuse
1. Login VIP -> upload lien tiep 20 anh trong 1 phut
2. **Kiem tra**: He thong van cho upload (chua co rate limit)
3. **Luu y**: Cloudinary co quota rieng, nhung nen them rate limit
4. **Recommendation**: Them rate limit 10 upload/phut/user

### TC-SEC-RATE-08: Form submit dich vu truyen thong
1. Khong dang nhap -> /dich-vu -> submit form 10 lan lien tiep
2. **Kiem tra**: He thong tao 10 don rieng biet (chua co rate limit)
3. **Luu y**: Co the bi spam voi form public
4. **Recommendation**: Them rate limit theo IP hoac CAPTCHA

### TC-SEC-RATE-09: Disable nut submit sau khi click
1. VIP -> /gia-han -> click "Xem huong dan CK"
2. **Kiem tra**: Nut disabled ngay sau khi click (loading state)
3. VIP -> /chung-nhan/nop-don -> click "Toi da chuyen khoan"
4. **Kiem tra**: Nut disabled ngay sau khi click
5. **Kiem tra**: Double click nhanh khong tao 2 request

### TC-SEC-RATE-10: Admin routes chi tu internal
1. Thu truy cap API admin tu browser khong co session
2. **Kiem tra**: 401/403 response
3. Kiem tra CORS headers
4. **Kiem tra**: Admin API khong accessible tu domain khac (neu co CORS)

## Ket qua
- [ ] TC-SEC-RATE-01: PASS / FAIL
- [ ] TC-SEC-RATE-02: PASS / FAIL
- [ ] TC-SEC-RATE-03: PASS / FAIL
- [ ] TC-SEC-RATE-04: PASS / FAIL
- [ ] TC-SEC-RATE-05: PASS / FAIL
- [ ] TC-SEC-RATE-06: PASS / FAIL (known gap)
- [ ] TC-SEC-RATE-07: PASS / FAIL (known gap)
- [ ] TC-SEC-RATE-08: PASS / FAIL (known gap)
- [ ] TC-SEC-RATE-09: PASS / FAIL
- [ ] TC-SEC-RATE-10: PASS / FAIL

## Cac diem can cai thien (chua implement)
1. Login rate limit: 5 lan that bai / 15 phut / IP
2. Upload rate limit: 10 file / phut / user
3. Form dich vu: CAPTCHA hoac rate limit theo IP
4. Cron job endpoint: verify CRON_SECRET header
