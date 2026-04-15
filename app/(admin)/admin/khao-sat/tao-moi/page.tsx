import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SurveyEditor } from "../SurveyEditor"

export default async function NewSurveyPage() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) notFound()

  return (
    <div className="space-y-4">
      <Link href="/admin/khao-sat" className="text-sm text-brand-600 hover:underline">← Quay lại danh sách</Link>
      <h1 className="text-2xl font-bold text-brand-900">Tạo khảo sát mới</h1>
      <SurveyEditor />
    </div>
  )
}
