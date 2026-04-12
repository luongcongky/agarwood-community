import { prisma } from "@/lib/prisma"
import { SettingsForm } from "./SettingsForm"
import { DieuLeUploader } from "./DieuLeUploader"

export const revalidate = 0

export default async function AdminSettingsPage() {
  const configs = await prisma.siteConfig.findMany({ orderBy: { key: "asc" } })
  const configMap = Object.fromEntries(configs.map((c: { key: string; value: string }) => [c.key, c.value]))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Cài đặt Hệ thống</h1>
      <SettingsForm configMap={configMap} />
      <DieuLeUploader
        currentFileId={configMap.dieu_le_drive_file_id ?? null}
        currentFileName={configMap.dieu_le_file_name ?? null}
        currentFileSize={configMap.dieu_le_file_size ?? null}
        currentUploadedAt={configMap.dieu_le_uploaded_at ?? null}
      />
    </div>
  )
}
