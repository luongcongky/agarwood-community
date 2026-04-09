import { RegisterForm } from "./RegisterForm"
import { GoogleSignUpButton } from "./GoogleSignUpButton"

export const metadata = {
  title: "Đăng ký Hội viên | Hội Trầm Hương Việt Nam",
  description: "Nộp đơn gia nhập Hội Trầm Hương Việt Nam — cộng đồng B2B kết nối doanh nghiệp trầm hương trên toàn quốc.",
}

const BENEFITS = [
  { icon: "📝", title: "Đăng bài & Chia sẻ", desc: "Chia sẻ kinh nghiệm, thông tin thị trường trên feed cộng đồng chuyên ngành" },
  { icon: "🏅", title: "Chứng nhận sản phẩm", desc: "Sản phẩm được Hội cấp badge chứng nhận — tăng uy tín với khách hàng" },
  { icon: "🏢", title: "Profile doanh nghiệp", desc: "Trang giới thiệu chuyên nghiệp trên website Hội, tối ưu SEO" },
  { icon: "🤝", title: "Kết nối B2B", desc: "Kết nối với 100+ doanh nghiệp trầm hương, cơ hội hợp tác kinh doanh" },
]

const STEPS = [
  { step: 1, title: "Nộp đơn", desc: "Điền form đăng ký với thông tin cá nhân và doanh nghiệp" },
  { step: 2, title: "Xét duyệt", desc: "Ban quản trị xem xét trong 3 ngày làm việc" },
  { step: 3, title: "Kích hoạt", desc: "Nhận email đặt mật khẩu và kích hoạt tài khoản" },
  { step: 4, title: "Đóng phí", desc: "Đóng phí hội viên để sử dụng đầy đủ tính năng" },
]

export default function DangKyPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-800 py-16 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">Đăng ký Hội viên</h1>
        <p className="mt-3 text-brand-300 text-base max-w-2xl mx-auto">
          Gia nhập cộng đồng doanh nghiệp trầm hương lớn nhất Việt Nam — nơi kết nối, chia sẻ và phát triển cùng nhau.
        </p>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-brand-900 text-center mb-10">Quyền lợi Hội viên</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white rounded-xl border border-brand-200 p-5 space-y-2">
              <span className="text-2xl">{b.icon}</span>
              <h3 className="font-semibold text-brand-900">{b.title}</h3>
              <p className="text-sm text-brand-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-brand-50 py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-brand-900 text-center mb-10">Quy trình đăng ký</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-brand-700 text-white flex items-center justify-center text-lg font-bold mx-auto">{s.step}</div>
                <h3 className="font-semibold text-brand-900 text-sm">{s.title}</h3>
                <p className="text-sm text-brand-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-xl mx-auto px-4 py-14">
        <div className="bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-brand-900 text-center">Nộp đơn đăng ký</h2>

          {/* Google sign-up */}
          <GoogleSignUpButton />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-brand-200" />
            <span className="text-xs text-brand-400">hoặc điền form đăng ký</span>
            <div className="flex-1 h-px bg-brand-200" />
          </div>

          <RegisterForm />
        </div>
      </section>
    </div>
  )
}
