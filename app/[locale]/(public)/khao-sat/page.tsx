import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { DigitalPlatformHero } from "@/components/features/survey/DigitalPlatformHero"
import { TierComparisonTable } from "@/components/features/survey/TierComparisonTable"
import { User, Building2 } from "lucide-react"

export const revalidate = 300

export const metadata = {
  title: "Khảo sát Hội viên — Cập nhật thông tin & lựa chọn gói phù hợp",
  description: "Tham gia khảo sát 3-5 phút để cập nhật thông tin, nhận gợi ý gói Hội viên phù hợp và kết nối với nền tảng số Hội Trầm Hương Việt Nam.",
}

export default async function PublicSurveyLandingPage() {
  // Lấy 2 survey ACTIVE theo audience BUSINESS / INDIVIDUAL
  const [businessSurvey, individualSurvey] = await Promise.all([
    prisma.survey.findFirst({
      where: { status: "ACTIVE", audience: "BUSINESS" },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true, description: true },
    }),
    prisma.survey.findFirst({
      where: { status: "ACTIVE", audience: "INDIVIDUAL" },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true, description: true },
    }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero marketing */}
      <DigitalPlatformHero />

      {/* Type selector — điểm bắt đầu khảo sát */}
      <section id="start" className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
            Bạn đang tham gia với tư cách nào?
          </h2>
          <p className="text-sm text-brand-600 mt-2">
            Chọn đúng loại để Hội gửi bạn các câu hỏi phù hợp
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 max-w-4xl mx-auto">
          {/* INDIVIDUAL */}
          <TypeCard
            href={individualSurvey ? `/khao-sat/${individualSurvey.slug}` : "#"}
            available={!!individualSurvey}
            icon={User}
            label="Cá nhân"
            description="Nghệ nhân, chuyên gia, người yêu trầm, nhà nghiên cứu, thương lái cá nhân..."
            color="from-emerald-400 to-emerald-600"
          />

          {/* BUSINESS */}
          <TypeCard
            href={businessSurvey ? `/khao-sat/${businessSurvey.slug}` : "#"}
            available={!!businessSurvey}
            icon={Building2}
            label="Đại diện Doanh nghiệp"
            description="Tôi đại diện công ty / cơ sở / HTX hoạt động trong ngành trầm hương. Gồm upload logo &amp; thông tin doanh nghiệp."
            color="from-amber-400 to-amber-600"
          />
        </div>
      </section>

      {/* Tier comparison */}
      <section className="space-y-4">
        <TierComparisonTable />
      </section>

      {/* Final CTA */}
      <section className="text-center space-y-4 py-8 bg-brand-50 rounded-3xl border-2 border-brand-200">
        <h2 className="text-2xl font-bold text-brand-900">Sẵn sàng tham gia?</h2>
        <p className="text-sm text-brand-600 max-w-xl mx-auto">
          Chỉ mất 3-5 phút để cập nhật thông tin &amp; nhận gợi ý gói hội viên phù hợp nhất với bạn
        </p>
        <Link
          href="#start"
          className="inline-flex items-center rounded-md bg-brand-700 px-8 py-3 text-base font-semibold text-white hover:bg-brand-800 shadow-lg"
        >
          Bắt đầu khảo sát →
        </Link>
      </section>
    </div>
  )
}

function TypeCard({
  href, available, icon: Icon, label, description, color,
}: {
  href: string
  available: boolean
  icon: typeof User
  label: string
  description: string
  color: string
}) {
  if (!available) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 p-6 text-center text-brand-400 italic">
        <Icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <div className="font-semibold">{label}</div>
        <div className="text-xs mt-2">Khảo sát tạm đóng</div>
      </div>
    )
  }
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-white p-6 hover:border-brand-500 hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${color} text-white shadow-md mb-4`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-brand-900">{label}</h3>
      <p className="text-sm text-brand-600 mt-2 leading-relaxed">{description}</p>
      <div className="mt-4 inline-flex items-center text-sm font-semibold text-brand-700 group-hover:text-brand-900">
        Chọn &amp; bắt đầu →
      </div>
    </Link>
  )
}
