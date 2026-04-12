import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToDrive } from "@/lib/google-drive"

const LEGAL_CATEGORIES = ["DIEU_LE", "QUY_CHE", "GIAY_PHEP"] as const
type LegalCategory = (typeof LEGAL_CATEGORIES)[number]

// POST — Upload new legal document
// Form data: file (PDF), title, documentNumber, issuedDate, issuer, description, category, sortOrder
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const title = (formData.get("title") as string | null)?.trim()
    const documentNumber = (formData.get("documentNumber") as string | null)?.trim() || null
    const issuedDateStr = formData.get("issuedDate") as string | null
    const issuer = (formData.get("issuer") as string | null)?.trim() || null
    const description = (formData.get("description") as string | null)?.trim() || null
    const category = formData.get("category") as string | null
    const sortOrderStr = formData.get("sortOrder") as string | null

    // Validate
    if (!file) {
      return NextResponse.json({ error: "Thiếu file PDF" }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: "Thiếu tiêu đề" }, { status: 400 })
    }
    if (!category || !LEGAL_CATEGORIES.includes(category as LegalCategory)) {
      return NextResponse.json(
        { error: "Phân loại không hợp lệ (DIEU_LE | QUY_CHE | GIAY_PHEP)" },
        { status: 400 },
      )
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Chỉ chấp nhận file PDF" }, { status: 400 })
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File tối đa 20MB" }, { status: 400 })
    }

    const issuedDate = issuedDateStr ? new Date(issuedDateStr) : null
    const sortOrder = sortOrderStr ? Number(sortOrderStr) : 0
    const year = issuedDate?.getFullYear()

    // Upload to Drive
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uploadResult = await uploadToDrive(
      buffer,
      file.name,
      file.type,
      category as LegalCategory,
      year,
    )

    const doc = await prisma.document.create({
      data: {
        title,
        description,
        category: category as LegalCategory,
        documentNumber,
        issuedDate,
        issuer,
        sortOrder,
        isPublic: true,
        driveFileId: uploadResult.driveFileId,
        driveViewUrl: uploadResult.driveViewUrl,
        driveDownloadUrl: uploadResult.driveDownloadUrl,
        fileName: uploadResult.fileName,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
        uploadedBy: session.user.id,
      },
    })

    return NextResponse.json({ ok: true, documentId: doc.id })
  } catch (err) {
    console.error("[POST /api/admin/phap-ly]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload thất bại" },
      { status: 500 },
    )
  }
}
