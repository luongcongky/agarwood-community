# Hướng dẫn Setup SEO sau khi Deploy

Tài liệu này dành cho admin/owner website **hoitramhuong.vn** để hoàn thiện phần SEO **sau khi đã deploy code lên production**.

Code cho toàn bộ SEO (indexing, scoring, E-E-A-T, performance) đã được triển khai ở Phase 1–5. Tài liệu này tập trung vào **phần config bên ngoài code** — những việc phải làm trên dashboard của Google / Bing / DNS provider để Google biết đến website, theo dõi hiệu quả, và tăng ranking dài hạn.

---

## Mục lục

1. [Độ ưu tiên](#1-độ-ưu-tiên--cái-gì-bắt-buộc-cái-gì-bỏ-được)
2. [Google Search Console (BẮT BUỘC)](#2-google-search-console-bắt-buộc)
3. [Google Analytics 4 — Verify Web Vitals](#3-google-analytics-4--verify-web-vitals)
4. [Bing Webmaster Tools (tùy chọn)](#4-bing-webmaster-tools-tùy-chọn)
5. [Validate Structured Data](#5-validate-structured-data)
6. [Backlink & PR Strategy](#6-backlink--pr-strategy-không-phải-code)
7. [Dashboard theo dõi](#7-dashboard-tổng-hợp-khuyến-nghị)
8. [Checklist nhanh](#8-checklist-nhanh)

---

## 1. Độ ưu tiên — cái gì bắt buộc, cái gì bỏ được

Nếu không có nhiều thời gian, đây là thứ tự ưu tiên thật sự.

### 🔴 BẮT BUỘC — ảnh hưởng cao nếu bỏ

| Việc | Thời gian | Vì sao bắt buộc |
|---|---|---|
| **Verify GSC** + submit sitemap | 30 phút (1 lần duy nhất) | Không có GSC = không biết Google crawl có lỗi gì không, không biết user search từ khóa nào. Giống như không có hệ thống báo cháy |
| **Test Rich Results** cho 3 URL | 5 phút | Đảm bảo JSON-LD không có bug cú pháp |
| **Share bài lên Fanpage/Zalo** | 5 phút/tuần | Backlink + social signal tối thiểu |

### 🟡 NÊN LÀM — ảnh hưởng trung bình

| Việc | Thời gian | Vì sao nên làm |
|---|---|---|
| Request indexing bài nổi bật | 10 phút | Bài mới được index trong 1–3 ngày thay vì 1–2 tuần |
| Setup alerts email trong GSC | 2 phút | Nhận email khi có crawl error / manual action |

### 🟢 CÓ THỂ BỎ — ảnh hưởng thấp

- **Bing Webmaster** — chỉ ~3% traffic Việt Nam
- **PR báo chí** — chỉ khi có sự kiện lớn
- **Guest post / trao đổi link** — chỉ khi có quan hệ sẵn
- **Dashboard Google Sheet** — chỉ khi cần báo cáo

### Lưu ý quan trọng

> Google **VẪN SẼ** tự tìm và index website qua file `robots.txt` (đã có link sitemap từ Phase 1 của code). Không làm Phase 6 không có nghĩa là Google không biết đến website — chỉ là bạn bị **mù hoàn toàn** về việc nó đang hoạt động ra sao.

---

## 2. Google Search Console (BẮT BUỘC)

### 2.1 — Verify domain ownership

1. Vào https://search.google.com/search-console
2. Click **Add property** → chọn **Domain** (KHÔNG phải "URL prefix")
3. Nhập `hoitramhuong.vn`
4. Google hiển thị một bản ghi **TXT DNS** dạng:
   ```
   google-site-verification=abc123...xyz
   ```
5. Vào nhà cung cấp domain (Namecheap / GoDaddy / Cloudflare / Vinahost / …) → DNS settings → thêm record:
   - **Type:** TXT
   - **Host/Name:** `@` (hoặc để trống, tùy UI)
   - **Value:** `google-site-verification=abc123...xyz`
   - **TTL:** mặc định (auto / 1 giờ)
6. Chờ 5–30 phút cho DNS lan → quay lại Search Console → click **Verify**

**Xử lý lỗi:**
- Nếu Verify fail: đợi thêm 1–2 giờ, DNS chưa lan hết
- Kiểm tra DNS đã thêm đúng bằng: `nslookup -type=TXT hoitramhuong.vn` (terminal) hoặc https://mxtoolbox.com/txtlookup.aspx

### 2.2 — Submit sitemap

1. Trong Search Console, chọn property vừa verify
2. Sidebar trái → **Sitemaps**
3. Nhập: `sitemap.xml`
   (URL đầy đủ sẽ là `https://hoitramhuong.vn/sitemap.xml`)
4. Click **Submit**
5. Sau ~1 giờ sẽ báo **Success** + hiện số URL đã discover

### 2.3 — Request indexing cho bài nổi bật

Cho những bài quan trọng nhất (bạn muốn Google index sớm):

1. Sidebar trái → **URL Inspection**
2. Dán URL đầy đủ: `https://hoitramhuong.vn/tin-tuc/ten-bai-viet`
3. Đợi kiểm tra (~30s)
4. Click **Request Indexing**
5. Google sẽ crawl trong 1–3 ngày

> **Giới hạn:** ~10 request/ngày. Các URL khác sẽ được crawl tự động qua sitemap trong 1–2 tuần.

### 2.4 — Setup email alerts

1. Click icon ⚙️ (góc trên phải)
2. **Preferences** → bật **Email notifications**
3. Google sẽ gửi email khi có:
   - Crawl error (bot không vào được trang)
   - Structured data error (JSON-LD sai)
   - Manual action (Google phạt site)
   - Traffic drop đột ngột

---

## 3. Google Analytics 4 — Verify Web Vitals

GA4 đã được cài sẵn (có `NEXT_PUBLIC_GA_ID` trong env). Sau deploy Phase 5 (code đã xong), Web Vitals sẽ tự động gửi events lên GA4.

### 3.1 — Xem Web Vitals events

1. Vào https://analytics.google.com
2. Chọn property
3. Sidebar **Reports** → **Engagement** → **Events**
4. Chờ 24–48h sau deploy để có dữ liệu
5. Sẽ thấy 5 events tự động:
   - `LCP` — Largest Contentful Paint (ms)
   - `INP` — Interaction to Next Paint (ms)
   - `CLS` — Cumulative Layout Shift (×1000)
   - `FCP` — First Contentful Paint (ms)
   - `TTFB` — Time To First Byte (ms)

### 3.2 — Tạo custom report (tùy chọn)

Xem trang nào có LCP chậm nhất:

1. Menu **Explore** → **Free form**
2. **Dimensions:** Event name, Page path
3. **Metrics:** Event count, Average event value
4. **Filter:** Event name = LCP
5. Sort theo Average event value DESC

### 3.3 — Target benchmark

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | < 2500 ms | 2500–4000 ms | > 4000 ms |
| INP | < 200 ms | 200–500 ms | > 500 ms |
| CLS | < 100 (×1000) | 100–250 | > 250 |
| FCP | < 1800 ms | 1800–3000 ms | > 3000 ms |
| TTFB | < 800 ms | 800–1800 ms | > 1800 ms |

---

## 4. Bing Webmaster Tools (tùy chọn)

Chiếm ~3% traffic Việt Nam. Setup 10 phút.

1. Vào https://www.bing.com/webmasters
2. Click **Sign in** → login bằng Microsoft account
3. **Import from Google Search Console** — Bing có tính năng này:
   - Link GSC account → import tất cả property + sitemap trong 1 click
4. Hoặc làm thủ công:
   - Add site → verify via DNS tương tự GSC
   - Submit sitemap: `https://hoitramhuong.vn/sitemap.xml`

---

## 5. Validate Structured Data

Sau deploy, kiểm tra JSON-LD của các bài viết hợp lệ.

### 5.1 — Rich Results Test (nhanh, chính thức)

1. Vào https://search.google.com/test/rich-results
2. Dán URL: `https://hoitramhuong.vn/tin-tuc/ten-bai-bat-ky`
3. Click **Test URL**
4. Kỳ vọng thấy:
   - ✅ **NewsArticle** — hợp lệ
   - ✅ **BreadcrumbList** — hợp lệ

**Nếu báo lỗi** → chụp màn hình gửi dev để fix.

### 5.2 — Schema.org validator (chi tiết hơn, tùy chọn)

https://validator.schema.org/ — Dán URL tương tự.

Validator này strict hơn, phát hiện được cả warning, không chỉ error.

### 5.3 — Nên test 3 loại trang

- 1 bài tin tức bình thường: `/tin-tuc/[slug]`
- 1 bài nghiên cứu: `/nghien-cuu/[slug]`
- Trang listing: `/tin-tuc` (có CollectionPage schema)

---

## 6. Backlink & PR Strategy (KHÔNG phải code)

Đây là phần **tăng ranking dài hạn quan trọng nhất**. Google coi backlink là "phiếu bầu uy tín" — website khác link về càng nhiều, website bạn càng đáng tin.

> **Sự thật khó chịu:** Nếu không có backlink, dù on-page SEO perfect 100/100, website sẽ **vĩnh viễn khó lên top**. Đối thủ có backlink sẽ luôn xếp trên bạn.

### 6.1 — Social seeding (ngay lập tức, dễ nhất)

- **Fanpage Facebook**: mỗi bài mới → share kèm caption hấp dẫn
- **Zalo OA**: broadcast mỗi khi có bài nổi bật
- **YouTube community post**: tóm tắt video về chủ đề, link về website

### 6.2 — Community outreach (công sức trung bình)

Tìm forum/group Facebook về trầm hương:
- "Hội trầm hương Việt Nam"
- "Trầm hương Khánh Hòa"
- "Đam mê trầm hương"
- "Tinh dầu trầm hương"

Quy tắc:
- Tham gia tích cực 2–3 tuần trước khi share link
- Share bài viết chỉ khi **thật sự trả lời câu hỏi đang thảo luận**
- KHÔNG spam — admin group sẽ ban

### 6.3 — PR báo chí (công sức cao, tác dụng mạnh)

- Viết thông cáo báo chí cho:
  - Sự kiện hội thảo
  - Bài nghiên cứu khoa học nổi bật
  - Công bố chứng nhận sản phẩm
- Gửi báo địa phương: **Báo Khánh Hòa**, **Báo Quảng Nam** (vùng trồng trầm)
- Báo chuyên ngành: **Báo Nông Nghiệp Việt Nam**, **VnExpress Kinh Doanh**

> **1 backlink từ báo lớn ≈ 10–50 backlink từ forum** về mặt giá trị SEO.

### 6.4 — Guest post / trao đổi link

Tìm website khác cùng chủ đề:
- Y học cổ truyền
- Thủ công mỹ nghệ
- Sản vật Việt Nam
- Nông sản đặc sản

Đề xuất:
- Trao đổi bài viết (bạn viết bài cho họ + họ viết bài cho bạn)
- Hoặc xin link trong danh sách "cộng đồng liên kết" / "partner"

---

## 7. Dashboard tổng hợp (khuyến nghị)

Sau 1 tháng, tạo 1 Google Sheet đơn giản theo dõi hàng tuần:

| Tuần | Số bài đã index | Impression (GSC) | Click (GSC) | CTR | Vị trí TB | LCP (GA4) | Ghi chú |
|---|---|---|---|---|---|---|---|
| T1/5/2026 | 15 | 120 | 5 | 4.2% | 18.3 | 1.8s | — |
| T2/5/2026 | 22 | 185 | 11 | 5.9% | 15.7 | 1.7s | Post on Fanpage |

**Nguồn số liệu:**
- **Số bài đã index, Impression, Click, CTR, Vị trí TB**: Search Console → **Performance** tab
- **LCP**: GA4 → Reports → Engagement → Events → LCP (average)

### Chỉ tiêu kỳ vọng sau 3 tháng

- ✅ 50+ bài được Google index
- ✅ 1000+ impression/tuần
- ✅ CTR > 3%
- ✅ Vị trí trung bình top 20 (trang 1–2 của Google)
- ✅ LCP trung bình < 2.5s

---

## 8. Checklist nhanh

### ⚡ Ngay sau deploy (30 phút tổng)

- [ ] Verify domain trong Google Search Console (DNS TXT)
- [ ] Submit `sitemap.xml` trong GSC
- [ ] Bật email notifications trong GSC preferences
- [ ] Test 3 URL bằng Rich Results Test:
  - [ ] 1 bài `/tin-tuc/[slug]`
  - [ ] 1 bài `/nghien-cuu/[slug]`
  - [ ] Trang listing `/tin-tuc`
- [ ] Request indexing cho 10–20 bài nổi bật

### 📅 48h sau deploy

- [ ] Verify Web Vitals events xuất hiện trong GA4
- [ ] Kiểm tra sitemap báo "Success" trong GSC
- [ ] Xác nhận số URL trong sitemap hợp lý (≈ tổng số bài đã publish)

### 🗓 Hàng tuần

- [ ] Check GSC "Coverage" — có bài nào bị lỗi index không
- [ ] Cập nhật Google Sheet dashboard
- [ ] Share bài mới lên Fanpage/Zalo

### 📆 Hàng tháng

- [ ] Tìm 1–2 cơ hội backlink mới
- [ ] Review Core Web Vitals trends trong GA4
- [ ] Review bài nào có CTR thấp bất thường (có thể title/meta chưa hấp dẫn)

### 🏆 Hàng quý

- [ ] PR 1 bài nghiên cứu nổi bật ra báo
- [ ] Re-audit website bằng Lighthouse
- [ ] So sánh ranking với đối thủ (công cụ: Ahrefs, Ubersuggest, SEMrush — phiên bản free đủ dùng)

---

## 9. Khi gặp vấn đề

### "Sitemap submit báo 'Couldn't fetch'"

- Kiểm tra `https://hoitramhuong.vn/sitemap.xml` mở được trong trình duyệt không
- Nếu không → có thể `robots.txt` đang block hoặc server chưa lên
- Nếu có → chờ 24h rồi thử submit lại, Google cache đôi khi lâu

### "URL báo 'Crawled - not indexed'"

- Không phải lỗi, chỉ là Google chọn không index bài này
- Thường do: nội dung quá ngắn, trùng lặp với bài khác, hoặc chất lượng thấp
- **Cách xử lý:** cải thiện điểm SEO của bài (dùng editor panel), thêm nội dung, request reindex

### "Rich Results Test báo error"

- Chụp màn hình + gửi cho dev
- Mỗi error thường là 1 field JSON-LD thiếu (ví dụ `image` không hợp lệ, `publisher.logo` không có `width/height`)

### "LCP không hiện trong GA4"

- Chờ 48h — data mới đổ vào GA4 có lag
- Nếu 48h vẫn không có → dev kiểm tra `WebVitalsReporter` component có được mount không

### "Rank không lên dù đã làm đủ mọi thứ"

- SEO cần **3–6 tháng** để thấy kết quả rõ. Kiên nhẫn.
- Nếu sau 6 tháng vẫn không có traffic: cần kiểm tra competitors backlink profile, có thể cần đầu tư PR mạnh hơn

---

## 10. Liên kết tham khảo

- Google Search Console: https://search.google.com/search-console
- Google Analytics: https://analytics.google.com
- Bing Webmaster: https://www.bing.com/webmasters
- Rich Results Test: https://search.google.com/test/rich-results
- Schema.org validator: https://validator.schema.org/
- PageSpeed Insights: https://pagespeed.web.dev/
- DNS TXT lookup: https://mxtoolbox.com/txtlookup.aspx
- Google Web Vitals docs: https://web.dev/vitals/

---

*Tài liệu này được viết cho website [hoitramhuong.vn](https://hoitramhuong.vn) sau khi hoàn thành Phase 1–5 code SEO.*
