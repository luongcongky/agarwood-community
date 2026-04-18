import { prisma } from "@/lib/prisma"
import { SettingsForm } from "./SettingsForm"
import { DieuLeUploader } from "./DieuLeUploader"

export const revalidate = 0

export default async function AdminSettingsPage() {
  const configs = await prisma.siteConfig.findMany({ orderBy: { key: "asc" } })
  const configMap = Object.fromEntries(configs.map((c: { key: string; value: string }) => [c.key, c.value]))

  const uploaderLocales = ["vi", "en", "zh"] as const

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Cài đặt Hệ thống</h1>
      <SettingsForm configMap={configMap} />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-brand-900">Điều lệ Hội — File PDF</h2>
          <p className="text-xs text-brand-500 mt-1">
            Upload 1 file PDF cho mỗi ngôn ngữ. Bản VI là bản pháp lý gốc. Bản EN/ZH là bản dịch công chứng
            (không bắt buộc — để trống sẽ fallback về VI trên trang viewer).
          </p>
        </div>
        {uploaderLocales.map((locale) => {
          const suffix = locale === "vi" ? "" : `_${locale}`
          return (
            <DieuLeUploader
              key={locale}
              locale={locale}
              currentFileId={configMap[`dieu_le_drive_file_id${suffix}`] ?? null}
              currentFileName={configMap[`dieu_le_file_name${suffix}`] ?? null}
              currentFileSize={configMap[`dieu_le_file_size${suffix}`] ?? null}
              currentUploadedAt={configMap[`dieu_le_uploaded_at${suffix}`] ?? null}
            />
          )
        })}
      </div>
    </div>
  )
}
