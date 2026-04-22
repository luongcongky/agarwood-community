import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { MultimediaEditor } from "../MultimediaEditor"

export default async function NewMultimediaPage() {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    redirect("/login")
  }
  return <MultimediaEditor initial={null} />
}
