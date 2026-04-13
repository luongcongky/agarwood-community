# 🎬 KỊCH BẢN DEMO GIAI ĐOẠN 1 — HỘI TRẦM HƯƠNG VN

**Mục tiêu:** Trong ~25 phút, demo đầy đủ mọi hạng mục trong checklist nghiệm thu Giai đoạn 1. Sắp xếp theo thứ tự "kể chuyện" — người xem sẽ thấy hệ thống từ góc nhìn **khách → hội viên → admin**.

---

## 🛠 Chuẩn bị trước demo (15 phút trước giờ G)

| Việc | Chi tiết |
|---|---|
| Tab 1 — Ẩn danh | Chrome Incognito, mở sẵn `https://hoitramhuong.vn` |
| Tab 2 — Admin | Đã login sẵn bằng tài khoản admin |
| Tab 3 — Gmail | Mở hộp thư Hội để show email đến real-time |
| Tab 4 — Điện thoại | Cầm điện thoại hoặc bật Chrome DevTools (F12 → Toggle Device) sẵn chế độ iPhone |
| Tài khoản test | Chuẩn bị 1 email Gmail cá nhân bạn đang mở — để đăng ký demo |
| Dữ liệu | Đảm bảo đã có: 3+ bài tin tức, 3+ hội viên mẫu, 1 bài điều lệ, banner trang chủ |

---

## PHẦN 1 — KHÁCH TRUY CẬP (5 phút)

### 🎬 Kịch bản 1: "Người lạ lần đầu vào website"

**Lời thoại:** *"Giờ em thử đặt mình vào vai một người chưa biết về Hội, lần đầu truy cập website."*

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 1.1 | Mở `hoitramhuong.vn` ở Tab Ẩn danh | ✅ Load **dưới 3 giây**, banner, logo hiển thị rõ |
| 1.2 | Cuộn xuống trang chủ | ✅ Có: giới thiệu hội, **tin tức mới nhất**, **sản phẩm tiêu biểu**, thông tin liên hệ |
| 1.3 | Click menu **"Giới thiệu"** | ✅ Lịch sử, sứ mệnh, ban lãnh đạo hiển thị đúng |
| 1.4 | Click menu **"Điều lệ"** | ✅ Văn bản chính thức hiển thị đầy đủ |
| 1.5 | Click menu **"Tin tức"** → chọn 1 bài | ✅ Danh sách có ≥3 bài, chi tiết hiện tiêu đề/ngày/ảnh/nội dung |
| 1.6 | Click menu **"Hội viên"** | ✅ Danh bạ doanh nghiệp hội viên, có ô tìm kiếm |
| 1.7 | Click vào 1 doanh nghiệp trong danh bạ | ✅ Profile chi tiết: logo, tên, mô tả, địa chỉ, website |

### 🎬 Kịch bản 2: "Khách muốn liên hệ với Hội" *(tính năng mới)*

**Lời thoại:** *"Nếu khách muốn hỏi thông tin, họ có thể gửi liên hệ trực tiếp trên website."*

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 2.1 | Vào `/lien-he` | ✅ Hiển thị địa chỉ, SĐT, email, Facebook, bản đồ |
| 2.2 | Điền họ tên, email, SĐT, nội dung | — |
| 2.3 | Bấm **"Gửi liên hệ"** | ✅ Thông báo "Gửi thành công!" |
| 2.4 | **Chuyển qua Tab 3 (Gmail Hội)** → F5 | 🌟 **Email mới xuất hiện ngay** với nội dung khách vừa nhập |
| 2.5 | Bấm **Reply** trong Gmail | ✅ Email reply đi đúng về địa chỉ khách |

> 💡 **Điểm wow:** nhấn mạnh "trước đây form này không chạy, giờ tin nhắn tới thẳng hộp thư Hội"

---

## PHẦN 2 — ĐĂNG KÝ & ĐĂNG NHẬP (6 phút)

### 🎬 Kịch bản 3: "Đăng ký làm hội viên mới"

**Lời thoại:** *"Anh chị xem quy trình một doanh nghiệp đăng ký gia nhập Hội."*

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 3.1 | Tab ẩn danh → click **"Đăng ký"** | ✅ Form đăng ký hiển thị |
| 3.2 | Điền email Gmail thật của bạn + mật khẩu | — |
| 3.3 | Submit | ✅ Thông báo đăng ký thành công |
| 3.4 | **Mở Gmail** của email vừa dùng | 🌟 **Email chào mừng** từ `noreply@hoitramhuong.vn` |
| 3.5 | Quay lại web → đăng nhập | ✅ Vào được Dashboard hội viên ngay |

### 🎬 Kịch bản 4: "Hội viên quên mật khẩu" *(tính năng mới)*

**Lời thoại:** *"Nếu hội viên quên mật khẩu, họ tự xử lý được không cần nhờ admin."*

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 4.1 | Logout → vào `/login` | ✅ Có link **"Quên mật khẩu?"** cạnh ô mật khẩu |
| 4.2 | Click link → chuyển sang `/quen-mat-khau` | ✅ Form nhập email |
| 4.3 | Nhập email → bấm **"Gửi liên kết đặt lại"** | ✅ Hiện "Kiểm tra email của bạn" |
| 4.4 | Mở Gmail | 🌟 Email "Đặt lại mật khẩu" có nút bấm |
| 4.5 | Click link trong email | ✅ Mở trang `/dat-mat-khau` với email đã điền sẵn |
| 4.6 | Nhập mật khẩu mới → xác nhận | ✅ Hiện thanh độ mạnh mật khẩu |
| 4.7 | Submit → tự động redirect về dashboard | ✅ Đã đăng nhập bằng mật khẩu mới |

### 🎬 Kịch bản 5: "Chặn truy cập trái phép"

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 5.1 | Tab ẩn danh (chưa đăng nhập) → gõ trực tiếp `/tong-quan` | ✅ Bị redirect về trang login |
| 5.2 | Thử đăng nhập sai mật khẩu 3 lần | ✅ Báo lỗi rõ, không bị treo |

---

## PHẦN 3 — HỘI VIÊN ĐÃ ĐĂNG NHẬP (5 phút)

### 🎬 Kịch bản 6: "Khám phá khu vực hội viên"

**Lời thoại:** *"Sau khi đăng nhập, hội viên có khu vực riêng."*

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 6.1 | Dashboard `/tong-quan` | ✅ Hiển thị gói thành viên, ngày hết hạn, hạng |
| 6.2 | **Hồ sơ doanh nghiệp** → Chỉnh sửa | ✅ Nhập tên công ty, mô tả, địa chỉ, website |
| 6.3 | **Upload logo** | ✅ Ảnh hiển thị đúng kích thước |
| 6.4 | Lưu → mở Tab ẩn danh → vào danh bạ tìm tên DN | ✅ Profile hiện ra với logo vừa upload |
| 6.5 | **Lịch sử thanh toán** | ✅ Hiện bản ghi phí đã đóng (nếu có) |

### 🎬 Kịch bản 7: "Gia hạn phí hội viên"

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 7.1 | Vào `/gia-han` | ✅ Hiển thị số tài khoản ngân hàng |
| 7.2 | Chỉ ra format nội dung CK | 🌟 **`HOITRAMHUONG-MEM-{INITIALS}-{YYYYMMDD}`** — đúng chuẩn |
| 7.3 | Bấm **"Tôi đã chuyển khoản"** | ✅ Tin nhắn chờ admin xác nhận gửi đi |

---

## PHẦN 4 — ADMIN QUẢN TRỊ (6 phút)

### 🎬 Kịch bản 8: "Admin tạo tài khoản hội viên mới"

**Chuyển sang Tab 2 (Admin đã login sẵn).**

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 8.1 | Vào `/admin` | ✅ Giao diện admin riêng, có dashboard thống kê |
| 8.2 | **Quản lý hội viên** | ✅ Danh sách hội viên + filter theo trạng thái (active / hết hạn / chờ duyệt) |
| 8.3 | **Tạo mới** → tiêu đề **"Tạo tài khoản hội viên"** | 🌟 *(Đã bỏ chữ "VIP" theo điều lệ)* |
| 8.4 | Chọn mode **"Gửi email mời"** → điền thông tin | — |
| 8.5 | Submit | ✅ Email mời tự động gửi đến hội viên |

### 🎬 Kịch bản 9: "Admin xác nhận thanh toán"

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 9.1 | Admin → **Quản lý thanh toán** | ✅ Thấy bản ghi "Tôi đã chuyển khoản" từ Kịch bản 7 |
| 9.2 | Bấm **"Xác nhận đã nhận tiền"** | ✅ Trạng thái chuyển sang "Đã xác nhận" |
| 9.3 | Chuyển Tab hội viên → Lịch sử thanh toán | ✅ Bản ghi mới xuất hiện với trạng thái xác nhận |

### 🎬 Kịch bản 10: "Admin đăng tin tức"

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 10.1 | Admin → **Quản lý tin tức** → Tạo mới | — |
| 10.2 | Nhập tiêu đề, nội dung, upload ảnh | ✅ Trình editor đầy đủ |
| 10.3 | Bấm **Xuất bản** | — |
| 10.4 | Chuyển Tab ẩn danh → mở trang Tin tức | ✅ Bài vừa đăng xuất hiện ngay đầu danh sách |

### 🎬 Kịch bản 11: "Admin khóa tài khoản"

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 11.1 | Admin → Hội viên → chọn 1 tài khoản → **Khóa** | — |
| 11.2 | Thử login bằng tài khoản đó ở tab khác | ✅ Bị từ chối truy cập |

---

## PHẦN 5 — HIỆU NĂNG & GIAO DIỆN (3 phút)

### 🎬 Kịch bản 12: "Trải nghiệm trên điện thoại"

| Bước | Thao tác | Điều cần chỉ ra |
|---|---|---|
| 12.1 | Cầm điện thoại thật → mở `hoitramhuong.vn` | ✅ Layout không vỡ, chữ đọc được |
| 12.2 | Menu hamburger hoạt động | ✅ Responsive đầy đủ |
| 12.3 | Duyệt 5–6 trang khác nhau | ✅ Màu sắc, font, logo nhất quán |
| 12.4 | Mở 1 trang bất kỳ → đo tốc độ load | ✅ Dưới 3 giây |

---

## 📋 CHECKLIST THEO DÕI KHI DEMO

Print bảng này để tick trong lúc demo:

```
☐ 1.  Trang chủ — banner, tin tức, sản phẩm tiêu biểu, liên hệ
☐ 2.  Trang Giới thiệu — lịch sử, sứ mệnh, ban lãnh đạo
☐ 3.  Trang Điều lệ
☐ 4.  Tin tức — list + chi tiết
☐ 5.  Liên hệ — form gửi email TỚI HỘP THƯ HỘI THẬT ★
☐ 6.  Đăng ký + email chào mừng
☐ 7.  Đăng nhập
☐ 8.  Quên mật khẩu self-service ★
☐ 9.  Middleware chặn khách
☐ 10. Dashboard hội viên
☐ 11. Hồ sơ doanh nghiệp + upload logo
☐ 12. Danh bạ công khai + tìm kiếm
☐ 13. Profile doanh nghiệp chi tiết
☐ 14. Lịch sử thanh toán
☐ 15. Trang gia hạn + format CK HOITRAMHUONG-...
☐ 16. Admin — quản lý hội viên
☐ 17. Admin — tạo tài khoản hội viên (đã bỏ "VIP") ★
☐ 18. Admin — xác nhận thanh toán thủ công
☐ 19. Admin — đăng tin tức
☐ 20. Admin — kích hoạt/khóa tài khoản
☐ 21. Responsive mobile
☐ 22. Tốc độ load <3s

★ = tính năng mới, điểm nhấn
```

---

## 🎯 Tips khi demo

1. **Đừng chạy tuần tự checklist khô khan** — đi theo mạch câu chuyện "khách → hội viên → admin".
2. **Show email real-time** — điểm ấn tượng nhất với khách không kỹ thuật, chứng minh hệ thống "có gửi email thật".
3. **Để mở Tab Gmail sẵn** — mỗi lần có action gửi mail thì chỉ tay sang Gmail refresh → "đây, thư tới rồi".
4. **Nếu có lỗi phát sinh** — không giấu, ghi vào cột "Ghi chú" checklist của bên A, hẹn sửa trong 1–2 ngày.
5. **Dry-run trước 1 lần** — chạy đủ 12 kịch bản trước buổi họp để chắc chắn data đủ, không crash.

---

## 🔗 Tham chiếu

- Checklist nghiệm thu gốc: `Checklist_GD1_NenTang.pdf`
- API docs: [documents/guideline/06-api-documentation.md](../../guideline/06-api-documentation.md)
- Test cases email chi tiết: [documents/testing/functional/05-flow-email.md](../functional/05-flow-email.md)
