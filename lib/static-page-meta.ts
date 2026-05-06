export type StaticPageKey =
  | "about"
  | "contact"
  | "companies"
  | "certProducts"
  | "home"
  | "dieuLe"

export interface StaticTextMeta {
  key: string
  label: string
  description?: string
  type: "text" | "textarea" | "richtext" | "image"
}

export interface StaticPageMeta {
  label: string
  /** Khi messages namespace ≠ pageKey (vd page "home" edit text trong namespace
   *  "footer" của messages files). Mặc định fallback dùng namespace = pageKey. */
  fallbackNamespace?: string
  /** Một số page (vd "dieuLe") không edit text-config — chỉ upload file PDF
   *  per locale. Workbench sẽ render UI riêng thay vì TextConfigEditor. */
  items: StaticTextMeta[]
  /** Custom kind — workbench render UI khác:
   *  - "text-cms" (mặc định): mockup + TextConfigEditor 2 cột
   *  - "dieu-le": full-width mockup + DieuLe file uploaders inline */
  kind?: "text-cms" | "dieu-le"
}

export const STATIC_PAGES: Record<StaticPageKey, StaticPageMeta> = {
  about: {
    label: "Giới thiệu (v2)",
    items: [
      // Hero
      { key: "heroEyebrow", label: "Hero: Eyebrow", type: "text" },
      { key: "heroTitle", label: "Hero: Tiêu đề", type: "text" },
      { key: "heroSub", label: "Hero: Mô tả phụ", type: "textarea" },

      // Intro
      { key: "introEyebrow", label: "Intro: Eyebrow", type: "text" },
      { key: "introTitle", label: "Intro: Tiêu đề", type: "text" },
      { key: "introLead1", label: "Intro: Đoạn dẫn 1", type: "textarea" },
      { key: "introLead2", label: "Intro: Đoạn dẫn 2", type: "textarea" },
      { key: "introQuote", label: "Intro: Câu trích dẫn", type: "textarea" },
      { key: "introImage", label: "Intro: Ảnh minh hoạ (right side)", type: "image" },
      { key: "introImageCaption", label: "Intro: Chú thích ảnh", type: "text" },

      // Leadership
      { key: "leadershipEyebrow", label: "Lãnh đạo: Eyebrow", type: "text" },
      { key: "leadershipHeading", label: "Lãnh đạo: Tiêu đề", type: "text" },

      // Org Chart
      { key: "orgTitle", label: "Sơ đồ: Tiêu đề", type: "text" },
      { key: "orgSub", label: "Sơ đồ: Mô tả phụ", type: "text" },

      // Members
      { key: "membersEyebrow", label: "Hội viên: Eyebrow", type: "text" },
      { key: "membersHeading", label: "Hội viên: Tiêu đề", type: "text" },
      { key: "membersLead", label: "Hội viên: Mô tả phụ ({count} = số hội viên)", type: "textarea" },

      // CTA
      { key: "ctaEyebrow", label: "CTA: Eyebrow", type: "text" },
      { key: "ctaTitle", label: "CTA: Tiêu đề", type: "text" },
      { key: "ctaDesc", label: "CTA: Mô tả", type: "textarea" },
    ],
  },
  contact: {
    label: "Liên hệ",
    items: [
      // Cột trái — Thông tin liên hệ
      { key: "contactInfo", label: "Tiêu đề cột trái (Thông tin liên hệ)", type: "text" },
      { key: "phone", label: "Nhãn: Điện thoại", type: "text" },
      { key: "email", label: "Nhãn: Email", type: "text" },
      { key: "address", label: "Nhãn: Địa chỉ", type: "text" },
      { key: "website", label: "Nhãn: Website", type: "text" },
      { key: "workingHours", label: "Nhãn: Giờ làm việc", type: "text" },
      { key: "workingHoursValue", label: "Giá trị: Giờ làm việc (vd Thứ 2 - Thứ 6: 8:00 - 17:00)", type: "text" },
      { key: "socialMedia", label: "Nhãn: Mạng xã hội", type: "text" },

      // Cột phải — Form liên hệ nhanh
      { key: "quickMessage", label: "Tiêu đề cột phải (Gửi tin nhắn nhanh)", type: "text" },
    ],
  },
  companies: {
    label: "Doanh nghiệp",
    items: [
      // Top — Hero (full edit)
      { key: "heroEyebrow", label: "Hero: Eyebrow", type: "text" },
      { key: "heroTitle", label: "Hero: Tiêu đề (HTML)", type: "textarea" },
      { key: "heroSub", label: "Hero: Mô tả phụ", type: "textarea" },
      { key: "statCompanies", label: "Hero · Stat 1: Nhãn (doanh nghiệp)", type: "text" },
      { key: "statCertProducts", label: "Hero · Stat 2: Nhãn (sản phẩm chứng nhận)", type: "text" },
      { key: "statHeritageYears", label: "Hero · Stat 3: Nhãn (năm di sản)", type: "text" },
      { key: "ctaJoin", label: "Hero · Nút CTA (khách)", type: "text" },
      { key: "ctaFeatured", label: "Hero · Nút CTA (đã đăng nhập)", type: "text" },

      // Middle — section headers only
      { key: "featuredEyebrow", label: "Tiêu biểu: Eyebrow", type: "text" },
      { key: "featuredTitle", label: "Tiêu biểu: Tiêu đề", type: "text" },
      { key: "directoryEyebrow", label: "Danh bạ: Eyebrow", type: "text" },
      { key: "directoryTitle", label: "Danh bạ: Tiêu đề", type: "text" },

      // Bottom — Aspiration CTA (full edit)
      { key: "ctaJoinEyebrow", label: "CTA dưới: Eyebrow", type: "text" },
      { key: "ctaJoinTitle", label: "CTA dưới: Tiêu đề chính", type: "text" },
      { key: "ctaJoinTitleEm", label: "CTA dưới: Phần in nghiêng (cuối tiêu đề)", type: "text" },
      { key: "ctaJoinDesc", label: "CTA dưới: Mô tả", type: "textarea" },
      { key: "benefit1Title", label: "Lợi ích 01: Tiêu đề", type: "text" },
      { key: "benefit1Desc", label: "Lợi ích 01: Mô tả", type: "textarea" },
      { key: "benefit2Title", label: "Lợi ích 02: Tiêu đề", type: "text" },
      { key: "benefit2Desc", label: "Lợi ích 02: Mô tả ({validity} = số năm hiệu lực)", type: "textarea" },
      { key: "benefit3Title", label: "Lợi ích 03: Tiêu đề", type: "text" },
      { key: "benefit3Desc", label: "Lợi ích 03: Mô tả", type: "textarea" },
    ],
  },
  certProducts: {
    label: "Sản phẩm chứng nhận",
    items: [
      // Top — Hero (full edit)
      { key: "heroEyebrow", label: "Hero: Eyebrow", type: "text" },
      { key: "heroTitle1", label: "Hero: Tiêu đề dòng 1", type: "text" },
      { key: "heroTitle2", label: "Hero: Tiêu đề dòng 2", type: "text" },
      { key: "heroTitleCouncil", label: "Hero: Tiêu đề — phần highlight ({count} = số thành viên HĐ)", type: "text" },
      { key: "heroTitleSuffix", label: "Hero: Tiêu đề dòng cuối", type: "text" },
      { key: "heroSub", label: "Hero: Mô tả phụ ({validity} = số năm hiệu lực)", type: "textarea" },
      { key: "statProducts", label: "Hero · Stat 1: Nhãn (sản phẩm)", type: "text" },
      { key: "statCompanies", label: "Hero · Stat 2: Nhãn (doanh nghiệp)", type: "text" },
      { key: "statMonthsActive", label: "Hero · Stat 3: Nhãn (tháng hoạt động)", type: "text" },
      { key: "ctaSubmit", label: "Hero · Nút CTA: Nộp đơn", type: "text" },
      { key: "ctaProcess", label: "Hero · Nút CTA: Xem quy trình ({validity})", type: "text" },

      // Middle — section headers only
      { key: "processEyebrow", label: "Quy trình: Eyebrow", type: "text" },
      { key: "processTitle", label: "Quy trình: Tiêu đề", type: "text" },
      { key: "featuredEyebrow", label: "Tiêu biểu: Eyebrow", type: "text" },
      { key: "featuredTitle", label: "Tiêu biểu: Tiêu đề", type: "text" },
      { key: "directoryEyebrow", label: "Danh sách: Eyebrow", type: "text" },
      { key: "directoryTitle", label: "Danh sách: Tiêu đề", type: "text" },

      // Bottom — Aspiration CTA (full edit)
      { key: "aspirationEyebrow", label: "CTA dưới: Eyebrow", type: "text" },
      { key: "aspirationTitle", label: "CTA dưới: Tiêu đề chính", type: "text" },
      { key: "aspirationTitleEm", label: "CTA dưới: Phần in nghiêng (cuối tiêu đề)", type: "text" },
      { key: "aspirationDesc", label: "CTA dưới: Mô tả", type: "textarea" },
      { key: "miniStep1", label: "CTA dưới · Mini step 1: Nộp đơn", type: "text" },
      { key: "miniStep2", label: "CTA dưới · Mini step 2: Hội đồng", type: "text" },
      { key: "miniStep3", label: "CTA dưới · Mini step 3: Thẩm định", type: "text" },
      { key: "miniStep4", label: "CTA dưới · Mini step 4: Chứng nhận", type: "text" },
      { key: "aspirationCta", label: "CTA dưới: Nút CTA", type: "text" },
      { key: "aspirationNote", label: "CTA dưới: Ghi chú phí", type: "text" },
    ],
  },
  home: {
    label: "Trang chủ",
    // Footer text nằm ở messages.footer.json — page key dùng "home" để URL
    // /admin/trang-tinh?page=home phản ánh đúng vùng đang edit (footer xuất
    // hiện ở mọi page, nhưng đặc trưng cho homepage layout).
    fallbackNamespace: "footer",
    items: [
      // Brand block (cột trái footer)
      { key: "brandDescDefault", label: "Mô tả thương hiệu (cột trái)", type: "textarea" },
      { key: "establishedNotice", label: "Ghi chú thành lập (dưới mô tả)", type: "textarea" },
      { key: "copyrightNoticeDefault", label: "Cảnh báo sao chép (sticky note vàng)", type: "textarea" },

      // Cột Lãnh đạo
      { key: "leadership", label: "Cột Lãnh đạo: Heading", type: "text" },
      { key: "chairman", label: "Cột Lãnh đạo: Nhãn Chủ tịch", type: "text" },
      { key: "viceChairman", label: "Cột Lãnh đạo: Nhãn Phó Chủ tịch", type: "text" },
      { key: "secretaryGeneral", label: "Cột Lãnh đạo: Nhãn Tổng Thư ký", type: "text" },
      { key: "chiefOfOffice", label: "Cột Lãnh đạo: Nhãn Chánh Văn Phòng", type: "text" },

      // Cột Liên kết nhanh
      { key: "quickLinks", label: "Cột Liên kết nhanh: Heading", type: "text" },

      // Cột Liên hệ
      { key: "contact", label: "Cột Liên hệ: Heading", type: "text" },

      // Cột Giờ làm việc
      { key: "workingHours", label: "Cột Giờ làm việc: Heading", type: "text" },
      { key: "workingHoursDefault", label: "Cột Giờ làm việc: Giá trị (vd Thứ 2 - Thứ 6: 8:00 - 17:00)", type: "text" },

      // Bottom bar
      { key: "copyright", label: "Bottom bar: Copyright ({year} = năm hiện tại)", type: "text" },
      { key: "privacyPolicy", label: "Bottom bar: Link Privacy Policy", type: "text" },
      { key: "termsOfService", label: "Bottom bar: Link Terms of Service", type: "text" },
    ],
  },
  dieuLe: {
    label: "Điều lệ",
    // Page này không edit text-config (data nằm ở SiteConfig với key
    // dieu_le_drive_file_id{_locale}, không phải StaticPageConfig). Workbench
    // render full-width mockup + 3 file uploader (vi/en/zh) inline.
    kind: "dieu-le",
    items: [],
  },
}
