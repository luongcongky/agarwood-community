import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { MultimediaEditor } from "../MultimediaEditor"

export const dynamic = "force-dynamic"

export default async function EditMultimediaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login")
  }

  const { id } = await params
  const item = await prisma.multimedia.findUnique({ where: { id } })
  if (!item) notFound()

  return <MultimediaEditor initial={item} />
}
