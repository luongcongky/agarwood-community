import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin, canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { clearMenuCache } from "@/lib/menu"

export async function GET() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const items = await prisma.menuItem.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const {
    label,
    href,
    menuKey,
    parentId,
    sortOrder,
    isVisible,
    isNew,
    comingSoon,
    openInNewTab,
    matchPrefixes,
  } = body as Record<string, unknown>

  if (typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "Thiếu label" }, { status: 400 })
  }
  if (typeof href !== "string" || !href.trim()) {
    return NextResponse.json({ error: "Thiếu href" }, { status: 400 })
  }

  const item = await prisma.menuItem.create({
    data: {
      label: label.trim(),
      href: href.trim(),
      menuKey: typeof menuKey === "string" && menuKey.trim() ? menuKey.trim() : null,
      parentId: typeof parentId === "string" && parentId ? parentId : null,
      sortOrder: Number(sortOrder) || 0,
      isVisible: isVisible !== false,
      isNew: !!isNew,
      comingSoon: !!comingSoon,
      openInNewTab: !!openInNewTab,
      matchPrefixes: Array.isArray(matchPrefixes)
        ? matchPrefixes.filter((s): s is string => typeof s === "string" && s.trim() !== "")
        : [],
    },
  })
  clearMenuCache()
  return NextResponse.json({ item })
}
