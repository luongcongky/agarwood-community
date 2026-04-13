import Link from "next/link"
import { prisma } from "@/lib/prisma"

interface Props {
  userId: string
  accountType: "BUSINESS" | "INDIVIDUAL"
}

/**
 * Banner nhắc hội viên hoàn thành các khảo sát ACTIVE chưa trả lời.
 * Render server-side, ẩn nếu không có khảo sát nào pending.
 */
export async function SurveyBanner({ userId, accountType }: Props) {
  const surveys = await prisma.survey.findMany({
    where: {
      status: "ACTIVE",
      audience: { in: ["ALL", "BOTH_VIP", accountType] },
      responses: { none: { userId } },
    },
    select: { slug: true, title: true },
    take: 3,
  })

  if (surveys.length === 0) return null

  const first = surveys[0]
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 p-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide font-semibold text-amber-700">
            Khảo sát mới
          </p>
          <h3 className="text-lg font-bold text-brand-900 mt-1">{first.title}</h3>
          <p className="text-sm text-brand-700 mt-1">
            Tham gia khảo sát để nhận gợi ý gói hội viên phù hợp với bạn.
            {surveys.length > 1 && ` Còn ${surveys.length - 1} khảo sát khác.`}
          </p>
        </div>
        <Link
          href={`/khao-sat/${first.slug}`}
          className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 whitespace-nowrap"
        >
          Bắt đầu →
        </Link>
      </div>
    </div>
  )
}
