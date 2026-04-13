# Flow Đăng ký / Đăng nhập / Mật khẩu — Manual Test Cases

> Các test case chi tiết từng bước để thực hiện kiểm thử bằng tay.
> Mỗi bước có **Action** (việc cần làm) và **Expected** (kết quả mong đợi).
> Tick ☐ → ✅ PASS hoặc ❌ FAIL. Nếu FAIL, ghi chú lỗi vào cột Ghi chú.

---

## 🧰 Chuẩn bị

### Tài khoản cần có sẵn
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@hoi-tram-huong.vn` | `123456` |
| Hội viên hiện hữu | `nguyen.van.a@tramhuong-hn.vn` | `123456` |

### Email test (chuẩn bị trước)
- **Email thật 1** (để đăng ký): `test.ghichu1@gmail.com` *(thay bằng Gmail bạn đang mở)*
- **Email thật 2** (để reset password): `test.ghichu2@gmail.com`
- **Email không tồn tại** (test enumeration): `khongtontai999@example.com`

### Môi trường
- URL: `https://hoitramhuong.vn` (hoặc staging URL)
- Browser: Chrome (Ẩn danh cho mỗi test để tránh lẫn session)
- Hộp thư Gmail của các email test phải mở sẵn ở tab khác

---

## 📝 TC-REG-01: Đăng ký tài khoản mới — hội viên cá nhân

**Mục tiêu:** Hội viên tự đăng ký qua website, kích hoạt ngay, đăng nhập được.

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Mở Chrome Ẩn danh → truy cập `https://hoitramhuong.vn` | Trang chủ load < 3s | ☐ |
| 2 | Click nút **"Đăng ký"** (góc phải menu) | Chuyển đến `/dang-ky`, form hiển thị | ☐ |
| 3 | Chọn loại tài khoản **"Cá nhân"** | Form hiện các field: Họ tên, Email, SĐT, Mật khẩu, Lý do gia nhập | ☐ |
| 4 | Bỏ trống tất cả → click **Đăng ký** | Hiển thị error validation, không submit | ☐ |
| 5 | Nhập email sai format: `abc` → submit | Error "Email không hợp lệ" | ☐ |
| 6 | Nhập mật khẩu < 8 ký tự: `1234` → submit | Error "Mật khẩu phải ≥ 8 ký tự" | ☐ |
| 7 | Điền đầy đủ: `Nguyễn Test`, `test.ghichu1@gmail.com`, `0901234567`, `12345678`, "Muốn gia nhập Hội" | — | ☐ |
| 8 | Click **Đăng ký** | Chuyển hướng đến trang chào mừng / dashboard, thông báo thành công | ☐ |
| 9 | Mở Gmail của email vừa dùng | Email từ `noreply@hoitramhuong.vn`, tiêu đề "Chào mừng..." | ☐ |
| 10 | Kiểm tra nội dung email | Có tên người dùng, lời chào, link quay lại website | ☐ |

**Ghi chú:** _______________________________________________

---

## 🏢 TC-REG-02: Đăng ký tài khoản doanh nghiệp

**Mục tiêu:** Đăng ký tài khoản với thông tin công ty, hệ thống tự tạo company profile.

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Chrome Ẩn danh → `/dang-ky` | Form đăng ký | ☐ |
| 2 | Chọn loại **"Doanh nghiệp"** | Form xuất hiện thêm: Tên công ty, Lĩnh vực | ☐ |
| 3 | Điền đầy đủ thông tin doanh nghiệp | — | ☐ |
| 4 | Submit | Thành công, redirect dashboard | ☐ |
| 5 | Đăng nhập → vào **"Hồ sơ doanh nghiệp"** | Company profile đã được tạo sẵn với tên và lĩnh vực vừa nhập | ☐ |

---

## 🚫 TC-REG-03: Đăng ký với email trùng

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | `/dang-ky` → nhập email **đã tồn tại** (ví dụ `nguyen.van.a@tramhuong-hn.vn`) | — | ☐ |
| 2 | Điền phần còn lại + submit | Error "Email đã được sử dụng" hoặc tương tự | ☐ |
| 3 | Không có bản ghi user mới trong DB | Admin check trong `/admin/hoi-vien` — chỉ 1 bản ghi | ☐ |

---

## 👤 TC-REG-04: Admin tạo tài khoản — Mode "Với mật khẩu"

**Mục tiêu:** Admin tạo tài khoản thủ công với mật khẩu đã biết trước.

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Login admin → vào `/admin/hoi-vien` | Danh sách hội viên hiển thị | ☐ |
| 2 | Click **"Tạo mới"** | Chuyển đến `/admin/hoi-vien/tao-moi`, tiêu đề **"Tạo tài khoản hội viên"** (không phải VIP) | ☐ |
| 3 | Chọn tab **"Tạo với mật khẩu"** | Form hiện field Mật khẩu | ☐ |
| 4 | Điền: Họ tên, email mới, SĐT, mật khẩu | — | ☐ |
| 5 | Submit | Redirect về danh sách, user mới xuất hiện với trạng thái **Active** | ☐ |
| 6 | Logout admin → login bằng user vừa tạo | Đăng nhập thành công, vào dashboard | ☐ |

---

## 📧 TC-REG-05: Admin tạo tài khoản — Mode "Gửi email mời"

**Mục tiêu:** Admin tạo tài khoản và hệ thống gửi link đặt mật khẩu cho hội viên tự kích hoạt.

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Admin → `/admin/hoi-vien/tao-moi` → chọn tab **"Gửi email mời"** | Field mật khẩu biến mất | ☐ |
| 2 | Điền: Họ tên, email thật (test.ghichu2@gmail.com), SĐT | — | ☐ |
| 3 | Submit | Thông báo "Đã tạo tài khoản và gửi email mời đến..." | ☐ |
| 4 | Mở Gmail của `test.ghichu2@gmail.com` | Email "Kích hoạt tài khoản" có nút bấm | ☐ |
| 5 | Click nút trong email | Chuyển đến `/dat-mat-khau?token=...&email=...` | ☐ |
| 6 | Kiểm tra trang | Field email hiển thị read-only, đúng email đã mời | ☐ |
| 7 | Nhập mật khẩu mới (8+ ký tự): `MatKhau123` | Thanh độ mạnh hiển thị (Yếu / TB / Mạnh) | ☐ |
| 8 | Nhập xác nhận mật khẩu **khác**: `MatKhau456` | Error "Mật khẩu xác nhận không khớp" | ☐ |
| 9 | Sửa xác nhận đúng: `MatKhau123` | Error biến mất | ☐ |
| 10 | Click **"Kích hoạt tài khoản"** | Trang thành công, auto redirect về `/tong-quan` | ☐ |
| 11 | Đăng nhập lại bằng email + mật khẩu vừa đặt | Thành công | ☐ |
| 12 | Click lại link trong email cũ (đã dùng) | Error "Liên kết không hợp lệ hoặc đã được sử dụng" | ☐ |

---

## ⏰ TC-REG-06: Link kích hoạt hết hạn (48h)

**Mục tiêu:** Kiểm tra token reset/invite hết hạn sau 48h.

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Admin tạo user với mode "Gửi email mời" | Email đã gửi | ☐ |
| 2 | Vào DB (Prisma Studio / Supabase) → bảng `VerificationToken` → tìm token vừa tạo | Bản ghi hiện ra | ☐ |
| 3 | Sửa field `expires` thành thời gian trong quá khứ (VD 2025-01-01) | — | ☐ |
| 4 | Quay lại email → click link | Error "Liên kết đã hết hạn" | ☐ |

---

## 🔐 TC-LOGIN-01: Đăng nhập thành công (Credentials)

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Truy cập `/login` | Form có ô Email, Mật khẩu, nút Google, link "Đăng ký", link **"Quên mật khẩu?"** | ☐ |
| 2 | Bỏ trống email → submit | Error "Vui lòng nhập đầy đủ thông tin" | ☐ |
| 3 | Nhập email hội viên hợp lệ + mật khẩu đúng | — | ☐ |
| 4 | Submit | Redirect đến `/tong-quan` | ☐ |
| 5 | Refresh trang | Vẫn đăng nhập (session còn) | ☐ |
| 6 | Header menu | Hiện avatar + tên user, có nút Logout | ☐ |

---

## ❌ TC-LOGIN-02: Đăng nhập sai

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Login với email đúng + **mật khẩu sai** | Error "Email hoặc mật khẩu không chính xác" | ☐ |
| 2 | Lặp lại 3 lần liên tiếp | Không bị treo, không lộ thông tin user có tồn tại hay không | ☐ |
| 3 | Login với email **không tồn tại** + mật khẩu bất kỳ | Cùng error như trên (không phân biệt) | ☐ |
| 4 | Login với tài khoản bị **khóa** (isActive=false) | Error phù hợp (ví dụ "Tài khoản đã bị khóa") | ☐ |

---

## 🅶 TC-LOGIN-03: Đăng nhập Google OAuth

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | `/login` → click **"Đăng nhập bằng Google"** | Redirect đến Google OAuth | ☐ |
| 2 | Chọn tài khoản Google của bạn | Redirect về website | ☐ |
| 3 | Lần đầu login Google | Tạo user mới hoặc link vào user có sẵn nếu email trùng | ☐ |
| 4 | Vào dashboard | Đăng nhập thành công | ☐ |

---

## 🔄 TC-LOGIN-04: Redirect theo vai trò

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Login với tài khoản **Admin** | Redirect về `/admin` | ☐ |
| 2 | Login với tài khoản **Hội viên** | Redirect về `/tong-quan` | ☐ |
| 3 | Chưa đăng nhập → truy cập `/tong-quan` trực tiếp | Redirect về `/login?callbackUrl=/tong-quan` | ☐ |
| 4 | Sau khi login xong | Tự động quay về `/tong-quan` (callbackUrl hoạt động) | ☐ |

---

## 🔑 TC-FORGOT-01: Quên mật khẩu — flow thành công

**Mục tiêu:** Hội viên quên mật khẩu, tự request reset, đặt mật khẩu mới.

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Truy cập `/login` | Trang login có link **"Quên mật khẩu?"** cạnh nhãn "Mật khẩu" | ☐ |
| 2 | Click **"Quên mật khẩu?"** | Chuyển đến `/quen-mat-khau` | ☐ |
| 3 | Trang hiện form nhập email, nút **"Gửi liên kết đặt lại"** | ☐ |
| 4 | Bỏ trống email → submit | Error "Vui lòng nhập email" | ☐ |
| 5 | Nhập email sai format: `abc` → submit | Error "Email không hợp lệ" | ☐ |
| 6 | Nhập email hội viên có thật (`test.ghichu1@gmail.com`) → submit | Loading → hiện trang "Kiểm tra email của bạn" | ☐ |
| 7 | Mở Gmail của email đó | Email "Đặt lại mật khẩu - Hội Trầm Hương Việt Nam" từ `noreply@hoitramhuong.vn` | ☐ |
| 8 | Kiểm tra nội dung email | Có tên user, nút "Đặt mật khẩu mới", ghi chú "hiệu lực 48 giờ" | ☐ |
| 9 | Click nút trong email | Chuyển đến `/dat-mat-khau?token=...&email=...` | ☐ |
| 10 | Email field | Read-only, đúng email đã request | ☐ |
| 11 | Nhập mật khẩu mới: `MoiMatKhau456` | Thanh độ mạnh hiển thị | ☐ |
| 12 | Nhập xác nhận **khác**: `MoiMatKhau999` | Error "Mật khẩu xác nhận không khớp" | ☐ |
| 13 | Sửa xác nhận đúng: `MoiMatKhau456` | Error biến mất, nút submit active | ☐ |
| 14 | Click **"Kích hoạt tài khoản"** (hoặc "Đặt mật khẩu mới") | Thành công, auto redirect về `/tong-quan` (đã login sẵn) | ☐ |
| 15 | Logout → login lại với mật khẩu **CŨ** | Đăng nhập **thất bại** | ☐ |
| 16 | Login với mật khẩu **MỚI** | Đăng nhập **thành công** | ☐ |
| 17 | Click lại link reset trong email cũ | Error "Liên kết không hợp lệ hoặc đã được sử dụng" | ☐ |

---

## 🛡 TC-FORGOT-02: Email không tồn tại (chống enumeration)

**Mục tiêu:** Đảm bảo attacker không thể dùng endpoint để dò email đã đăng ký.

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | `/quen-mat-khau` → nhập email **không tồn tại** (`khongtontai999@example.com`) | — | ☐ |
| 2 | Submit | Hiện cùng trang "Kiểm tra email của bạn" — **không báo "email không tồn tại"** | ☐ |
| 3 | Kiểm tra hộp thư `khongtontai999@...` (nếu có thể) | Không có email nào được gửi | ☐ |
| 4 | Kiểm tra Resend Dashboard → Emails | Không có email nào log gửi đến address này | ☐ |

---

## 🚷 TC-FORGOT-03: Admin account không thể reset qua flow public

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | `/quen-mat-khau` → nhập email admin (`admin@hoi-tram-huong.vn`) | — | ☐ |
| 2 | Submit | Hiện trang success (generic) | ☐ |
| 3 | Mở hộp thư admin | **Không** nhận được email reset | ☐ |
| 4 | Login admin với mật khẩu cũ | Vẫn login được (không bị thay đổi) | ☐ |

> ⚠️ Lý do: Admin chỉ có thể reset bằng cách đăng nhập DB trực tiếp hoặc qua admin khác. Endpoint public chủ động từ chối để giảm rủi ro.

---

## ⏳ TC-FORGOT-04: Token reset hết hạn

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Thực hiện flow quên mật khẩu → nhận email | Email đã có | ☐ |
| 2 | Vào DB bảng `VerificationToken` → sửa `expires` thành quá khứ | — | ☐ |
| 3 | Click link trong email | Error "Liên kết đã hết hạn, vui lòng yêu cầu lại" | ☐ |
| 4 | Quay lại `/quen-mat-khau` → request mới | Nhận email mới với token mới | ☐ |

---

## 🔁 TC-FORGOT-05: Request reset nhiều lần — chỉ token mới nhất hợp lệ

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Request reset lần 1 → nhận email A | Email A có link với token T1 | ☐ |
| 2 | Request reset lần 2 (cùng email) → nhận email B | Email B có link với token T2 (khác T1) | ☐ |
| 3 | Click link trong email A (token T1 — cũ) | Error "Liên kết không hợp lệ" (đã bị xóa khi tạo token mới) | ☐ |
| 4 | Click link trong email B (token T2 — mới) | Mở trang đặt mật khẩu bình thường | ☐ |

---

## ✍️ TC-CONFIRM-01: Xác nhận mật khẩu — validation rules

**Mục tiêu:** Kiểm tra ràng buộc trên trang `/dat-mat-khau`.

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Vào `/dat-mat-khau` với token hợp lệ | Form có: ô Mật khẩu, ô Xác nhận mật khẩu, thanh độ mạnh | ☐ |
| 2 | Nhập mật khẩu `1234` (< 8 ký tự) | Thanh hiện **Yếu**, nút submit disabled hoặc báo lỗi | ☐ |
| 3 | Nhập `12345678` (chỉ số) | Thanh hiện **Yếu/TB** | ☐ |
| 4 | Nhập `MatKhau123` (có chữ hoa + thường + số) | Thanh hiện **TB/Mạnh** | ☐ |
| 5 | Nhập `MatKhau@2024#$` (đủ loại ký tự) | Thanh hiện **Mạnh** | ☐ |
| 6 | Ô xác nhận để trống → submit | Error "Vui lòng xác nhận mật khẩu" | ☐ |
| 7 | Ô xác nhận khác ô chính → submit | Error "Mật khẩu xác nhận không khớp" | ☐ |
| 8 | Hai ô khớp → submit | Thành công | ☐ |

---

## 🔒 TC-CONFIRM-02: Submit với token đã bị sử dụng

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Hoàn tất flow đặt mật khẩu lần 1 với token T | Thành công | ☐ |
| 2 | Copy URL `/dat-mat-khau?token=T&email=...` vừa dùng | — | ☐ |
| 3 | Paste lại vào tab khác → vào trang | Error "Liên kết không hợp lệ hoặc đã được sử dụng" hoặc redirect | ☐ |
| 4 | Thử force submit form (nếu UI còn) | API trả 400 "Token không hợp lệ" | ☐ |

---

## 🎯 TC-CONFIRM-03: Kiểm tra cookie/session sau đặt mật khẩu

| # | Action | Expected | Result |
|---|---|---|---|
| 1 | Trước khi đặt mật khẩu: không có session cookie | — | ☐ |
| 2 | Hoàn tất đặt mật khẩu mới | Auto redirect về `/tong-quan` — đã có session | ☐ |
| 3 | DevTools → Application → Cookies | Cookie `next-auth.session-token` tồn tại | ☐ |
| 4 | Đóng browser → mở lại `https://hoitramhuong.vn` | Vẫn đăng nhập (session chưa expire) | ☐ |

---

## 📊 Bảng tổng kết

| TC | Mô tả | Status |
|---|---|---|
| TC-REG-01 | Đăng ký cá nhân | ☐ PASS / ☐ FAIL |
| TC-REG-02 | Đăng ký doanh nghiệp | ☐ PASS / ☐ FAIL |
| TC-REG-03 | Email trùng | ☐ PASS / ☐ FAIL |
| TC-REG-04 | Admin tạo + mật khẩu | ☐ PASS / ☐ FAIL |
| TC-REG-05 | Admin tạo + email mời | ☐ PASS / ☐ FAIL |
| TC-REG-06 | Token invite hết hạn | ☐ PASS / ☐ FAIL |
| TC-LOGIN-01 | Login credentials thành công | ☐ PASS / ☐ FAIL |
| TC-LOGIN-02 | Login sai | ☐ PASS / ☐ FAIL |
| TC-LOGIN-03 | Login Google | ☐ PASS / ☐ FAIL |
| TC-LOGIN-04 | Redirect theo role | ☐ PASS / ☐ FAIL |
| TC-FORGOT-01 | Quên mật khẩu thành công | ☐ PASS / ☐ FAIL |
| TC-FORGOT-02 | Chống enumeration | ☐ PASS / ☐ FAIL |
| TC-FORGOT-03 | Admin không reset được | ☐ PASS / ☐ FAIL |
| TC-FORGOT-04 | Token reset hết hạn | ☐ PASS / ☐ FAIL |
| TC-FORGOT-05 | Request nhiều lần | ☐ PASS / ☐ FAIL |
| TC-CONFIRM-01 | Validation xác nhận mật khẩu | ☐ PASS / ☐ FAIL |
| TC-CONFIRM-02 | Token đã dùng | ☐ PASS / ☐ FAIL |
| TC-CONFIRM-03 | Session sau đặt mật khẩu | ☐ PASS / ☐ FAIL |

---

## 📝 Ghi chú chung

- **Gợi ý trình tự chạy:** TC-REG-01 → TC-LOGIN-01 → TC-FORGOT-01 → TC-CONFIRM-01 (tuyến chính) trước, sau đó chạy các case edge/lỗi.
- **Cleanup sau test:** xóa các user test trong admin hoặc qua Prisma Studio để không lẫn với data thật.
- **Nếu có lỗi:** chụp màn hình + ghi URL + ghi input cụ thể → gửi dev.

## 🔗 Tham chiếu

- API docs: [documents/guideline/06-api-documentation.md](../../guideline/06-api-documentation.md)
- Email flow: [05-flow-email.md](05-flow-email.md)
- Authorization flow: [03-flow-phan-quyen.md](03-flow-phan-quyen.md)
