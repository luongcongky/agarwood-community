import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

/**
 * PATCH /api/admin/banner/[id]
 * Body: { action: "approve" | "reject", reason?: string }
 *
 * - approve: status -> ACTIVE, set approvedAt + approvedBy
 * - reject: status -> REJECTED, lưu reason. (Hoàn tiền thủ công bởi admin nếu user đã CK.)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { action, reason } = (await request.json().catch(() => ({}))) as {
    action?: "approve" | "reject"
    reason?: string
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action không hợp lệ" }, { status: 400 })
  }
  if (action === "reject" && (!reason || reason.trim().length < 10)) {
    return NextResponse.json({ error: "Lý do từ chối tối thiểu 10 ký tự" }, { status: 400 })
  }

  const banner = await prisma.banner.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      title: true,
      user: { select: { name: true, email: true } },
    },
  })
  if (!banner) return NextResponse.json({ error: "Banner không tồn tại" }, { status: 404 })

  if (banner.status !== "PENDING_APPROVAL") {
    return NextResponse.json(
      { error: "Chỉ có thể duyệt banner ở trạng thái PENDING_APPROVAL" },
      { status: 400 },
    )
  }

  if (action === "approve") {
    await prisma.banner.update({
      where: { id },
      data: {
        status: "ACTIVE",
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
    })

    revalidateTag("homepage", "max")
    revalidateTag("banners", "max")

    // Email user
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: banner.user.email,
        subject: "Banner của bạn đã được duyệt",
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Xin chào ${banner.user.name},</h2>
            <p>Banner <strong>"${banner.title}"</strong> đã được Ban quản trị duyệt và đang hiển thị trên trang chủ.</p>
            <p>Cảm ơn bạn đã sử dụng dịch vụ quảng cáo của Hội Trầm Hương Việt Nam.</p>
            <p><a href="${process.env.NEXTAUTH_URL}/banner/lich-su" style="display:inline-block;background:#1a5632;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Xem banner của tôi</a></p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send approval email:", err)
    }
  } else {
    await prisma.banner.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectReason: reason!.trim(),
      },
    })

    // Email user
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: banner.user.email,
        subject: "Banner của bạn bị từ chối",
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Xin chào ${banner.user.name},</h2>
            <p>Rất tiếc, banner <strong>"${banner.title}"</strong> đã bị Ban quản trị từ chối.</p>
            <p><strong>Lý do:</strong></p>
            <blockquote style="background:#f5f5f5;padding:12px;border-left:4px solid #ccc;">${reason}</blockquote>
            <p>Phí đăng ký sẽ được hoàn lại trong vòng 5-7 ngày làm việc qua tài khoản ngân hàng đã đăng ký.</p>
            <p>Bạn có thể đăng ký banner mới với nội dung điều chỉnh.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send rejection email:", err)
    }
  }

  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/admin/banner/[id]
 * Xóa banner vĩnh viễn (admin only).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const banner = await prisma.banner.findUnique({ where: { id }, select: { id: true } })
  if (!banner) return NextResponse.json({ error: "Banner không tồn tại" }, { status: 404 })

  // Cascade: Payment.bannerId sẽ set null tự động khi xóa banner (vì không onDelete: Cascade)
  // -> trước khi xóa banner, set bannerId = null trên các Payment liên quan
  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { bannerId: id },
      data: { bannerId: null },
    }),
    prisma.banner.delete({ where: { id } }),
  ])

  revalidateTag("homepage", "max")
  revalidateTag("banners", "max")

  return NextResponse.json({ success: true })
}
