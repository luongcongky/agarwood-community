import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToDrive } from "@/lib/google-drive"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string | null
    const documentNumber = formData.get("documentNumber") as string | null
    const issuedDate = formData.get("issuedDate") as string | null
    const isPublic = formData.get("isPublic") === "true"

    if (!file || !title || !category) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc (file, tiêu đề, danh mục)" }, { status: 400 })
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const year = issuedDate ? new Date(issuedDate).getFullYear() : new Date().getFullYear()

    // Upload to Google Drive
    const driveResult = await uploadToDrive(buffer, file.name, file.type, category, year)

    // Save to DB
    const document = await prisma.document.create({
      data: {
        title,
        description: description || null,
        category: category as "CONG_VAN_DEN" | "CONG_VAN_DI" | "BIEN_BAN_HOP" | "QUYET_DINH" | "HOP_DONG",
        documentNumber: documentNumber || null,
        issuedDate: issuedDate ? new Date(issuedDate) : null,
        isPublic,
        driveFileId: driveResult.driveFileId,
        driveViewUrl: driveResult.driveViewUrl,
        driveDownloadUrl: driveResult.driveDownloadUrl,
        fileName: driveResult.fileName,
        mimeType: driveResult.mimeType,
        fileSize: driveResult.fileSize,
        uploadedBy: session.user.id,
      },
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (err) {
    console.error("Document upload error:", err)
    const message = err instanceof Error ? err.message : "Upload thất bại"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
