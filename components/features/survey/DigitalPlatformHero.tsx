import {
  BadgeCheck,
  Megaphone,
  Network,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from "lucide-react"

interface Benefit {
  icon: typeof BadgeCheck
  title: string
  desc: string
}

const BENEFITS: Benefit[] = [
  {
    icon: Sparkles,
    title: "Hiển thị trang chủ Hội",
    desc: "Doanh nghiệp & sản phẩm của bạn xuất hiện trên trang chính của Hội — tiếp cận hàng ngàn khách hàng tiềm năng mỗi tháng.",
  },
  {
    icon: BadgeCheck,
    title: "Chứng nhận sản phẩm uy tín",
    desc: "Hội thẩm định và cấp chứng nhận cho sản phẩm trầm hương — bảo chứng chất lượng cho khách hàng và đối tác xuất khẩu.",
  },
  {
    icon: Megaphone,
    title: "Banner quảng cáo độc quyền",
    desc: "Đăng banner trên các trang công khai của website Hội, nhắm đúng khách hàng quan tâm ngành trầm hương.",
  },
  {
    icon: Network,
    title: "Mạng lưới kết nối B2B",
    desc: "Gặp gỡ, trao đổi với 59+ hội viên uy tín trên toàn quốc qua Cộng đồng nội bộ. Cơ hội hợp tác, phân phối, xuất khẩu.",
  },
  {
    icon: TrendingUp,
    title: "Truyền thông chính thống",
    desc: "Hỗ trợ viết bài PR, phỏng vấn, quảng bá thương hiệu trên các kênh truyền thông đối tác của Hội.",
  },
  {
    icon: ShieldCheck,
    title: "Quyền lợi pháp lý & biểu quyết",
    desc: "Tham gia biểu quyết tại Đại hội, tư vấn pháp lý miễn phí, hỗ trợ xúc tiến xuất khẩu từ Ban Quản trị.",
  },
]

/**
 * Banner giới thiệu giá trị nền tảng số — hiển thị trước khi user làm khảo sát
 * để họ hiểu rõ "gia nhập nền tảng số" đem lại gì.
 */
export function DigitalPlatformHero() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-amber-800 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, #fbbf24 0, transparent 40%)",
        }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-300/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Tính năng mới — Ra mắt 2026
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Nền tảng số Hội Trầm Hương Việt Nam
          </h2>
          <p className="mt-4 text-base sm:text-lg text-brand-100 leading-relaxed">
            Lần đầu tiên trong lịch sử Hội, tất cả hội viên có thể <strong className="text-amber-200">hiển thị thương hiệu,
            chứng nhận sản phẩm, kết nối đối tác và nhận hỗ trợ truyền thông trực tuyến</strong> —
            tất cả thông qua một nền tảng duy nhất.
          </p>
          <p className="mt-4 text-sm text-brand-200">
            Đây là quyền lợi <strong>đã bao gồm</strong> trong phí hội viên hiện tại của bạn.
            Hãy trả lời khảo sát bên dưới để Hội giúp bạn khai thác tối đa lợi ích này.
          </p>
        </div>
      </div>

      {/* Benefits grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="group rounded-2xl border-2 border-brand-200 bg-white p-5 transition-all hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-brand-900 mb-1">{title}</h3>
            <p className="text-sm text-brand-600 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Pitch */}
      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 p-5 text-center">
        <p className="text-sm sm:text-base font-semibold text-brand-900">
          💡 <span className="text-amber-800">Dành 3-5 phút</span> trả lời khảo sát
          để Ban Quản trị <span className="text-amber-800">gợi ý gói quyền lợi phù hợp nhất</span> với
          quy mô &amp; định hướng của bạn.
        </p>
      </div>
    </div>
  )
}
