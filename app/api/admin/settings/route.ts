import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updates: Record<string, string> = await req.json()

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.siteConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  revalidatePath("/")
  revalidatePath("/gia-han")
  revalidatePath("/dich-vu")
  revalidatePath("/chung-nhan/nop-don")
  revalidatePath("/gioi-thieu")
  revalidatePath("/admin")

  return NextResponse.json({ success: true })
}
