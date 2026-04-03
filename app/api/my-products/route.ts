import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  })
  if (!company) {
    return NextResponse.json({ products: [] })
  }

  const products = await prisma.product.findMany({
    where: { companyId: company.id },
    select: {
      id: true,
      name: true,
      slug: true,
      certStatus: true,
      imageUrls: true,
    },
  })

  return NextResponse.json({ products })
}
