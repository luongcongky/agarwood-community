import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      type: true,
      amount: true,
      status: true,
      description: true,
      membershipId: true,
      certificationId: true,
      bannerId: true,
      user: { select: { name: true, email: true } },
    },
  })
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "Thanh toán này đã được xử lý" }, { status: 400 })
  }

  if (payment.type === "MEMBERSHIP_FEE" && payment.membershipId) {
    // Run all updates in a single transaction
    await prisma.$transaction(async (tx) => {
      // 1. Mark payment SUCCESS
      await tx.payment.update({
        where: { id },
        data: { status: "SUCCESS" },
      })

      // 2. Get current user state
      const user = await tx.user.findUnique({
        where: { id: payment.userId },
        select: { membershipExpires: true, contributionTotal: true, role: true },
      })

      // 3. Stack expiry from current or existing, whichever is later
      const baseDate =
        user?.membershipExpires && user.membershipExpires > new Date()
          ? user.membershipExpires
          : new Date()
      const newExpiry = new Date(baseDate)
      newExpiry.setFullYear(newExpiry.getFullYear() + 1)

      const newContrib = (user?.contributionTotal ?? 0) + payment.amount
      const newPriority = Math.floor(newContrib / 1_000_000)

      // 4. Update membership
      await tx.membership.update({
        where: { id: payment.membershipId! },
        data: { status: "ACTIVE", validFrom: new Date(), validTo: newExpiry },
      })

      // 5. Update user — upgrade GUEST → VIP khi đây là lần đầu đóng phí
      //    membership. VIP/ADMIN/INFINITE giữ nguyên role.
      const willBumpToVip = user?.role === "GUEST"
      await tx.user.update({
        where: { id: payment.userId },
        data: {
          membershipExpires: newExpiry,
          contributionTotal: newContrib,
          displayPriority: newPriority,
          ...(willBumpToVip && { role: "VIP" as const }),
        },
      })

      // 5b. Auto-publish DN của user khi lên VIP — Phase 3.7 round 4
      // (2026-04). Tránh trường hợp admin/owner quên publish thủ công sau
      // khi role bump. Idempotent qua updateMany + where.isPublished:false.
      if (willBumpToVip) {
        await tx.company.updateMany({
          where: { ownerId: payment.userId, isPublished: false },
          data: { isPublished: true },
        })
      }

      // 6. Update authorPriority on all user's posts.
      // Phase 3.7 round 4 (2026-04): dùng `newPriority` (displayPriority
      // style, Math.floor(/1M)) — match POST /api/posts. Trước đây ghi
      // `newContrib` raw VND → mismatch sort: bài cũ priority=50_000_000,
      // bài mới priority=50 → bài mới của user contribution cao bị buried.
      await tx.post.updateMany({
        where: { authorId: payment.userId },
        data: { authorPriority: newPriority },
      })
    })

    // Email VIP — outside transaction (non-critical)
    try {
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { membershipExpires: true },
      })
      const expiryStr = user?.membershipExpires
        ? user.membershipExpires.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
        : ""

      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: payment.user.email,
        subject: "Membership đã được kích hoạt - Hội Trầm Hương Việt Nam",
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Xin chào ${payment.user.name},</h2>
            <p>Chuyển khoản phí hội viên <strong>${payment.amount.toLocaleString("vi-VN")}đ</strong> của bạn đã được xác nhận.</p>
            <p>Membership có hiệu lực đến: <strong>${expiryStr}</strong></p>
            <p>Cảm ơn bạn đã đóng góp cho Hội Trầm Hương Việt Nam!</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send VIP confirmation email:", err)
    }
  } else if (payment.type === "CERTIFICATION_FEE" && payment.certificationId) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id }, data: { status: "SUCCESS" } }),
      prisma.certification.update({
        where: { id: payment.certificationId },
        data: { status: "PENDING" },
      }),
    ])

    // Email VIP
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: payment.user.email,
        subject: "Phí chứng nhận đã được xác nhận - Hội Trầm Hương Việt Nam",
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Xin chào ${payment.user.name},</h2>
            <p>Phí chứng nhận sản phẩm <strong>${payment.amount.toLocaleString("vi-VN")}đ</strong> đã được xác nhận.</p>
            <p>Hồ sơ của bạn đang được chuyển sang bước xét duyệt.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send cert confirmation email:", err)
    }
  } else if (payment.type === "BANNER_FEE" && payment.bannerId) {
    // Phase 6: Confirm CK cho banner đăng ký mới hoặc gia hạn
    // Phân biệt 2 case dựa trên description (chứa "RENEW" = gia hạn)
    const isRenew = payment.description?.includes("Gia hạn banner") ?? false

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id }, data: { status: "SUCCESS" } })

      const banner = await tx.banner.findUnique({
        where: { id: payment.bannerId! },
        select: { id: true, status: true, endDate: true },
      })
      if (!banner) return

      if (isRenew) {
        // Gia hạn — extend endDate, KHÔNG đổi status (vẫn ACTIVE/EXPIRED)
        // Tính số tháng gia hạn từ amount / banner_price_per_month
        const pricePerMonth = 1_000_000 // TODO: đọc từ SiteConfig nếu cần dynamic
        const monthsRenewed = Math.round(payment.amount / pricePerMonth)
        const baseDate = banner.endDate > new Date() ? banner.endDate : new Date()
        const newEndDate = new Date(baseDate)
        newEndDate.setMonth(newEndDate.getMonth() + monthsRenewed)

        await tx.banner.update({
          where: { id: banner.id },
          data: {
            endDate: newEndDate,
            // Nếu banner đang EXPIRED → chuyển lại ACTIVE (đã gia hạn)
            ...(banner.status === "EXPIRED" && { status: "ACTIVE" }),
          },
        })
      } else {
        // Đăng ký mới — chuyển sang PENDING_APPROVAL để admin duyệt content
        await tx.banner.update({
          where: { id: banner.id },
          data: { status: "PENDING_APPROVAL" },
        })
      }
    })

    // Email user
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: payment.user.email,
        subject: isRenew
          ? "Gia hạn banner thành công - Hội Trầm Hương Việt Nam"
          : "Banner đang chờ duyệt - Hội Trầm Hương Việt Nam",
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Xin chào ${payment.user.name},</h2>
            <p>Chuyển khoản <strong>${payment.amount.toLocaleString("vi-VN")}đ</strong> ${
              isRenew ? "gia hạn banner" : "đăng ký banner mới"
            } đã được xác nhận.</p>
            ${
              isRenew
                ? "<p>Banner của bạn đã được gia hạn và tiếp tục hiển thị trên trang chủ.</p>"
                : "<p>Banner đang chờ Ban quản trị duyệt nội dung. Bạn sẽ nhận email ngay khi banner được duyệt.</p>"
            }
            <p><a href="${process.env.NEXTAUTH_URL}/banner/lich-su" style="display:inline-block;background:#1a5632;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Xem banner</a></p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send banner confirmation email:", err)
    }
  } else {
    // Generic payment (MEDIA_SERVICE etc.)
    await prisma.payment.update({ where: { id }, data: { status: "SUCCESS" } })
  }

  return NextResponse.json({ success: true })
}
