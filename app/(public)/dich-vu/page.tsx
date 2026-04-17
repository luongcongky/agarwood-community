import { MediaOrderForm } from "./MediaOrderForm"

export const metadata = {
  title: "Dịch vụ Truyền thông | Hội Trầm Hương Việt Nam",
  description:
    "Dịch vụ viết bài, thông cáo báo chí và nội dung mạng xã hội chuyên nghiệp cho doanh nghiệp trầm hương.",
}

const SERVICES = [
  {
    icon: "📝",
    title: "Bài viết doanh nghiệp",
    description:
      "Giới thiệu toàn diện về doanh nghiệp, lịch sử hình thành, sản phẩm và giá trị cốt lõi. Tối ưu SEO, đăng tải trên các kênh uy tín.",
    price: "Từ 3.000.000 VND",
    serviceType: "ARTICLE_COMPANY",
  },
  {
    icon: "🛍️",
    title: "Bài viết sản phẩm",
    description:
      "Mô tả chi tiết sản phẩm trầm hương, giá trị, nguồn gốc và chứng nhận chất lượng. Thu hút khách hàng tiềm năng hiệu quả.",
    price: "Từ 2.000.000 VND",
    serviceType: "ARTICLE_PRODUCT",
  },
  {
    icon: "📰",
    title: "Thông cáo báo chí",
    description:
      "Soạn thảo và phân phối thông cáo báo chí chuyên nghiệp đến các kênh truyền thông lớn trong ngành.",
    price: "Từ 5.000.000 VND",
    serviceType: "PRESS_RELEASE",
  },
  {
    icon: "📱",
    title: "Nội dung mạng xã hội",
    description:
      "Sản xuất nội dung hấp dẫn cho Facebook, Instagram, Zalo OA — tăng tương tác và nhận diện thương hiệu.",
    price: "Từ 1.500.000 VND",
    serviceType: "SOCIAL_CONTENT",
  },
]

const PROCESS_STEPS = [
  {
    step: 1,
    title: "Gửi yêu cầu",
    description: "Điền form đặt dịch vụ với thông tin chi tiết về nhu cầu truyền thông của bạn.",
  },
  {
    step: 2,
    title: "Xác nhận & Báo giá",
    description:
      "Đội ngũ của chúng tôi liên hệ trong 24 giờ để xác nhận yêu cầu và gửi báo giá chi tiết.",
  },
  {
    step: 3,
    title: "Thực hiện",
    description:
      "Chuyên gia truyền thông thực hiện sản xuất nội dung theo yêu cầu, cập nhật tiến độ thường xuyên.",
  },
  {
    step: 4,
    title: "Bàn giao",
    description:
      "Bàn giao nội dung hoàn chỉnh, hỗ trợ chỉnh sửa đến khi bạn hài lòng. Thanh toán sau khi nghiệm thu.",
  },
]

export default function MediaServicePage() {
  return (
    <div className="min-h-screen bg-brand-50/60">
      {/* Hero */}
      <section className="bg-brand-800 py-20 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">
          Dịch vụ Truyền thông
        </h1>
        <p className="mt-3 text-brand-300 text-lg max-w-2xl mx-auto">
          Giải pháp truyền thông chuyên nghiệp cho doanh nghiệp trầm hương — nâng tầm thương
          hiệu và tiếp cận khách hàng mục tiêu hiệu quả.
        </p>
      </section>

      {/* Content card — bọc toàn bộ nội dung giữa hero và form */}
      <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">

        {/* Service Cards */}
        <section className="px-6 sm:px-10 py-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            Các dịch vụ của chúng tôi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SERVICES.map((svc) => (
              <div
                key={svc.serviceType}
                className="bg-brand-50/50 rounded-xl border border-brand-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="text-3xl">{svc.icon}</div>
                <h3 className="text-lg font-semibold text-foreground">{svc.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{svc.description}</p>
                <p className="text-brand-700 font-semibold text-sm">{svc.price}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process Steps */}
        <section className="bg-brand-50/50 py-12 px-6 sm:px-10">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            Quy trình thực hiện
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {PROCESS_STEPS.map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-700 text-brand-100 flex items-center justify-center text-xl font-bold mx-auto">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Order Form */}
        <section className="px-6 sm:px-10 py-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">
            Đặt dịch vụ ngay
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-8">
            Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
          </p>
          <div className="max-w-2xl mx-auto bg-brand-50/50 rounded-xl border border-brand-200 p-6">
            <MediaOrderForm />
          </div>
        </section>

      </div>
      </div>
    </div>
  )
}
