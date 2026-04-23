import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

// Admin notification backbone. One endpoint feeds both the sidebar badges
// (counts only) and the notification bell dropdown (recent items per
// workflow). INFINITE read-only admins are allowed to read — they see the
// queue even though they can't mutate.
//
// Polling cadence is 30s from the client. Queries are cheap count()s +
// small take:3 selects on indexed status columns.

export const dynamic = "force-dynamic"

export type PendingWorkflowKey =
  | "newRegistration"
  | "membershipApplication"
  | "payment"
  | "certification"
  | "banner"
  | "report"
  | "mediaOrder"
  | "consultation"
  | "contact"
  | "post"

type RecentItem = {
  id: string
  title: string        // human-readable — "Nguyễn Văn A" or "Công ty TNHH X"
  subtitle?: string    // secondary line
  href: string         // deep link to the admin page (usually prefilled)
  createdAt: string    // ISO
}

type WorkflowSummary = {
  count: number
  recent: RecentItem[]
}

export type PendingCountsResponse = {
  total: number
  workflows: Record<PendingWorkflowKey, WorkflowSummary>
}

function iso(d: Date | null | undefined): string {
  return (d ?? new Date()).toISOString()
}

export async function GET() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [
    newRegistrations,
    membershipApps,
    payments,
    certifications,
    banners,
    reports,
    mediaOrders,
    consultations,
    contactMessages,
    pendingPosts,
  ] = await Promise.all([
    // Đơn đăng ký user mới đang chờ admin duyệt (role=GUEST + isActive=false).
    // Approve → upgrade VIP + gửi link đặt mật khẩu; Reject → xóa user.
    prisma.user.findMany({
      where: { role: "GUEST", isActive: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        accountType: true,
        createdAt: true,
        company: { select: { name: true } },
      },
    }),
    prisma.membershipApplication.findMany({
      where: { status: "PENDING" },
      orderBy: { submittedAt: "asc" },
      select: {
        id: true,
        submittedAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        amount: true,
        type: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.certification.findMany({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        product: { select: { name: true } },
        applicant: { select: { name: true } },
      },
    }),
    prisma.banner.findMany({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        reason: true,
        createdAt: true,
        reporter: { select: { name: true } },
        post: { select: { title: true } },
      },
    }),
    prisma.mediaOrder.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        serviceType: true,
        requesterName: true,
        createdAt: true,
      },
    }),
    prisma.consultationRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        createdAt: true,
      },
    }),
    prisma.contactMessage.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        createdAt: true,
      },
    }),
    prisma.post.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    }),
  ])

  const workflows: PendingCountsResponse["workflows"] = {
    newRegistration: {
      count: newRegistrations.length,
      recent: newRegistrations.slice(0, 3).map((u) => ({
        id: u.id,
        title: u.name || u.email,
        subtitle:
          u.accountType === "BUSINESS"
            ? u.company?.name ?? "Doanh nghiệp"
            : "Cá nhân",
        href: `/admin/hoi-vien?status=registration`,
        createdAt: iso(u.createdAt),
      })),
    },
    membershipApplication: {
      count: membershipApps.length,
      recent: membershipApps.slice(0, 3).map((a) => ({
        id: a.id,
        title: a.user?.name ?? a.user?.email ?? "—",
        subtitle: "Xin kết nạp hội viên",
        href: `/admin/hoi-vien/don-ket-nap?id=${a.id}`,
        createdAt: iso(a.submittedAt),
      })),
    },
    payment: {
      count: payments.length,
      recent: payments.slice(0, 3).map((p) => ({
        id: p.id,
        title: p.user?.name ?? "—",
        subtitle: `${p.type} · ${p.amount.toLocaleString("vi-VN")}đ`,
        href: `/admin/thanh-toan?id=${p.id}`,
        createdAt: iso(p.createdAt),
      })),
    },
    certification: {
      count: certifications.length,
      recent: certifications.slice(0, 3).map((c) => ({
        id: c.id,
        title: c.product?.name ?? "—",
        subtitle: c.applicant?.name ?? undefined,
        href: `/admin/chung-nhan?id=${c.id}`,
        createdAt: iso(c.createdAt),
      })),
    },
    banner: {
      count: banners.length,
      recent: banners.slice(0, 3).map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.user?.name ?? undefined,
        href: `/admin/banner?id=${b.id}`,
        createdAt: iso(b.createdAt),
      })),
    },
    report: {
      count: reports.length,
      recent: reports.slice(0, 3).map((r) => ({
        id: r.id,
        title: r.post?.title ?? "Bài viết",
        subtitle: `Lý do: ${r.reason}`,
        href: `/admin/bao-cao?id=${r.id}`,
        createdAt: iso(r.createdAt),
      })),
    },
    mediaOrder: {
      count: mediaOrders.length,
      recent: mediaOrders.slice(0, 3).map((m) => ({
        id: m.id,
        title: m.requesterName,
        subtitle: m.serviceType,
        href: `/admin/truyen-thong?id=${m.id}`,
        createdAt: iso(m.createdAt),
      })),
    },
    consultation: {
      count: consultations.length,
      recent: consultations.slice(0, 3).map((c) => ({
        id: c.id,
        title: c.fullName,
        subtitle: c.phone,
        href: `/admin/tu-van?id=${c.id}`,
        createdAt: iso(c.createdAt),
      })),
    },
    contact: {
      count: contactMessages.length,
      recent: contactMessages.slice(0, 3).map((m) => ({
        id: m.id,
        title: m.name,
        subtitle: m.message.length > 80 ? m.message.slice(0, 80) + "…" : m.message,
        href: `/admin/lien-he?id=${m.id}`,
        createdAt: iso(m.createdAt),
      })),
    },
    post: {
      count: pendingPosts.length,
      recent: pendingPosts.slice(0, 3).map((p) => {
        // content là HTML đã sanitize — strip tags để làm subtitle preview
        const plainText = p.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        return {
          id: p.id,
          title: p.title ?? (plainText.slice(0, 60) || "Bài viết"),
          subtitle: p.author?.name ?? undefined,
          href: `/admin/bai-viet/cho-duyet?id=${p.id}`,
          createdAt: iso(p.createdAt),
        }
      }),
    },
  }

  const total = Object.values(workflows).reduce((sum, w) => sum + w.count, 0)

  const res: PendingCountsResponse = { total, workflows }
  return NextResponse.json(res, {
    headers: { "Cache-Control": "no-store" },
  })
}
