# Security Audit — Hoi Tram Huong Viet Nam

## Tong quan
- 4 nhom kiem tra
- 34 test case
- Ngay audit: 2026-04-06

## Ket qua audit code tu dong

### Loi da fix trong qua trinh audit
| # | Van de | File | Fix |
|---|--------|------|-----|
| 1 | JWT khong co maxAge explicit | lib/auth.config.ts | Them maxAge: 30 ngay |
| 2 | XSS: Post content khong sanitize khi luu | app/api/posts/route.ts | Them DOMPurify.sanitize() |
| 3 | XSS: Post content khong sanitize khi render | FeedClient.tsx | Them DOMPurify.sanitize() |
| 4 | XSS: News content khong sanitize khi luu | app/api/admin/news/route.ts | Them DOMPurify.sanitize() |
| 5 | XSS: News content khong sanitize khi render | tin-tuc/[slug]/page.tsx | Them DOMPurify.sanitize() |
| 6 | News slug khong validate format | app/api/admin/news/route.ts | Them regex check |

### Known gaps (chua fix, priority thap)
| # | Van de | Risk | Recommendation |
|---|--------|------|----------------|
| 1 | Login khong co rate limit | Medium | Them middleware 5 lan/15 phut |
| 2 | Upload khong co rate limit | Low | Them 10 file/phut/user |
| 3 | Form dich vu public khong co CAPTCHA | Low | Them reCAPTCHA hoac rate limit IP |
| 4 | Mot so API route thieu Zod validation | Low | Them Zod cho tat ca POST/PATCH |

## Danh sach file test

| # | File | So TC | Focus |
|---|------|-------|-------|
| 01 | [01-authentication-authorization.md](01-authentication-authorization.md) | 8 | Auth, JWT, role check, middleware |
| 02 | [02-input-validation-xss.md](02-input-validation-xss.md) | 8 | XSS, DOMPurify, slug, upload |
| 03 | [03-data-protection.md](03-data-protection.md) | 8 | Password hash, secrets, API response |
| 04 | [04-rate-limiting-abuse.md](04-rate-limiting-abuse.md) | 10 | Anti-spam, idempotency, brute force |

## Cach chay
1. Chay theo thu tu 01 -> 04
2. Moi test case co huong dan cu the
3. Mot so TC can dung DevTools hoac curl/Postman
4. Danh dau PASS/FAIL vao cuoi moi file

## Thu tu uu tien fix
1. CRITICAL: XSS (da fix)
2. HIGH: JWT expiry (da fix)
3. MEDIUM: Login rate limit
4. LOW: Zod validation cho cac API route con thieu
