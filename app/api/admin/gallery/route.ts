import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { isAdmin, canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { clearHeroCache } from "@/lib/hero"

export async function GET() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const items = await prisma.heroImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const { imageUrl, label, sortOrder, isActive } = body as Record<string, unknown>

  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return NextResponse.json({ error: "Thiếu imageUrl" }, { status: 400 })
  }

  const item = await prisma.heroImage.create({
    data: {
      imageUrl: imageUrl.trim(),
      label: typeof label === "string" && label.trim() ? label.trim() : null,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== false,
    },
  })
  clearHeroCache()
  revalidatePath("/", "layout")
  return NextResponse.json({ item })
}
