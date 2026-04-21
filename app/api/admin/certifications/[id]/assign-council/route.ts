import { NextResponse } from "next/server"
import { Resend } from "resend"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAdminWrite } from "@/lib/roles"
import { assignCouncil, CouncilError } from "@/lib/certification-council"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { reviewerIds } = (await req.json()) as { reviewerIds?: string[] }

  if (!Array.isArray(reviewerIds)) {
    return NextResponse.json({ error: "reviewerIds phải là mảng" }, { status: 400 })
  }

  try {
    await assignCouncil(id, reviewerIds)
    // Fire-and-forget notify each reviewer; don't block the admin response on SMTP.
    void notifyReviewers(id, reviewerIds)
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof CouncilError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error("assign-council failed:", err)
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 })
  }
}

async function notifyReviewers(certId: string, reviewerIds: string[]) {
  try {
    const [cert, reviewers] = await Promise.all([
      prisma.certification.findUnique({
        where: { id: certId },
        select: {
          reviewMode: true,
          product: { select: { name: true } },
          applicant: { select: { name: true } },
        },
      }),
      prisma.user.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, name: true, email: true },
      }),
    ])
    if (!cert) return

    const siteUrl = process.env.NEXTAUTH_URL ?? ""
    const voteUrl = `${siteUrl}/hoi-dong/cho-duyet/${certId}`
    const modeText = cert.reviewMode === "ONLINE" ? "Online" : "Offline"

    await Promise.all(
      reviewers.map((r) =>
        resend.emails.send({
          from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
          to: r.email,
          subject: `[HĐ Thẩm định] Đơn mới: ${cert.product.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Chào ${r.name},</h2>
              <p>Bạn vừa được chỉ định vào Hội đồng thẩm định cho đơn chứng nhận sản phẩm:</p>
              <ul>
                <li><strong>Sản phẩm:</strong> ${cert.product.name}</li>
                <li><strong>Người nộp:</strong> ${cert.applicant.name}</li>
                <li><strong>Hình thức:</strong> ${modeText}</li>
              </ul>
              <p>Bắt buộc để lại nhận xét khi vote. Đủ 5/5 APPROVE đơn được duyệt, 1 REJECT đơn bị tự động từ chối (veto).</p>
              <p><a href="${voteUrl}" style="display:inline-block;background:#1a5632;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Xem & Vote</a></p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
              <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam</p>
            </div>
          `,
        }),
      ),
    )
  } catch (err) {
    console.error("Failed to notify reviewers:", err)
  }
}
