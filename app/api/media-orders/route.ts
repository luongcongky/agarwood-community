import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

const SERVICE_LABELS: Record<string, string> = {
  ARTICLE_COMPANY: "Bài viết doanh nghiệp",
  ARTICLE_PRODUCT: "Bài viết sản phẩm",
  PRESS_RELEASE: "Thông cáo báo chí",
  SOCIAL_CONTENT: "Nội dung mạng xã hội",
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, companyName, serviceType, requirements, targetKeywords, referenceUrl, budget, deadline } = body

    if (!name || !email || !phone || !serviceType || !requirements) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 })
    }

    // Get requesterId if logged in (optional — guests can also order)
    const session = await auth()
    const requesterId = session?.user?.id

    // Generate order reference: MO-{YYYYMMDD}-{random4}
    const now = new Date()
    const dateStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("")
    const orderRef = `MO-${dateStr}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`

    // Create MediaOrder in DB
    await prisma.mediaOrder.create({
      data: {
        requesterId: requesterId ?? "guest",
        requesterName: name,
        requesterEmail: email,
        requesterPhone: phone,
        serviceType,
        requirements,
        targetKeywords: targetKeywords || null,
        referenceUrls: referenceUrl ? [referenceUrl] : [],
        budget: budget || null,
        deadline: deadline ? new Date(deadline) : null,
        status: "NEW",
      },
    })

    const serviceLabel = SERVICE_LABELS[serviceType] ?? serviceType

    // Email 1: Confirmation to customer
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: email,
        subject: `Xác nhận đơn dịch vụ ${serviceLabel} — Hội Trầm Hương Việt Nam`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Cảm ơn bạn đã đặt dịch vụ!</h2>
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Chúng tôi đã nhận được yêu cầu <strong>${serviceLabel}</strong> của bạn.</p>
            <p>Mã tham chiếu: <strong>${orderRef}</strong></p>
            <p>Chúng tôi sẽ liên hệ trong vòng 24 giờ qua email hoặc SĐT <strong>${phone}</strong>.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
            <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send customer email:", err)
    }

    // Email 2: Notification to admin
    try {
      const adminEmail = (await prisma.siteConfig.findUnique({ where: { key: "association_email" } }))?.value ?? "admin@hoi-tram-huong.vn"
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: adminEmail,
        subject: `[Đơn mới] ${name} — ${serviceLabel}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h3>Đơn dịch vụ truyền thông mới</h3>
            <p><strong>Mã:</strong> ${orderRef}</p>
            <p><strong>Khách:</strong> ${name} ${companyName ? `(${companyName})` : ""}</p>
            <p><strong>Email:</strong> ${email} · <strong>SĐT:</strong> ${phone}</p>
            <p><strong>Dịch vụ:</strong> ${serviceLabel}</p>
            <p><strong>Ngân sách:</strong> ${budget || "Chưa chọn"}</p>
            ${deadline ? `<p><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString("vi-VN")}</p>` : ""}
            ${targetKeywords ? `<p><strong>Từ khóa SEO:</strong> ${targetKeywords}</p>` : ""}
            <p><strong>Yêu cầu:</strong></p>
            <p style="background:#f5f5f5;padding:12px;border-radius:8px;">${requirements}</p>
            <p><a href="${process.env.NEXTAUTH_URL}/admin/truyen-thong" style="display:inline-block;background:#1a5632;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Xem trong CRM</a></p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send admin email:", err)
    }

    return NextResponse.json({ success: true, orderRef })
  } catch (error) {
    console.error("Media order error:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 })
  }
}
