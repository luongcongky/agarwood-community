export type StaticPageKey = "about" | "contact"

export interface StaticTextMeta {
  key: string
  label: string
  description?: string
  type: "text" | "textarea" | "richtext" | "image"
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
      { key: "heroTitle", label: "Tiêu đề Hero", type: "text" },
      { key: "heroDesc", label: "Mô tả Hero", type: "textarea" },
      { key: "contactInfo", label: "Tiêu đề Thông tin liên hệ", type: "text" },
    ],
  },
}
