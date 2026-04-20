import { NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

const CONTACT_INBOX =
  process.env.CONTACT_INBOX_EMAIL || "hoitramhuongvietnam2010@gmail.com"

export async function POST(req: Request) {
  let body: { name?: string; email?: string; phone?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 })
  }

  const name = body.name?.trim()
  const email = body.email?.trim()
  const phone = body.phone?.trim() || ""
  const message = body.message?.trim()

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ họ tên, email và nội dung." },
      { status: 400 },
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 })
  }
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return NextResponse.json({ error: "Nội dung quá dài." }, { status: 400 })
  }

  // Persist first — DB is the source of truth. Even if email delivery
  // fails (Resend down, inbox full, spam-filtered), admin still sees
  // the request in /admin/lien-he and the notification bell.
  await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone: phone || null,
      message,
    },
  })

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    )

  // Email is a side-channel notifier — any failure is logged but does
  // not fail the request, because the DB row is already saved.
  try {
    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: CONTACT_INBOX,
      replyTo: email,
      subject: `[Liên hệ website] ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2>Liên hệ mới từ website</h2>
          <p><strong>Họ tên:</strong> ${esc(name)}</p>
          <p><strong>Email:</strong> ${esc(email)}</p>
          ${phone ? `<p><strong>Điện thoại:</strong> ${esc(phone)}</p>` : ""}
          <p><strong>Nội dung:</strong></p>
          <div style="white-space:pre-wrap;padding:12px;background:#f5f5f5;border-radius:8px;">${esc(message)}</div>
          <p style="color:#888;font-size:12px;margin-top:16px;">Tin nhắn đã được lưu trong /admin/lien-he.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send contact email (DB row still saved):", err)
  }

  return NextResponse.json({ success: true })
}
