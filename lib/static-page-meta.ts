export type StaticPageKey = "about" | "contact" | "home"

export interface StaticTextMeta {
  key: string
  label: string
  description?: string
  type: "text" | "textarea" | "richtext"
}

export interface StaticPageMeta {
  label: string
  items: StaticTextMeta[]
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
      
      // Org Chart
      { key: "orgTitle", label: "Sơ đồ: Tiêu đề", type: "text" },
      { key: "orgSub", label: "Sơ đồ: Mô tả phụ", type: "text" },

      // CTA
      { key: "ctaEyebrow", label: "CTA: Eyebrow", type: "text" },
      { key: "ctaTitle", label: "CTA: Tiêu đề", type: "text" },
      { key: "ctaDesc", label: "CTA: Mô tả", type: "textarea" },
    ],
  },
  contact: {
    label: "Liên hệ",
    items: [
      { key: "heroTitle", label: "Tiêu đề Hero", type: "text" },
      { key: "heroDesc", label: "Mô tả Hero", type: "textarea" },
      { key: "contactInfo", label: "Tiêu đề Thông tin liên hệ", type: "text" },
    ],
  },
  home: {
    label: "Trang chủ",
    items: [
      { key: "businessNews", label: "Tiêu đề Tin doanh nghiệp", type: "text" },
      { key: "productNews", label: "Tiêu đề Tin sản phẩm", type: "text" },
    ],
  },
}
