import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  })

  return NextResponse.json({ isActive: !user.isActive })
}
