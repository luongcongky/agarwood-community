import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { AdminBannerEditor } from "../AdminBannerEditor"

export const metadata = {
  title: "Tạo banner | Admin",
}

export default async function AdminBannerCreatePage() {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    redirect("/login")
  }
  return <AdminBannerEditor />
}
