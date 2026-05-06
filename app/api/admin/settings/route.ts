import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
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
  revalidatePath("/gioi-thieu-v2")
  revalidatePath("/admin")
  revalidateTag("footer", "max")
  revalidateTag("site-config", "max")

  return NextResponse.json({ success: true })
}
