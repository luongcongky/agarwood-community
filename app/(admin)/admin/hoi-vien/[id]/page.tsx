import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { getMemberTier, getTierThresholds } from "@/lib/tier"
import { MemberDetailTabs } from "./MemberDetailTabs"
import { InfiniteToggle } from "./InfiniteToggle"

export const revalidate = 0 // per-request — readOnly state phụ thuộc role


export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) notFound()

  const { id } = await params

  const [user, memberships, payments, honoraries, posts, certifications] = await Promise.all([
    prisma.user.findFirst({
      // Admin xem được cả VIP + GUEST (tài khoản cơ bản) — chỉ loại admin
      where: { id, role: { in: ["VIP", "GUEST", "INFINITE"] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        role: true,
        accountType: true,
        memberCategory: true,
        contributionTotal: true,
        displayPriority: true,
        membershipExpires: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            representativeName: true,
            representativePosition: true,
          },
        },
      },
    }),
    prisma.membership.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amountPaid: true,
        validFrom: true,
        validTo: true,
        status: true,
        createdAt: true,
        payment: { select: { status: true, createdAt: true } },
      },
    }),
    prisma.payment.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        createdAt: true,
        payosOrderCode: true,
      },
    }),
    prisma.honoraryContribution.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        creditAmount: true,
        reason: true,
        category: true,
        extendMonths: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.post.findMany({
      where: { authorId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        viewCount: true,
        createdAt: true,
      },
    }),
    prisma.certification.findMany({
      where: { applicantId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        approvedAt: true,
        product: { select: { name: true, slug: true } },
      },
    }),
  ])

  if (!user) notFound()

  const tier = await getMemberTier(user.contributionTotal, user.accountType as "BUSINESS" | "INDIVIDUAL")
  const { silver, gold } = await getTierThresholds(user.accountType as "BUSINESS" | "INDIVIDUAL")
  const daysLeft = user.membershipExpires
    ? Math.max(0, Math.ceil((new Date(user.membershipExpires).getTime() - Date.now()) / 86400000))
    : 0

  // Serialize dates
  const serialized = {
    user: {
      ...user,
      membershipExpires: user.membershipExpires?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
    memberships: memberships.map((m) => ({
      ...m,
      validFrom: m.validFrom.toISOString(),
      validTo: m.validTo.toISOString(),
      createdAt: m.createdAt.toISOString(),
      paymentCreatedAt: m.payment?.createdAt?.toISOString() ?? null,
      paymentStatus: m.payment?.status ?? null,
    })),
    payments: payments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    honoraries: honoraries.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
    posts: posts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    certifications: certifications.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      approvedAt: c.approvedAt?.toISOString() ?? null,
    })),
  }

  return (
    <div className="space-y-6">
      {/* ── Back + Header ───────────────────────────────────────────────── */}
      <Link href="/admin/hoi-vien" className="text-brand-600 hover:text-brand-800 text-sm">
        &larr; Quay lại danh sách
      </Link>

      <div className="bg-white rounded-xl border border-brand-200 p-6 flex items-start gap-5">
        <div className="relative w-14 h-14 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="56px" />
          ) : (
            <span className="text-xl font-bold text-brand-800">{user.name[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-brand-900">{user.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {user.isActive ? "Active" : "Inactive"}
            </span>
            {user.role === "INFINITE" && (
              <span className="inline-flex items-center rounded-full bg-gray-900 text-amber-200 px-2 py-1 text-xs font-semibold">
                ∞ Infinite
              </span>
            )}
          </div>
          <p className="text-sm text-brand-500 mt-0.5">{user.email}</p>
          <p className="text-sm text-brand-400 mt-0.5">
            {tier.label} {"★".repeat(tier.stars)}
            {user.company && <span className="ml-2">· {user.company.name}</span>}
            {daysLeft > 0 && <span className="ml-2">· Còn {daysLeft} ngày</span>}
          </p>
        </div>
        {session.user.role === "ADMIN" && (
          <InfiniteToggle userId={user.id} currentRole={user.role} />
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <MemberDetailTabs
        user={serialized.user}
        memberships={serialized.memberships}
        payments={serialized.payments}
        honoraries={serialized.honoraries}
        posts={serialized.posts}
        certifications={serialized.certifications}
        tierSilver={silver}
        tierGold={gold}
      />
    </div>
  )
}
