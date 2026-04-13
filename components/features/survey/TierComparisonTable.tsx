import { Check, X, Crown, Star, Circle } from "lucide-react"

interface Props {
  /** Highlight gói gợi ý (từ recommendation) */
  recommended?: "BASIC" | "SILVER" | "GOLD" | null
  /** Chế độ rút gọn cho màn nhỏ / kết quả */
  compact?: boolean
}

const FEATURES: Array<{
  section: string
  rows: Array<{
    label: string
    basic: string | boolean
    silver: string | boolean
    gold: string | boolean
    highlight?: boolean
  }>
}> = [
  {
    section: "Hiển thị & Thương hiệu",
    rows: [
      { label: "Hồ sơ cá nhân / doanh nghiệp trên hệ thống", basic: true, silver: true, gold: true },
      { label: "Hiển thị trang chủ Hội", basic: false, silver: "Ưu tiên trung bình", gold: "Ưu tiên CAO NHẤT", highlight: true },
      { label: "Badge xác minh (tick xanh)", basic: false, silver: true, gold: true },
      { label: "Logo + hình ảnh thương hiệu nổi bật", basic: false, silver: true, gold: "Banner cover full-width" },
    ],
  },
  {
    section: "Sản phẩm & Chứng nhận",
    rows: [
      { label: "Chứng nhận sản phẩm bởi Hội", basic: false, silver: "3 sản phẩm", gold: "KHÔNG GIỚI HẠN", highlight: true },
      { label: "Phí chứng nhận / sản phẩm", basic: "—", silver: "Giảm 10%", gold: "Giảm 20%" },
      { label: "Hiển thị top sản phẩm trang chủ", basic: false, silver: "1 sản phẩm", gold: "3 sản phẩm" },
    ],
  },
  {
    section: "Cộng đồng & Nội dung",
    rows: [
      { label: "Đăng bài Cộng đồng / tháng", basic: "15 bài", silver: "30 bài", gold: "KHÔNG GIỚI HẠN", highlight: true },
      { label: "Ghim bài lên Top", basic: false, silver: "1 bài/tháng", gold: "3 bài/tháng" },
      { label: "Tham gia Feed trao đổi hội viên", basic: true, silver: true, gold: true },
    ],
  },
  {
    section: "Marketing & Truyền thông",
    rows: [
      { label: "Banner quảng cáo trên website Hội", basic: false, silver: "1 banner/quý", gold: "3 banner/quý", highlight: true },
      { label: "Hỗ trợ viết bài PR / phỏng vấn", basic: false, silver: "1 bài/năm", gold: "4 bài/năm" },
      { label: "Quảng bá trên kênh đối tác Hội", basic: false, silver: false, gold: true },
    ],
  },
  {
    section: "Kết nối & Quyền lợi",
    rows: [
      { label: "Danh bạ hội viên toàn quốc", basic: true, silver: true, gold: true },
      { label: "Giới thiệu đối tác B2B", basic: false, silver: "Định kỳ", gold: "Ưu tiên cá nhân hóa" },
      { label: "Tham gia sự kiện / hội chợ", basic: "Tự túc", silver: "Giảm giá", gold: "MIỄN PHÍ" },
      { label: "Tư vấn pháp lý & xuất khẩu", basic: false, silver: "Email", gold: "Trực tiếp 1-1" },
      { label: "Quyền biểu quyết trong Đại hội", basic: false, silver: true, gold: true },
    ],
  },
]

const TIERS = {
  BASIC: {
    label: "Hội viên cơ bản",
    stars: 1,
    icon: Circle,
    color: "bg-brand-100 text-brand-700 border-brand-300",
    headerBg: "bg-gradient-to-b from-brand-50 to-white",
    priceBusiness: "Theo điều lệ Hội",
    priceIndividual: "Theo điều lệ Hội",
    cta: "Mặc định khi đăng ký",
    tagline: "Khởi đầu tham gia Hội",
  },
  SILVER: {
    label: "Hội viên Bạc",
    stars: 2,
    icon: Star,
    color: "bg-slate-100 text-slate-800 border-slate-400",
    headerBg: "bg-gradient-to-b from-slate-100 to-white",
    priceBusiness: "từ 10.000.000đ",
    priceIndividual: "từ 3.000.000đ",
    cta: "Phù hợp với DN vừa & nghệ nhân",
    tagline: "Phổ biến nhất",
  },
  GOLD: {
    label: "Hội viên Vàng",
    stars: 3,
    icon: Crown,
    color: "bg-amber-100 text-amber-900 border-amber-400",
    headerBg: "bg-gradient-to-b from-amber-100 to-amber-50",
    priceBusiness: "từ 20.000.000đ",
    priceIndividual: "từ 5.000.000đ",
    cta: "Tối ưu mọi quyền lợi",
    tagline: "Dành cho DN lớn",
  },
} as const

type TierKey = keyof typeof TIERS

export function TierComparisonTable({ recommended, compact }: Props) {
  const tierKeys: TierKey[] = ["BASIC", "SILVER", "GOLD"]

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
          So sánh các gói Hội viên nền tảng số
        </h2>
        <p className="text-sm text-brand-600 mt-2 max-w-2xl mx-auto">
          Lựa chọn gói phù hợp với quy mô &amp; định hướng phát triển của bạn.
          Mức phí được tính theo <strong>phí tích lũy của hội viên</strong> trong nhiệm kỳ — bao gồm phí hội viên cơ bản &amp; phí dịch vụ đã dùng.
        </p>
      </div>

      {/* Desktop: side-by-side cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {tierKeys.map((k) => {
          const tier = TIERS[k]
          const Icon = tier.icon
          const isRec = recommended === k
          return (
            <div
              key={k}
              className={`relative rounded-2xl border-2 ${isRec ? "border-amber-500 shadow-xl scale-[1.02]" : "border-brand-200"} ${tier.headerBg} overflow-hidden transition-all`}
            >
              {isRec && (
                <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-center py-1 text-xs font-bold uppercase tracking-wider">
                  ⭐ Gói phù hợp nhất với bạn
                </div>
              )}
              {k === "SILVER" && !isRec && (
                <div className="absolute top-0 right-0 bg-brand-700 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Phổ biến
                </div>
              )}
              <div className={`p-6 ${isRec ? "pt-10" : ""}`}>
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${tier.color} mb-3`}>
                  <Icon className="w-7 h-7" fill={k === "GOLD" ? "currentColor" : "none"} />
                </div>
                <h3 className="text-xl font-bold text-brand-900">{tier.label}</h3>
                <p className="text-xs text-brand-500 mt-0.5">{tier.tagline}</p>

                <div className="mt-4 space-y-2 border-t border-brand-200 pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-brand-500">Doanh nghiệp</span>
                    <span className="font-bold text-brand-900 text-sm">{tier.priceBusiness}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-brand-500">Cá nhân</span>
                    <span className="font-bold text-brand-900 text-sm">{tier.priceIndividual}</span>
                  </div>
                </div>
                <p className="text-xs text-brand-500 mt-3 italic">{tier.cta}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature matrix */}
      {!compact && (
        <div className="rounded-2xl border border-brand-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-brand-50 border-b border-brand-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-brand-700 w-[40%]">Tính năng</th>
                  {tierKeys.map((k) => (
                    <th key={k} className={`px-4 py-3 text-center font-semibold ${recommended === k ? "bg-amber-50 text-amber-900" : "text-brand-700"}`}>
                      {TIERS[k].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((group) => (
                  <FeatureGroup key={group.section} group={group} tierKeys={tierKeys} recommended={recommended} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-brand-500 italic pt-2">
        💡 Phí chính xác &amp; quy trình nâng cấp được Ban Quản trị Hội tư vấn cụ thể — đăng ký tư vấn để biết chi tiết.
      </p>
    </div>
  )
}

function FeatureGroup({ group, tierKeys, recommended }: {
  group: (typeof FEATURES)[number]
  tierKeys: TierKey[]
  recommended?: "BASIC" | "SILVER" | "GOLD" | null
}) {
  return (
    <>
      <tr className="bg-brand-50/50">
        <td colSpan={4} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-600">
          {group.section}
        </td>
      </tr>
      {group.rows.map((row, i) => (
        <tr key={i} className={`border-t border-brand-100 ${row.highlight ? "bg-amber-50/30" : ""}`}>
          <td className="px-4 py-3 text-brand-700">
            {row.label}
            {row.highlight && <span className="ml-1 text-amber-600">★</span>}
          </td>
          {tierKeys.map((k) => (
            <td key={k} className={`px-4 py-3 text-center ${recommended === k ? "bg-amber-50" : ""}`}>
              <ValueCell value={(row as Record<string, string | boolean>)[k.toLowerCase()] as string | boolean} highlight={!!row.highlight && (k !== "BASIC")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function ValueCell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) return <Check className="w-5 h-5 mx-auto text-emerald-600" />
  if (value === false) return <X className="w-4 h-4 mx-auto text-brand-300" />
  return <span className={`text-xs font-medium ${highlight ? "text-amber-800" : "text-brand-700"}`}>{value}</span>
}
