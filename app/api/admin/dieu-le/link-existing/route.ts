import { NextResponse } from "next/server"
import { revalidateTag, revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { parseDriveFileId, getDriveFileMetadata } from "@/lib/google-drive"

/**
 * POST /api/admin/dieu-le/link-existing
 * Body: { driveUrl: string, locale?: "vi" | "en" | "zh" | "ar" }
 *
 * Liên kết SiteConfig Điều lệ với 1 file ĐÃ CÓ SẴN trên Google Drive, không
 * upload lại. Dùng cho admin đã có link tài liệu (copy từ /admin/tai-lieu).
 *
 * Khác biệt so với POST /api/admin/dieu-le/upload:
 *  - KHÔNG xóa file cũ nếu đã có (file cũ vẫn nằm trên Drive, chỉ là không
 *    còn được liên kết ở SiteConfig nữa).
 *  - Metadata (name/size) lấy từ Drive API.
 */

type Locale = "vi" | "en" | "zh" | "ar"
const LOCALES: readonly Locale[] = ["vi", "en", "zh", "ar"] as const

function keysFor(locale: Locale) {
  const suffix = locale === "vi" ? "" : `_${locale}`
  return {
    driveFileId: `dieu_le_drive_file_id${suffix}`,
    fileName: `dieu_le_file_name${suffix}`,
    fileSize: `dieu_le_file_size${suffix}`,
    uploadedAt: `dieu_le_uploaded_at${suffix}`,
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { driveUrl, locale: rawLocale } = body as {
    driveUrl?: string
    locale?: string
  }
  const locale: Locale = LOCALES.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : "vi"

  if (!driveUrl?.trim()) {
    return NextResponse.json({ error: "Thiếu URL Google Drive" }, { status: 400 })
  }

  const fileId = parseDriveFileId(driveUrl)
  if (!fileId) {
    return NextResponse.json(
      {
        error:
          "Không nhận diện được file ID từ URL. Hỗ trợ: https://drive.google.com/file/d/.../view hoặc ...?id=...",
      },
      { status: 400 },
    )
  }

  let metadata: { id: string; name: string; size: number; mimeType: string }
  try {
    metadata = await getDriveFileMetadata(fileId)
  } catch (err) {
    console.error("Drive metadata fetch failed:", err)
    return NextResponse.json(
      {
        error:
          "Không đọc được thông tin file từ Drive. Kiểm tra lại URL và đảm bảo file được chia sẻ với tài khoản Drive của Hội.",
      },
      { status: 400 },
    )
  }

  if (metadata.mimeType !== "application/pdf") {
    return NextResponse.json(
      { error: `File phải là PDF (hiện tại: ${metadata.mimeType})` },
      { status: 400 },
    )
  }

  const keys = keysFor(locale)
  const updates = [
    { key: keys.driveFileId, value: metadata.id },
    { key: keys.fileName, value: metadata.name },
    { key: keys.fileSize, value: String(metadata.size) },
    { key: keys.uploadedAt, value: new Date().toISOString() },
  ]
  await Promise.all(
    updates.map((u) =>
      prisma.siteConfig.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value, description: `Điều lệ Hội (${locale}) — ${u.key}` },
      }),
    ),
  )

  revalidatePath("/dieu-le")
  revalidatePath(`/${locale}/dieu-le`)
  revalidateTag("homepage", "max")

  return NextResponse.json({
    success: true,
    locale,
    driveFileId: metadata.id,
    fileName: metadata.name,
    fileSize: metadata.size,
  })
}
