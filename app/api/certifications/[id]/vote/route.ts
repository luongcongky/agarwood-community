import { NextResponse } from "next/server"
import { Resend } from "resend"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { castVote, CouncilError } from "@/lib/certification-council"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = (await req.json()) as { vote?: string; comment?: string }

  if (body.vote !== "APPROVE" && body.vote !== "REJECT") {
    return NextResponse.json({ error: "Vote phải là APPROVE hoặc REJECT" }, { status: 400 })
  }
  if (typeof body.comment !== "string" || !body.comment.trim()) {
    return NextResponse.json({ error: "Bắt buộc phải để lại nhận xét" }, { status: 400 })
  }

  try {
    const result = await castVote(id, session.user.id, body.vote, body.comment)

    // Sau khi transaction chốt, gửi email kết quả cho người nộp đơn.
    if (result.finalDecision) {
      void sendFinalDecisionEmail(id, result)
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    if (err instanceof CouncilError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error("vote failed:", err)
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 })
  }
}

async function sendFinalDecisionEmail(
  certId: string,
  result: { finalDecision: "APPROVED"; certCode: string } | { finalDecision: "REJECTED" },
) {
  try {
    const cert = await prisma.certification.findUnique({
      where: { id: certId },
      include: {
        product: { select: { name: true, slug: true } },
        applicant: { select: { name: true, email: true } },
      },
    })
    if (!cert) return

    const siteUrl = process.env.NEXTAUTH_URL ?? ""

    if (result.finalDecision === "APPROVED") {
      const verifyUrl = `${siteUrl}/verify/${result.certCode}`
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: cert.applicant.email,
        subject: `Chúc mừng! Sản phẩm ${cert.product.name} đã được chứng nhận`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Chúc mừng ${cert.applicant.name}!</h2>
            <p>Hội đồng thẩm định đã nhất trí cấp chứng nhận cho sản phẩm <strong>${cert.product.name}</strong>.</p>
            <p><strong>Mã chứng nhận:</strong> ${result.certCode}</p>
            <p>Trang xác minh chứng nhận: <a href="${verifyUrl}">${verifyUrl}</a></p>
            <p>Bạn có thể in hoặc lưu PDF từ trang xác minh để sử dụng.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam</p>
          </div>
        `,
      })
    } else {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: cert.applicant.email,
        subject: `[Hội Trầm Hương] Đơn chứng nhận ${cert.product.name} bị từ chối`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Xin chào ${cert.applicant.name},</h2>
            <p>Rất tiếc, hội đồng thẩm định đã không đồng ý cấp chứng nhận cho sản phẩm <strong>${cert.product.name}</strong>.</p>
            ${cert.reviewNote ? `<p><strong>Lý do:</strong> ${cert.reviewNote}</p>` : ""}
            <p>Phí thẩm định sẽ được hoàn lại theo thông tin tài khoản bạn đã khai báo. Chúng tôi sẽ liên hệ sớm để xác nhận.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam</p>
          </div>
        `,
      })
    }
  } catch (err) {
    console.error("Failed to send final decision email:", err)
  }
}
