import { NextResponse } from "next/server"
import { revalidateTag, revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { uploadToDrive, deleteFromDrive } from "@/lib/google-drive"

/**
 * POST /api/admin/dieu-le/upload?locale={vi|en|zh|ar}
 * Upload file PDF Điều lệ Hội lên Google Drive và lưu metadata vào SiteConfig.
 *
 * Per-locale keys:
 *  - locale=vi (default): dieu_le_drive_file_id, dieu_le_file_name, dieu_le_file_size, dieu_le_uploaded_at
 *  - locale=en: dieu_le_drive_file_id_en, dieu_le_file_name_en, ...
 *  - locale=zh: dieu_le_drive_file_id_zh, ...
 *  - locale=ar: dieu_le_drive_file_id_ar, ...
 *
 * Nếu đã có file cũ cùng locale → xóa file cũ trên Drive trước khi upload file mới.
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

function parseLocale(url: URL): Locale {
  const raw = url.searchParams.get("locale")
  if (raw && LOCALES.includes(raw as Locale)) return raw as Locale
  return "vi"
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const locale = parseLocale(new URL(request.url))
  const keys = keysFor(locale)

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Vui lòng chọn file PDF" }, { status: 400 })
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Chỉ chấp nhận file PDF" }, { status: 400 })
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File tối đa 20MB" }, { status: 400 })
    }

    // Xóa file cũ cùng locale trên Drive nếu có
    const oldFileIdRow = await prisma.siteConfig.findUnique({
      where: { key: keys.driveFileId },
    })
    if (oldFileIdRow?.value) {
      try {
        await deleteFromDrive(oldFileIdRow.value)
      } catch (err) {
        console.warn(`Failed to delete old ${locale} dieu le file:`, err)
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const year = new Date().getFullYear()
    const driveResult = await uploadToDrive(
      buffer,
      file.name,
      file.type,
      "QUYET_DINH",
      year,
    )

    const updates = [
      { key: keys.driveFileId, value: driveResult.driveFileId },
      { key: keys.fileName, value: driveResult.fileName },
      { key: keys.fileSize, value: String(driveResult.fileSize) },
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
      driveFileId: driveResult.driveFileId,
      driveViewUrl: driveResult.driveViewUrl,
      fileName: driveResult.fileName,
      fileSize: driveResult.fileSize,
    })
  } catch (err) {
    console.error(`Dieu le (${locale}) upload error:`, err)
    const message = err instanceof Error ? err.message : "Upload thất bại"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/dieu-le/upload?locale={vi|en|zh}
 * Xóa file Điều lệ hiện tại ở locale đó (trên Drive + clear SiteConfig keys).
 */
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const locale = parseLocale(new URL(request.url))
  const keys = keysFor(locale)

  const fileIdRow = await prisma.siteConfig.findUnique({
    where: { key: keys.driveFileId },
  })
  if (!fileIdRow?.value) {
    return NextResponse.json({ error: "Không có file để xóa" }, { status: 404 })
  }

  try {
    await deleteFromDrive(fileIdRow.value)
  } catch (err) {
    console.warn("Failed to delete from Drive (may already be deleted):", err)
  }

  await prisma.siteConfig.deleteMany({
    where: {
      key: { in: [keys.driveFileId, keys.fileName, keys.fileSize, keys.uploadedAt] },
    },
  })

  revalidatePath("/dieu-le")
  revalidatePath(`/${locale}/dieu-le`)
  revalidateTag("homepage", "max")

  return NextResponse.json({ success: true, locale })
}
