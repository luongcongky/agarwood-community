import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  if (!token || !email) {
    return NextResponse.json({ valid: false, error: "Thiếu thông tin" })
  }

  const record = await prisma.verificationToken.findFirst({
    where: {
      token,
      identifier: email,
      expires: { gt: new Date() },
    },
  })

  if (!record) {
    return NextResponse.json({ valid: false, error: "Liên kết đã hết hạn hoặc không hợp lệ" })
  }

  return NextResponse.json({ valid: true })
}
