import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")
  try {
    const body = await request.json()
    const { name, email, phone, serviceType, requirements, budget, deadline } = body

    // Basic validation
    if (!name || !email || !phone || !serviceType || !requirements) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 })
    }

    // Send confirmation email
    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: email,
      subject: "Xác nhận đơn hàng dịch vụ truyền thông",
      html: `
        <h2>Cảm ơn bạn đã đặt dịch vụ!</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Chúng tôi đã nhận được yêu cầu của bạn cho dịch vụ: <strong>${serviceType}</strong></p>
        <p>Chúng tôi sẽ liên hệ lại với bạn qua email hoặc số điện thoại <strong>${phone}</strong> trong vòng 24 giờ làm việc.</p>
        <hr />
        <p><strong>Chi tiết yêu cầu:</strong></p>
        <p>${requirements}</p>
        ${budget ? `<p><strong>Ngân sách dự kiến:</strong> ${budget}</p>` : ""}
        ${deadline ? `<p><strong>Deadline mong muốn:</strong> ${new Date(deadline).toLocaleDateString("vi-VN")}</p>` : ""}
        <hr />
        <p>Hội Trầm Hương Việt Nam</p>
        <p>📞 028 1234 5678 | 📧 hoitramhuong@vietnam.vn</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Media order error:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 })
  }
}
