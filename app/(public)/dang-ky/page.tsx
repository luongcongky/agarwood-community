import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { RegisterForm } from "./RegisterForm"
import { GoogleSignUpButton } from "./GoogleSignUpButton"

export const metadata = {
  title: "Đăng ký Hội viên | Hội Trầm Hương Việt Nam",
  description: "Nộp đơn gia nhập Hội Trầm Hương Việt Nam — cộng đồng B2B kết nối doanh nghiệp trầm hương trên toàn quốc.",
}

export const revalidate = 0

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ"
}

const BENEFITS = [
  { icon: "📝", title: "Đăng bài & Chia sẻ", desc: "Chia sẻ kinh nghiệm, thông tin thị trường trên feed cộng đồng chuyên ngành" },
  { icon: "🏅", title: "Chứng nhận sản phẩm", desc: "Sản phẩm được Hội cấp badge chứng nhận — tăng uy tín với khách hàng" },
  { icon: "🏢", title: "Profile doanh nghiệp", desc: "Trang giới thiệu chuyên nghiệp trên website Hội, tối ưu SEO" },
  { icon: "🤝", title: "Kết nối B2B", desc: "Kết nối với 100+ doanh nghiệp trầm hương, cơ hội hợp tác kinh doanh" },
]

const STEPS = [
  { step: 1, title: "Đăng ký", desc: "Điền form với thông tin cá nhân hoặc doanh nghiệp" },
  { step: 2, title: "Đăng nhập", desc: "Tài khoản kích hoạt ngay — chia sẻ bài viết miễn phí" },
  { step: 3, title: "Nâng cấp VIP", desc: "Đóng phí hội viên để tăng hạn mức bài viết và ưu tiên trang chủ" },
  { step: 4, title: "Hưởng quyền lợi", desc: "Chứng nhận sản phẩm, banner quảng cáo, dịch vụ truyền thông" },
]

export default async function DangKyPage() {
  // Lấy phí chính thức theo Điều lệ Hội
  const feeKeys = [
    "join_fee_individual",
    "join_fee_organization",
    "individual_fee_min",
    "membership_fee_min",
  ]
  const feeConfigs = await prisma.siteConfig.findMany({
    where: { key: { in: feeKeys } },
  })
  const fee = Object.fromEntries(feeConfigs.map((c) => [c.key, Number(c.value)]))
  const joinFeeIndividual = fee.join_fee_individual ?? 1_000_000
  const joinFeeOrganization = fee.join_fee_organization ?? 2_000_000
  const annualFeeIndividual = fee.individual_fee_min ?? 1_000_000
  const annualFeeOrganization = fee.membership_fee_min ?? 2_000_000

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

      {/* Official fees — theo Điều lệ Hội */}
      <section className="bg-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-brand-900 text-center mb-3">
            Phí Hội viên chính thức
          </h2>
          <p className="text-center text-sm text-brand-500 mb-10">
            Theo Điều lệ Hội (sửa đổi, bổ sung) 2023, Quyết định số 1086/QĐ-BNV
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Hội viên cá nhân */}
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👤</span>
                <div>
                  <h3 className="font-bold text-brand-900">Hội viên Cá nhân</h3>
                  <p className="text-xs text-brand-500">Công dân Việt Nam từ đủ 18 tuổi</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between items-baseline">
                  <span className="text-brand-700">Phí gia nhập (1 lần):</span>
                  <span className="font-bold text-brand-900">{formatVnd(joinFeeIndividual)}</span>
                </li>
                <li className="flex justify-between items-baseline">
                  <span className="text-brand-700">Niên liễn hàng năm:</span>
                  <span className="font-bold text-brand-900">{formatVnd(annualFeeIndividual)}</span>
                </li>
              </ul>
            </div>

            {/* Hội viên tổ chức */}
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏢</span>
                <div>
                  <h3 className="font-bold text-brand-900">Hội viên Tổ chức / Liên kết</h3>
                  <p className="text-xs text-brand-500">Doanh nghiệp có tư cách pháp nhân</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between items-baseline">
                  <span className="text-brand-700">Phí gia nhập (1 lần):</span>
                  <span className="font-bold text-brand-900">{formatVnd(joinFeeOrganization)}</span>
                </li>
                <li className="flex justify-between items-baseline">
                  <span className="text-brand-700">Niên liễn hàng năm:</span>
                  <span className="font-bold text-brand-900">{formatVnd(annualFeeOrganization)}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Approval notice */}
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">📝</span>
              <div className="space-y-2 text-amber-900">
                <p className="font-semibold">Quy trình xét duyệt chính thức</p>
                <p className="leading-relaxed">
                  Theo Điều lệ Hội, đơn gia nhập sẽ được{" "}
                  <strong>Ban Thường vụ Hội xét duyệt tại các cuộc họp hàng quý</strong>;
                  Chủ tịch Hội quyết định công nhận Hội viên trong vòng 30 ngày kể từ
                  ngày nộp hồ sơ đầy đủ.
                </p>
                <p className="leading-relaxed">
                  Trước khi được công nhận chính thức, bạn được cấp tài khoản{" "}
                  <em>Khách</em> (Guest) để truy cập cộng đồng và chia sẻ bài viết ngay.
                  Sau khi đăng nhập, bạn có thể{" "}
                  <Link href="/ket-nap" className="underline font-semibold text-amber-800 hover:text-amber-950">
                    nộp đơn kết nạp chính thức
                  </Link>{" "}
                  để Ban Thường vụ xét duyệt.
                </p>
                <p className="leading-relaxed">
                  Xem chi tiết quyền & nghĩa vụ Hội viên tại{" "}
                  <Link href="/dieu-le" className="underline font-semibold text-amber-800 hover:text-amber-950">
                    Điều lệ Hội (Điều 8–10)
                  </Link>
                  .
                </p>
              </div>
            </div>
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
