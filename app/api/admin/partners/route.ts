import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import type { PartnerCategory } from "@prisma/client"

const VALID_CATEGORIES: PartnerCategory[] = [
  "GOVERNMENT",
  "ASSOCIATION",
  "RESEARCH",
  "ENTERPRISE",
  "INTERNATIONAL",
  "MEDIA",
  "OTHER",
]

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { name, shortName, category, logoUrl, websiteUrl, description, sortOrder, isActive } =
    body as Record<string, unknown>

  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Tên đối tác tối thiểu 2 ký tự" }, { status: 400 })
  }

  const cat: PartnerCategory = VALID_CATEGORIES.includes(category as PartnerCategory)
    ? (category as PartnerCategory)
    : "OTHER"

  const partner = await prisma.partner.create({
    data: {
      name: name.trim(),
      shortName: typeof shortName === "string" && shortName.trim() ? shortName.trim() : null,
      category: cat,
      logoUrl: typeof logoUrl === "string" && logoUrl.trim() ? logoUrl.trim() : null,
      websiteUrl: typeof websiteUrl === "string" && websiteUrl.trim() ? websiteUrl.trim() : null,
      description:
        typeof description === "string" && description.trim() ? description.trim() : null,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
    },
  })

  revalidateTag("partners", "max")
  return NextResponse.json({ partner }, { status: 201 })
}
