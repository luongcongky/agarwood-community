import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMemberTier } from "@/lib/tier"
import Image from "next/image"
import { ProfileTabs } from "./ProfileTabs"

export const revalidate = 0

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        bio_en: true,
        bio_zh: true,
        bio_ar: true,
        avatarUrl: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankName: true,
        role: true,
        accountType: true,
        contributionTotal: true,
        membershipExpires: true,
        displayPriority: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            representativePosition: true,
            representativePosition_en: true,
            representativePosition_zh: true,
            representativePosition_ar: true,
          },
        },
      },
    }),
    prisma.membership.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amountPaid: true,
        validFrom: true,
        validTo: true,
        status: true,
        createdAt: true,
        payment: { select: { status: true } },
      },
    }),
  ])

  if (!user) redirect("/login")

  const tier = await getMemberTier(user.contributionTotal, user.accountType as "BUSINESS" | "INDIVIDUAL")
  const daysLeft = user.membershipExpires
    ? Math.max(0, Math.ceil((new Date(user.membershipExpires).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0

  const hasBankInfo = !!(user.bankName && user.bankAccountNumber && user.bankAccountName)

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Profile Header ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-brand-200 p-6 flex items-center gap-5">
        <div className="relative w-16 h-16 rounded-full bg-brand-700 flex items-center justify-center shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" sizes="64px" />
          ) : (
            <span className="text-2xl font-bold text-brand-100">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-brand-900 truncate">{user.name}</h1>
          {user.company && (
            <p className="text-sm text-brand-500 truncate">{user.company.name}</p>
          )}
          <p className="text-sm text-brand-400 mt-0.5">
            {tier.label} {"★".repeat(tier.stars)}
            {daysLeft > 0 && <span className="ml-2">· Còn {daysLeft} ngày</span>}
          </p>
        </div>
      </div>

      {/* ── Bank warning banner ─────────────────────────────────────────── */}
      {!hasBankInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-sm text-yellow-800">
          <span className="font-semibold">Chưa có thông tin ngân hàng.</span>{" "}
          Vui lòng cập nhật để nhận hoàn phí khi cần. Chuyển sang tab &quot;Ngân hàng&quot; để điền.
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <ProfileTabs
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          bio_en: user.bio_en,
          bio_zh: user.bio_zh,
          bio_ar: user.bio_ar,
          bankAccountName: user.bankAccountName,
          bankAccountNumber: user.bankAccountNumber,
          bankName: user.bankName,
          role: user.role,
          accountType: user.accountType,
          contributionTotal: user.contributionTotal,
          membershipExpires: user.membershipExpires?.toISOString() ?? null,
          displayPriority: user.displayPriority,
          company: user.company,
        }}
        memberships={memberships.map((m) => ({
          id: m.id,
          amountPaid: m.amountPaid,
          validFrom: m.validFrom.toISOString(),
          validTo: m.validTo.toISOString(),
          status: m.status,
          paymentStatus: m.payment?.status ?? null,
          createdAt: m.createdAt.toISOString(),
        }))}
        hasBankInfo={hasBankInfo}
      />
    </div>
  )
}
