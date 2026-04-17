# KỊCH BẢN DEMO NGHIỆM THU — GIAI ĐOẠN 2

**Thời lượng:** 30–45 phút · **Khán giả:** Đại diện Hội Trầm Hương Việt Nam

Kịch bản này đi qua **toàn bộ checklist GĐ2 (Cộng đồng & Chứng nhận)** theo 1 flow liên tục, mô phỏng trải nghiệm thật. Cần thao tác 3 role: **Guest (chưa đăng nhập)** → **VIP mới** → **Admin**.

---

## 🔧 CHUẨN BỊ TRƯỚC DEMO (15 phút)

### Tài khoản cần sẵn sàng

| Role | Email | Trạng thái |
|---|---|---|
| **Admin** | `admin@hoitramhuong.vn` | Đang active, đã login sẵn trên tab riêng |
| **VIP active** (dùng để đăng bài + báo cáo) | vd `vip01@demo.vn` | Active, có tối thiểu 1 bài đã đăng |
| **VIP khác** (để thử reaction) | vd `vip02@demo.vn` | Active |
| **Email mới** (đăng ký tại chỗ) | vd `luongcongky.ext3@gmail.com` | **Chưa tồn tại** trong hệ thống |

### Dữ liệu sẵn sàng

- [ ] Ít nhất **5 bài viết** trên Feed từ các VIP khác nhau, có hạng đóng góp khác biệt (để thấy ranking)
- [ ] 1 sản phẩm demo sẵn ở trạng thái `DRAFT` cho VIP (để nộp đơn CN)
- [ ] 1 file PDF mẫu (~500KB) để upload làm tài liệu chứng nhận
- [ ] Mở sẵn: terminal log Resend dashboard (kiểm email), DevTools → Network (tuỳ chọn)

### Tab setup

- **Tab 1 (incognito):** dùng cho role Guest + đăng ký tài khoản mới
- **Tab 2:** đã login VIP active
- **Tab 3:** đã login Admin, mở `/admin/hoi-vien`

---

## 🎬 PHẦN 1 — TRẢI NGHIỆM GUEST (5 phút)

> **Mục tiêu:** checklist mục **Phân quyền**, **Premium blur Feed**, **Báo cáo vi phạm xem-được**

**👉 Thao tác (trên Tab 1 incognito):**

1. Vào `https://hoitramhuong.vn/feed` (không login)
2. **Quan sát:** 3 bài đầu hiển thị đầy đủ, từ bài thứ 4 trở đi có overlay mờ + nút **"Đăng nhập để đọc thêm"**
   - ✅ *Checklist: "Khách xem được 3 bài đầu, các bài sau bị ẩn, có nút đăng nhập"*
3. Thử truy cập thẳng `/tong-quan` hoặc `/admin`
   - ✅ *Checklist: "Khách không vào Dashboard" → Redirect về `/login`*

**💬 Nói với khách:** *"Để giữ giá trị cho hội viên đã đóng phí, Guest chỉ xem hạn chế. Đây là motivation chính để họ đăng ký."*

---

## 🎬 PHẦN 2 — ĐĂNG KÝ TÀI KHOẢN MỚI (5 phút)

> **Mục tiêu:** checklist mục **Email tự động — đăng ký**

**👉 Thao tác (Tab 1 incognito):**

1. Vào `/dang-ky`
2. Chọn loại tài khoản: **Cá nhân / Chuyên gia** (hoặc Doanh nghiệp tuỳ demo)
3. Có thể show cả 2 path:
   - **Path A (Google OAuth):** click "Đăng ký bằng Google" → chọn Google account → redirect về `/tong-quan`. *Chỉ ra label button có hiện "(Cá nhân)" theo radio đã chọn.*
   - **Path B (manual):** điền form đầy đủ → Submit → thấy màn hình *"Email hướng dẫn đã được gửi đến ..."*
4. **Mở Gmail của email vừa đăng ký** → tìm mail **"Chào mừng đến với Hội Trầm Hương Việt Nam — Đặt mật khẩu"**
   - Nếu không thấy: check Spam, search `from:hoitramhuong.vn`
   - ✅ *Checklist: "Email đặt mật khẩu nhận trong vài phút"*
5. Click nút **"Đặt mật khẩu ngay"** trong email → điền mật khẩu → kích hoạt → auto login → redirect `/tong-quan`

**💬 Nói với khách:** *"Domain đã verify DMARC/DKIM/SPF trên Resend nên email không rơi vào spam của Gmail."*

> ⚠️ **Nếu Path B fail và email không đến:** chuyển sang Path A (Google OAuth) — show fallback đã có.

---

## 🎬 PHẦN 3 — NÂNG CẤP GUEST → VIP (kết nạp & thanh toán) (7 phút)

> **Mục tiêu:** checklist mục **Phân quyền GUEST**, flow kết nạp + thanh toán membership

**👉 Thao tác (Tab 1 — user vừa đăng ký):**

1. Ở menu user avatar → click **"Đơn kết nạp Hội viên"** → `/ket-nap`
2. Điền lý do (≥ 20 ký tự) + chọn hạng "Chính thức" + submit
3. Thấy card **"Đơn của bạn đang chờ xét duyệt"**

**👉 Chuyển sang Tab 3 (Admin):**

4. Admin vào `/admin/hoi-vien/don-ket-nap`
5. Thấy đơn mới → click vào → **Duyệt**
6. **Email:** VIP nhận mail *"Quyết định công nhận Hội viên"*

**👉 Quay lại Tab 1:**

7. Refresh — user giờ là VIP (sidebar đầy đủ menu). Click **"Gia hạn"** → `/gia-han`
8. Chọn mức phí 1.000.000đ (cá nhân) → **"Tiếp tục chuyển khoản"**
9. Xem thông tin CK — copy nội dung `MEM_{initials}_{id}` (hệ thống đã tạo sẵn)

**👉 Tab 3 (Admin):**

10. `/admin/thanh-toan` → tìm giao dịch PENDING → **"Xác nhận đã nhận CK"**
11. Email VIP nhận mail *"Membership đã được kích hoạt"*

**👉 Tab 1 (VIP):**

12. Refresh → `/tong-quan` hiển thị hạng + ngày hết hạn
    - ✅ *Checklist: "Phân quyền đúng Guest / VIP" thành công*

**💬 Nói với khách:** *"Toàn bộ là manual bank transfer, admin confirm bằng tay. Không tích hợp cổng thanh toán tự động để tránh phí trung gian và rủi ro chargeback."*

---

## 🎬 PHẦN 4 — ĐĂNG BÀI & RANKING FEED (5 phút)

> **Mục tiêu:** checklist mục **Đăng bài viết**, **Tương tác**

**👉 Tab 2 (VIP01 active):**

1. Vào `/feed` → click **"Tạo bài mới"**
2. Gõ nội dung ~5 dòng + **upload 1 ảnh** → bấm **Đăng**
3. Thấy bài xuất hiện ngay trên Feed
   - ✅ *Checklist: "VIP đăng được bài với nội dung + hình ảnh"*
4. **Chỉ ra:** bài của VIP01 (hạng Vàng, đóng 10tr) **xếp trên** bài của VIP02 (hạng Bạc, đóng 5tr) dù đăng sau
   - ✅ *Checklist: "Hội viên đóng phí nhiều hơn có bài xuất hiện cao hơn"* — cơ chế: `authorPriority` = tổng đóng góp
5. Click **"..."** trên bài vừa đăng → **Sửa bài** → đổi chữ → Lưu → thấy cập nhật
   - ✅ *Checklist: "Hội viên sửa/xóa bài của chính mình"*
6. Bấm icon **👍 Hữu ích** trên bài khác → số đếm tăng lên 1
   - ✅ *Checklist: "Bấm reaction Hữu ích, số đếm tăng"*

**💬 Nói với khách:** *"Ranking real-time: bất cứ khi nào admin xác nhận thanh toán, authorPriority của user cập nhật ngay, bài cũ của họ cũng tự lên top."*

---

## 🎬 PHẦN 5 — BÁO CÁO VI PHẠM & LOCK BÀI (3 phút)

> **Mục tiêu:** checklist mục **Tương tác — báo cáo + lock**

**👉 Tab 2 (VIP01):**

1. Chọn 1 bài của user khác → click **"..."** → **Báo cáo vi phạm**
2. Điền lý do → **Gửi**

**👉 Tab 3 (Admin):**

3. Vào `/admin/bao-cao` → thấy báo cáo mới
4. Click vào → **Khoá bài**

**👉 Tab 2 (VIP01) refresh Feed:**

5. Bài bị khoá hiện trạng thái **"🔒 Bài đã khoá"**, không xem được nội dung
   - ✅ *Checklist: "Bài bị lock hiện thông báo đã khóa, không đọc được nội dung"*

---

## 🎬 PHẦN 6 — FLOW CHỨNG NHẬN SẢN PHẨM (10 phút)

> **Mục tiêu:** checklist **Nộp đơn CN**, **Xét duyệt CN**, **Email**, **Verify badge**

### 6.1 — Nộp đơn

**👉 Tab 2 (VIP01 BUSINESS):**

1. Menu Sidebar → **"Chứng nhận SP"** → `/chung-nhan/lich-su`
   - Thấy list đơn cũ (nếu có) + nút **"Nộp đơn mới"**
   - ✅ *Checklist: "Vào menu Chứng nhận SP → thấy trang lịch sử + nút Nộp đơn mới"*
2. Click **Nộp đơn mới** → `/chung-nhan/nop-don`
3. Chọn sản phẩm DRAFT từ dropdown → điền mô tả → **upload PDF mẫu** → sang bước 2
4. Bước 2: điền số tài khoản hoàn tiền (bắt buộc — hiển thị đúng cho case bị từ chối)
5. Xem hướng dẫn thanh toán phí **5.000.000đ** (format CK rõ ràng: `CERT_{slug}_{id}`)
   - ✅ *Checklist: "Hướng dẫn thanh toán phí chứng nhận 5.000.000đ rõ ràng"*
6. Submit — thấy trạng thái "Chờ thanh toán"

### 6.2 — Admin confirm CK + duyệt

**👉 Tab 3 (Admin):**

7. `/admin/thanh-toan` → confirm payment `CERTIFICATION_FEE` → status → đơn chuyển sang `PENDING` (chờ xét duyệt)
8. `/admin/chung-nhan` → thấy đơn → click vào xem chi tiết
   - Xem được mô tả + **file PDF đính kèm** (click preview)
   - ✅ *Checklist: "Admin xem danh sách + chi tiết hồ sơ + tài liệu"*

9. **Demo 2 nhánh — duyệt và từ chối:**

   **Nhánh A — Duyệt:**
   - Click **Duyệt**
   - Vào `/san-pham/{slug}` public → thấy **badge "Đã chứng nhận"** hiển thị
   - ✅ *Checklist: "Badge xuất hiện trên trang sản phẩm"*
   - Tab 2 (VIP) nhận email *"Sản phẩm đã được chứng nhận"*

   **Nhánh B — Từ chối (nếu có 1 đơn khác):**
   - Click **Từ chối** → nhập lý do
   - Hệ thống hiển thị **số TK hoàn tiền của user** ngay trên modal (để admin chuyển khoản)
   - ✅ *Checklist: "Admin từ chối → hệ thống hiển thị số TK để hoàn tiền"*
   - User nhận email thông báo từ chối

### 6.3 — Verify badge public

**👉 Tab 1 incognito:**

10. Vào `/san-pham/{slug}` → click nút **"Xác thực chứng nhận"** → mở `/verify/{certCode}`
11. Thấy trang verify public: tên SP, DN cấp phép, ngày cấp, trạng thái ✅
    - ✅ *Checklist: "Bất kỳ ai kiểm tra xác thực badge"*

**💬 Nói với khách:** *"URL verify có thể in QR code vào bao bì SP. Khách hàng cuối scan là verify ngay, không cần app."*

---

## 🎬 PHẦN 7 — VIP HẾT HẠN (2 phút)

> **Mục tiêu:** checklist mục **Phân quyền VIP hết hạn**

**👉 Setup trước buổi demo:** chuẩn bị 1 tài khoản `expired@demo.vn` có `membershipExpires` = hôm qua.

**👉 Tab 1 incognito:**

1. Login bằng `expired@demo.vn`
2. Click **"Gia hạn"** trong user menu (chỉ menu này có)
   - Sidebar giờ chỉ còn mục **"Gia hạn"** (các mục khác ẩn)
   - ✅ *Checklist: "VIP hết hạn → redirect tự động đến trang Gia hạn"*
3. Nếu thử vào `/tong-quan` hoặc `/chung-nhan/lich-su` → proxy tự động đưa về `/gia-han`

**💬 Nói với khách:** *"UX friction có chủ đích — user hết hạn chỉ có 1 đường duy nhất là nạp tiền để mở khoá lại tính năng."*

---

## 🎬 PHẦN 8 — ADMIN ACCESS CONTROL (1 phút)

> **Mục tiêu:** checklist mục **Phân quyền không vào /admin**

**👉 Tab 2 (VIP01):**

1. Gõ thẳng URL `/admin` vào thanh địa chỉ
2. Browser redirect về `/` (trang chủ), không vào được
   - ✅ *Checklist: "Tài khoản VIP không truy cập được /admin"*

---

## 🎬 PHẦN 9 — TỔNG KẾT & CÂU HỎI (2 phút)

**Recap nhanh các mục checklist đã tick:**

- ✅ Feed: đăng bài, xem bài, ranking theo đóng góp, blur guest
- ✅ Tương tác: reaction, báo cáo, lock
- ✅ Chứng nhận SP end-to-end: nộp → thanh toán → duyệt → badge → verify
- ✅ Email: đăng ký (đặt mật khẩu), duyệt/từ chối CN, xác nhận CK
- ✅ Phân quyền: Guest / VIP / VIP hết hạn / Admin đều đúng

**Lưu ý với khách (tính minh bạch):**

1. **Email cảnh báo gia hạn sắp hết (trước X ngày)** — **chưa triển khai** trong GĐ2 (chỉ có flow gửi mail khi admin confirm payment). Nếu cần đưa vào GĐ2 → phụ lục bổ sung; nếu không → dời sang GĐ sau.
2. **Reaction chỉ có 1 loại "Hữu ích"** — schema đã sẵn sàng mở rộng multi-reaction sau.

---

## 🧯 FALLBACK / XỬ LÝ KHI CÓ SỰ CỐ

| Sự cố | Xử lý |
|---|---|
| Email không đến | Mở Resend dashboard kiểm Delivery log. Nếu gửi thành công → check Spam của Gmail. Nếu fail → fallback sang Google OAuth (không cần email). |
| Reaction số không tăng | Hard refresh (Ctrl+Shift+R). Nếu vẫn lỗi → kiểm DB trực tiếp: `SELECT COUNT(*) FROM post_reactions WHERE post_id = ...` |
| Admin không thấy đơn CN | Check filter tab (Pending/All). Refresh trang. |
| Verify badge 404 | Kiểm `certCode` đúng không — có thể nhầm với cert `id`. URL đúng là `/verify/{certCode}` nơi certCode format `CERT-XXXXXX`. |
| User hết hạn vẫn thấy sidebar đầy đủ | JWT stale — yêu cầu **đăng xuất + đăng nhập lại** (hoặc đợi 60s để auto-refresh). |

---

## 📋 CHECKLIST TICK NHANH TRONG DEMO

Dùng bản này tick trực tiếp:

| # | Mục | ✅/❌ |
|---|---|---|
| 1 | Guest Feed blur sau 3 bài | ☐ |
| 2 | Đăng ký → nhận email đặt mật khẩu | ☐ |
| 3 | GUEST → VIP qua kết nạp | ☐ |
| 4 | VIP đóng phí → admin confirm → active | ☐ |
| 5 | VIP đăng bài (nội dung + ảnh) | ☐ |
| 6 | Ranking Feed theo đóng góp | ☐ |
| 7 | Sửa/xoá bài của chính mình | ☐ |
| 8 | Reaction Hữu ích | ☐ |
| 9 | Báo cáo vi phạm | ☐ |
| 10 | Admin lock bài | ☐ |
| 11 | Nộp đơn CN (form đầy đủ) | ☐ |
| 12 | Hướng dẫn CK phí CN 5tr | ☐ |
| 13 | Admin xem chi tiết đơn + tài liệu | ☐ |
| 14 | Admin duyệt → badge + email | ☐ |
| 15 | Admin từ chối → show TK hoàn tiền + email | ☐ |
| 16 | Verify badge public `/verify/[code]` | ☐ |
| 17 | VIP hết hạn → chỉ vào được `/gia-han` | ☐ |
| 18 | VIP không vào được `/admin` | ☐ |

---

*Cập nhật cuối: Round-8. Tham khảo: [Checklist nghiệm thu GĐ2 (Google Docs)](https://docs.google.com/document/d/1WbL31Zypcyj7JC45_kf1UHsr49TQbK5m/edit), [phase-2-acceptance-tests]*
