import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { User, Building2 } from "lucide-react"

export const revalidate = 300

export const metadata = {
  title: "Khảo sát Hội viên — Cập nhật thông tin & lựa chọn gói phù hợp",
  description:
    "Tham gia khảo sát 3-5 phút để cập nhật thông tin và nhận gợi ý gói Hội viên phù hợp.",
}

export default async function PublicSurveyLandingPage() {
  const [businessSurvey, individualSurvey] = await Promise.all([
    prisma.survey.findFirst({
      where: { status: "ACTIVE", audience: "BUSINESS" },
      orderBy: { createdAt: "desc" },
      select: { slug: true },
    }),
    prisma.survey.findFirst({
      where: { status: "ACTIVE", audience: "INDIVIDUAL" },
      orderBy: { createdAt: "desc" },
      select: { slug: true },
    }),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid gap-5 md:grid-cols-2">
        <TypeCard
          href={individualSurvey ? `/khao-sat/${individualSurvey.slug}` : "#"}
          available={!!individualSurvey}
          icon={User}
          label="Cá nhân"
          description="Nghệ nhân, chuyên gia, người yêu trầm, nhà nghiên cứu, thương lái cá nhân..."
          color="from-emerald-400 to-emerald-600"
        />

        <TypeCard
          href={businessSurvey ? `/khao-sat/${businessSurvey.slug}` : "#"}
          available={!!businessSurvey}
          icon={Building2}
          label="Đại diện Doanh nghiệp"
          description="Tôi đại diện công ty / cơ sở / HTX hoạt động trong ngành trầm hương. Gồm upload logo &amp; thông tin doanh nghiệp."
          color="from-amber-400 to-amber-600"
        />
      </div>
    </div>
  )
}

function TypeCard({
  href,
  available,
  icon: Icon,
  label,
  description,
  color,
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
      <div
        className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br ${color} text-white shadow-md mb-4`}
      >
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
