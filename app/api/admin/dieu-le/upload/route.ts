import { NextResponse } from "next/server"
import { revalidateTag, revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToDrive, deleteFromDrive } from "@/lib/google-drive"

/**
 * POST /api/admin/dieu-le/upload
 * Upload file PDF Điều lệ Hội lên Google Drive và lưu metadata vào SiteConfig.
 *
 * Ghi nhận vào 4 SiteConfig keys:
 *  - dieu_le_drive_file_id      — Drive file ID (để build preview/download URL)
 *  - dieu_le_file_name          — Tên file gốc
 *  - dieu_le_file_size          — Kích thước (bytes)
 *  - dieu_le_uploaded_at        — ISO timestamp
 *
 * Nếu đã có file cũ → xóa file cũ trên Drive trước khi upload file mới.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Vui lòng chọn file PDF" }, { status: 400 })
    }

    // Validate: chỉ PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Chỉ chấp nhận file PDF" },
        { status: 400 },
      )
    }

    // Max 20MB (match với lib/google-drive MAX_FILE_SIZE)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File tối đa 20MB" },
        { status: 400 },
      )
    }

    // Xóa file cũ trên Drive nếu có
    const oldFileIdRow = await prisma.siteConfig.findUnique({
      where: { key: "dieu_le_drive_file_id" },
    })
    if (oldFileIdRow?.value) {
      try {
        await deleteFromDrive(oldFileIdRow.value)
      } catch (err) {
        // Non-fatal — file có thể đã bị xóa manual trên Drive
        console.warn("Failed to delete old dieu le file:", err)
      }
    }

    // Upload file mới
    const buffer = Buffer.from(await file.arrayBuffer())
    const year = new Date().getFullYear()
    const driveResult = await uploadToDrive(
      buffer,
      file.name,
      file.type,
      "QUYET_DINH", // Lưu vào folder "Quyết định"
      year,
    )

    // Lưu metadata vào SiteConfig (upsert)
    const updates = [
      { key: "dieu_le_drive_file_id", value: driveResult.driveFileId },
      { key: "dieu_le_file_name", value: driveResult.fileName },
      { key: "dieu_le_file_size", value: String(driveResult.fileSize) },
      { key: "dieu_le_uploaded_at", value: new Date().toISOString() },
    ]
    await Promise.all(
      updates.map((u) =>
        prisma.siteConfig.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value, description: `Điều lệ Hội — ${u.key}` },
        }),
      ),
    )

    // Invalidate public /dieu-le page cache
    revalidatePath("/dieu-le")
    revalidateTag("homepage", "max")

    return NextResponse.json({
      success: true,
      driveFileId: driveResult.driveFileId,
      driveViewUrl: driveResult.driveViewUrl,
      fileName: driveResult.fileName,
      fileSize: driveResult.fileSize,
    })
  } catch (err) {
    console.error("Dieu le upload error:", err)
    const message = err instanceof Error ? err.message : "Upload thất bại"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/dieu-le/upload
 * Xóa file Điều lệ hiện tại (trên Drive + clear SiteConfig keys).
 */
export async function DELETE() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const fileIdRow = await prisma.siteConfig.findUnique({
    where: { key: "dieu_le_drive_file_id" },
  })
  if (!fileIdRow?.value) {
    return NextResponse.json({ error: "Không có file để xóa" }, { status: 404 })
  }

  try {
    await deleteFromDrive(fileIdRow.value)
  } catch (err) {
    console.warn("Failed to delete from Drive (may already be deleted):", err)
  }

  // Clear all 4 keys
  await prisma.siteConfig.deleteMany({
    where: {
      key: {
        in: [
          "dieu_le_drive_file_id",
          "dieu_le_file_name",
          "dieu_le_file_size",
          "dieu_le_uploaded_at",
        ],
      },
    },
  })

  revalidatePath("/dieu-le")
  revalidateTag("homepage", "max")

  return NextResponse.json({ success: true })
}
