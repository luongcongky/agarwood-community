import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { SettingsForm } from "./SettingsForm"

export const revalidate = 0

export default async function AdminSettingsPage() {
  const configs = await prisma.siteConfig.findMany({ orderBy: { key: "asc" } })
  const configMap = Object.fromEntries(configs.map((c: { key: string; value: string }) => [c.key, c.value]))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Cài đặt Hệ thống</h1>
      <SettingsForm configMap={configMap} />

      {/* Điều lệ Hội — File PDF: đã chuyển sang trang Cấu hình Trang tĩnh để
          gom chung mọi config text + file của các trang public. Hiển thị
          shortcut tại đây để admin cũ biết đường tìm. */}
      <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-5">
        <p className="text-sm text-brand-700">
          📄 <strong>Điều lệ Hội — File PDF</strong> đã được chuyển sang{" "}
          <Link
            href="/admin/trang-tinh?page=dieuLe"
            className="font-semibold text-brand-700 underline hover:text-brand-900"
          >
            Cấu hình Trang tĩnh → Điều lệ
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
