import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { ApplicationCard } from "./ApplicationCard"

export const metadata = {
  title: "Đơn kết nạp Hội viên | Admin",
}

export const revalidate = 0

const STATUS_TABS = [
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "REJECTED", label: "Từ chối" },
  { key: "ALL", label: "Tất cả" },
] as const

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) notFound()

  const params = await searchParams
  const activeTab = params.status ?? "PENDING"

  const where = activeTab === "ALL" ? {} : { status: activeTab as "PENDING" | "APPROVED" | "REJECTED" }

  const [applications, pendingCount] = await Promise.all([
    prisma.membershipApplication.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            accountType: true,
            memberCategory: true,
            company: {
              select: {
                name: true,
                businessLicense: true,
              },
            },
          },
        },
        reviewer: {
          select: { name: true },
        },
      },
    }),
    prisma.membershipApplication.count({ where: { status: "PENDING" } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Đơn kết nạp Hội viên
          </h1>
          <p className="text-sm text-brand-500 mt-1">
            Ban Thường vụ xét duyệt theo Điều lệ Hội, Điều 11.
          </p>
        </div>
        <Link
          href="/admin/hoi-vien"
          className="text-sm text-brand-600 hover:text-brand-800"
        >
          ← Danh sách hội viên
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-brand-200">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const showBadge = tab.key === "PENDING" && pendingCount > 0
          return (
            <Link
              key={tab.key}
              href={`/admin/hoi-vien/don-ket-nap?status=${tab.key}`}
              className={`relative px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-brand-700 text-brand-900"
                  : "border-transparent text-brand-500 hover:text-brand-700"
              }`}
            >
              {tab.label}
              {showBadge && (
                <span className="ml-1.5 inline-flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5 min-w-5 h-5">
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Application list */}
      {applications.length === 0 ? (
        <div className="rounded-xl border border-brand-200 bg-white p-12 text-center">
          <p className="text-brand-500">Không có đơn nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={{
                id: app.id,
                status: app.status,
                requestedCategory: app.requestedCategory,
                reason: app.reason,
                representativeName: app.representativeName,
                representativePosition: app.representativePosition,
                submittedAt: app.submittedAt.toISOString(),
                reviewedAt: app.reviewedAt?.toISOString() ?? null,
                reviewerName: app.reviewer?.name ?? null,
                rejectReason: app.rejectReason,
                user: {
                  id: app.user.id,
                  name: app.user.name,
                  email: app.user.email,
                  phone: app.user.phone,
                  accountType: app.user.accountType,
                  memberCategory: app.user.memberCategory,
                  companyName: app.user.company?.name ?? null,
                  businessLicense: app.user.company?.businessLicense ?? null,
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
