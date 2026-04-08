---
name: frontend-review
description: Review và cải thiện giao diện frontend cho website Hội Trầm Hương Việt Nam. Sử dụng khi cần đánh giá UI/UX, cải thiện thiết kế trang, component, hoặc toàn bộ giao diện. Áp dụng tiêu chuẩn thiết kế đặc thù ngành trầm hương B2B cho đối tượng doanh nhân 40-60 tuổi.
---

Skill này hướng dẫn review và cải thiện giao diện frontend cho website cộng đồng B2B Hội Trầm Hương Việt Nam. Mọi đánh giá phải dựa trên bối cảnh thực tế của dự án, không áp dụng tiêu chuẩn thiết kế chung chung.

## Bối cảnh Dự án

- **Nền tảng**: Next.js 16 App Router + Tailwind CSS v4 + TypeScript
- **Đối tượng**: Doanh nhân ngành trầm hương Việt Nam, 40-60 tuổi, sử dụng cả desktop và mobile
- **Mục đích**: Cộng đồng B2B — kết nối doanh nghiệp, chứng nhận sản phẩm, chia sẻ kinh nghiệm
- **Tone**: Chuyên nghiệp, uy tín, truyền thống nhưng hiện đại — KHÔNG phải startup hay mạng xã hội giải trí
- **Brand palette**: Đã định nghĩa trong Tailwind — brand-50 đến brand-900 (tông nâu trầm/amber)

## Nguyên tắc Thiết kế Đặc thù

### 1. Typography — Đọc được là ưu tiên số 1
- Font phải đủ LỚN cho người dùng lớn tuổi: body tối thiểu 14px (text-sm), heading tối thiểu 18px
- Contrast ratio tối thiểu 4.5:1 cho body text, 3:1 cho heading
- Line-height thoáng: 1.6-1.75 cho body, 1.2-1.3 cho heading
- Font heading: Playfair Display (font-heading) — serif truyền thống, uy tín
- Font body: Inter — rõ ràng, dễ đọc
- KHÔNG dùng font mỏng (font-light) cho text quan trọng
- KHÔNG dùng text quá nhỏ (text-xs) cho thông tin quan trọng mà user cần đọc

### 2. Color — Tông trầm ấm, KHÔNG sặc sỡ
- Primary: brand-700 đến brand-900 (nâu trầm đậm) — thể hiện sự uy tín
- Accent: amber/yellow nhẹ — gợi liên tưởng đến trầm hương
- Success: green (xanh lá nhẹ) — cho trạng thái tích cực
- Warning: yellow/amber — cho cảnh báo
- Error: red nhẹ — cho lỗi
- KHÔNG dùng: tím, hồng, xanh dương sáng, gradient sặc sỡ
- KHÔNG dùng nền trắng thuần (#fff) cho card — dùng bg-white hoặc bg-card
- Badge chứng nhận: amber/vàng trầm nổi bật — đây là visual quan trọng nhất

### 3. Layout — Rõ ràng, Không rối
- Ưu tiên layout 1 cột cho nội dung chính, 2 cột (65/35) cho feed+sidebar
- Card có border rõ ràng (border-brand-200), rounded-xl, padding đủ rộng (p-5 đến p-6)
- Khoảng cách giữa sections: space-y-6 (24px)
- Mobile: 100% responsive, sidebar ẩn trên mobile, không dùng hover-only interaction
- KHÔNG dùng: layout phức tạp nhiều cột, overlap, diagonal, asymmetry — user lớn tuổi khó dùng
- KHÔNG dùng: animation phức tạp, parallax, scroll-triggered effects — gây rối

### 4. Components — Nhất quán và Quen thuộc
- Button: rounded-lg, padding đủ lớn (py-2.5 px-4), text rõ ràng (không dùng icon-only)
- Form: label rõ ràng phía trên input, placeholder gợi ý, error message dưới field
- Table: border rõ, header bg-brand-50, hover row nhẹ
- Tab: border-bottom active, không dùng tab dạng pill cho navigation chính
- Status badge: rounded-full, màu nền nhạt + text đậm (bg-green-100 text-green-700)
- Modal/Dialog: overlay tối, card trắng center, nút đóng rõ ràng

### 5. Motion — Tối giản, Có mục đích
- CHỈ dùng transition-colors và transition-opacity cho hover/focus
- Loading state: spinner đơn giản hoặc skeleton card
- KHÔNG dùng: animation phức tạp, staggered reveals, scroll animations
- KHÔNG dùng: custom cursor, parallax, particle effects
- Mọi transition: 150-200ms, ease-in-out

### 6. Hình ảnh — Thực tế và Uy tín
- Avatar: rounded-full, fallback bằng chữ cái đầu (bg-brand-200 text-brand-800)
- Product image: aspect-square, rounded-lg, object-cover
- Cover image: aspect 3:1, fallback gradient brand-700→brand-900
- Badge chứng nhận: nổi bật trên product card, kích thước đủ lớn để nhận ra
- KHÔNG dùng: stock photo generic, illustration cartoon, emoji thay cho icon quan trọng

## Checklist Review

Khi review một trang hoặc component, kiểm tra theo thứ tự:

### A. Accessibility & Readability (Quan trọng nhất)
- [ ] Font size đủ lớn cho người 40-60 tuổi?
- [ ] Contrast ratio đạt WCAG AA?
- [ ] Tất cả interactive elements có focus visible?
- [ ] Label đầy đủ cho form inputs?
- [ ] Error messages rõ ràng, bằng tiếng Việt?
- [ ] Không dùng color-only để truyền đạt thông tin?

### B. Responsive & Mobile
- [ ] Mobile-first, không broken trên màn hình nhỏ?
- [ ] Touch target tối thiểu 44x44px?
- [ ] Text không bị cắt hoặc tràn trên mobile?
- [ ] Sidebar ẩn đúng cách trên mobile?
- [ ] Table có overflow-x-auto?

### C. Visual Consistency
- [ ] Dùng đúng brand colors (không tự chế màu)?
- [ ] Card, border, shadow nhất quán?
- [ ] Spacing đều đặn (space-y-6, gap-4)?
- [ ] Status badges cùng style (rounded-full, cùng size)?
- [ ] Typography hierarchy rõ ràng (heading > subheading > body > caption)?

### D. UX Patterns
- [ ] Loading state cho mọi async action?
- [ ] Empty state không để trắng?
- [ ] Confirm dialog cho action destructive?
- [ ] Success/error feedback sau mọi form submit?
- [ ] Breadcrumb cho trang detail (SEO + navigation)?

### E. Đặc thù Ngành Trầm Hương
- [ ] Badge chứng nhận nổi bật (amber, kích thước lớn)?
- [ ] Tier hội viên (★/★★/★★★) hiển thị rõ?
- [ ] Tên công ty hiện cùng tên người (B2B context)?
- [ ] CTA không phải "Mua ngay" — mà là "Liên hệ doanh nghiệp"?
- [ ] Vùng nguyên liệu hiển thị nổi bật (Khánh Hòa, Quảng Nam...)?
- [ ] Năm thành lập doanh nghiệp hiển thị rõ (trust signal)?

## Output Format

Khi review, trả về:

1. **Tổng quan**: Đánh giá chung 1-2 câu
2. **Điểm tốt**: Những gì đã đúng (giữ lại)
3. **Cần cải thiện**: Liệt kê cụ thể với file:line, mức độ (Critical/Major/Minor)
4. **Code fix**: Đề xuất code cụ thể cho từng issue
5. **Screenshot mental model**: Mô tả layout mong muốn nếu cần restructure

Ưu tiên fix: Accessibility > Mobile > Visual > UX > Nice-to-have
