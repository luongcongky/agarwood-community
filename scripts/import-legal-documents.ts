/**
 * Import Văn bản pháp quy từ trang web cũ hoitramhuongvietnam.org
 *
 * Workflow:
 *  1. Download từng PDF từ trang cũ
 *  2. Upload lên Google Drive qua lib/google-drive.ts (OAuth delegation)
 *  3. Lưu metadata vào Document table (category = DIEU_LE / QUY_CHE / GIAY_PHEP)
 *
 * Usage:
 *   npx tsx scripts/import-legal-documents.ts
 *
 * Yêu cầu:
 *  - .env.local đã có GOOGLE_DRIVE_REFRESH_TOKEN + GOOGLE_DRIVE_ROOT_FOLDER_ID
 *  - DB đã migrate (add_legal_doc_categories)
 *  - Có admin user trong DB (để set uploadedBy)
 *
 * Idempotent: chạy lại sẽ skip các document đã tồn tại (check theo title + category).
 */

// Load env vars manually before importing prisma/google-drive
import { readFileSync, existsSync } from "fs"

function loadEnvLocal(): void {
  const envPath = ".env.local"
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, "utf-8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}
loadEnvLocal()

// Dynamic imports AFTER env is loaded (tsx compiles to CJS, so require-like semantics apply)
/* eslint-disable @typescript-eslint/no-require-imports */
const { prisma } = require("../lib/prisma") as typeof import("../lib/prisma")
const { uploadToDrive } = require("../lib/google-drive") as typeof import("../lib/google-drive")
/* eslint-enable @typescript-eslint/no-require-imports */

type SourceDoc = {
  title: string
  description: string
  documentNumber: string
  issuedDate: string // YYYY-MM-DD
  issuer: string
  category: "DIEU_LE" | "QUY_CHE" | "GIAY_PHEP"
  sortOrder: number
  sourceUrl: string // URL gốc trên trang cũ, null nếu cần upload thủ công
  fileName: string // tên file khi lưu Drive
}

const SOURCE_DOCS: SourceDoc[] = [
  // ── ĐIỀU LỆ ──
  {
    title: "Điều lệ (sửa đổi, bổ sung) Hội Trầm hương Việt Nam",
    description:
      "Điều lệ Hội Trầm hương Việt Nam (sửa đổi, bổ sung) được Bộ trưởng Bộ Nội vụ phê duyệt theo Quyết định số 1086/QĐ-BNV ngày 29/12/2023. Gồm 8 chương, 27 điều, áp dụng cho nhiệm kỳ III (2023–2028).",
    documentNumber: "1086/QĐ-BNV",
    issuedDate: "2023-12-29",
    issuer: "Bộ Nội vụ",
    category: "DIEU_LE",
    sortOrder: 1,
    sourceUrl:
      "http://hoitramhuongvietnam.org/file/Điều lệ (sửa đổi, bổ sung) HộiTrầm hương Việt Nam năm 2023.pdf",
    fileName: "Dieu-le-Hoi-Tram-Huong-Viet-Nam-2023.pdf",
  },

  // ── QUY CHẾ (7) — sort theo thứ tự quan trọng ──
  {
    title: "Quy chế hoạt động của Ban Chấp hành Hội",
    description:
      "Quy chế hoạt động của Ban Chấp hành Hội Trầm hương Việt Nam ban hành theo Quyết định số 48/QĐ-VAWA.",
    documentNumber: "48/QĐ-VAWA",
    issuedDate: "2024-01-22",
    issuer: "Chủ tịch Hội Trầm hương Việt Nam",
    category: "QUY_CHE",
    sortOrder: 1,
    sourceUrl:
      "http://hoitramhuongvietnam.org/file/Quy chế hoạt động của Ban Chấp hành Hội.pdf",
    fileName: "QC-48-Hoat-dong-Ban-Chap-hanh.pdf",
  },
  {
    title: "Quy chế quản lý tài chính của Hội",
    description:
      "Quy chế quản lý tài chính của Hội Trầm hương Việt Nam ban hành theo Quyết định số 49/QĐ-VAWA.",
    documentNumber: "49/QĐ-VAWA",
    issuedDate: "2023-01-22",
    issuer: "Chủ tịch Hội Trầm hương Việt Nam",
    category: "QUY_CHE",
    sortOrder: 2,
    sourceUrl:
      "http://hoitramhuongvietnam.org/file/Quy chế quản lý tài chính của Hội.pdf",
    fileName: "QC-49-Quan-ly-tai-chinh.pdf",
  },
  {
    title: "Quy chế hoạt động của Ban Thường vụ Hội",
    description:
      "Quy chế hoạt động của Ban Thường vụ Hội Trầm hương Việt Nam ban hành theo Quyết định số 50/QĐ-VAWA.",
    documentNumber: "50/QĐ-VAWA",
    issuedDate: "2024-01-22",
    issuer: "Chủ tịch Hội Trầm hương Việt Nam",
    category: "QUY_CHE",
    sortOrder: 3,
    sourceUrl:
      "http://hoitramhuongvietnam.org/file/Quy chế hoạt động của Ban Thường vụ Hội.pdf",
    fileName: "QC-50-Hoat-dong-Ban-Thuong-vu.pdf",
  },
  {
    title: "Quy chế hoạt động của Ban Kiểm tra Hội",
    description:
      "Quy chế hoạt động của Ban Kiểm tra Hội Trầm hương Việt Nam ban hành theo Quyết định số 52/QĐ-VAWA.",
    documentNumber: "52/QĐ-VAWA",
    issuedDate: "2024-01-22",
    issuer: "Chủ tịch Hội Trầm hương Việt Nam",
    category: "QUY_CHE",
    sortOrder: 4,
    sourceUrl:
      "http://hoitramhuongvietnam.org/file/Quy chế hoạt động của Ban Kiểm tra Hội.pdf",
    fileName: "QC-52-Hoat-dong-Ban-Kiem-tra.pdf",
  },
  {
    title: "Quy chế quản lý và sử dụng con dấu trong công tác văn thư",
    description:
      "Quy chế quản lý và sử dụng con dấu của Hội Trầm hương Việt Nam ban hành theo Quyết định số 54/QĐ-VAWA.",
    documentNumber: "54/QĐ-VAWA",
    issuedDate: "2024-01-22",
    issuer: "Chủ tịch Hội Trầm hương Việt Nam",
    category: "QUY_CHE",
    sortOrder: 5,
    sourceUrl:
      "http://hoitramhuongvietnam.org/file/Quy chế quản lý và sử dụng con dấu Hội.pdf",
    fileName: "QC-54-Quan-ly-con-dau.pdf",
  },
  {
    title: "Quy chế Hội viên của Hội Trầm hương Việt Nam",
    description:
      "Quy chế Hội viên Hội Trầm hương Việt Nam ban hành theo Quyết định số 56/QĐ-VAWA — quy định quyền, nghĩa vụ, thủ tục kết nạp và ra khỏi Hội.",
    documentNumber: "56/QĐ-VAWA",
    issuedDate: "2024-01-22",
    issuer: "Chủ tịch Hội Trầm hương Việt Nam",
    category: "QUY_CHE",
    sortOrder: 6,
    sourceUrl:
      "http://hoitramhuongvietnam.org/file/Quy chế hội viên.pdf",
    fileName: "QC-56-Hoi-vien.pdf",
  },
  {
    title: "Quy chế hoạt động Văn phòng của Hội Trầm hương Việt Nam",
    description:
      "Quy chế hoạt động Văn phòng Hội Trầm hương Việt Nam ban hành theo Quyết định số 58/QĐ-VAWA.",
    documentNumber: "58/QĐ-VAWA",
    issuedDate: "2023-01-22",
    issuer: "Chủ tịch Hội Trầm hương Việt Nam",
    category: "QUY_CHE",
    sortOrder: 7,
    sourceUrl:
      "http://hoitramhuongvietnam.org/file/Quy chế hoạt động văn phòng Hội.pdf",
    fileName: "QC-58-Hoat-dong-Van-phong.pdf",
  },
]

async function downloadPdf(url: string): Promise<Buffer> {
  // Node.js 18+ has fetch
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Agarwood Import Script)" },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function importOne(doc: SourceDoc, adminId: string): Promise<"imported" | "skipped" | "failed"> {
  const existing = await prisma.document.findFirst({
    where: { title: doc.title, category: doc.category },
  })
  if (existing) {
    console.log(`   ⏭️  Skip (đã tồn tại): ${doc.title}`)
    return "skipped"
  }

  try {
    console.log(`   📥 Downloading: ${doc.sourceUrl}`)
    const pdfBuffer = await downloadPdf(doc.sourceUrl)
    console.log(`      Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`)

    const year = new Date(doc.issuedDate).getFullYear()
    console.log(`   📤 Uploading to Drive: ${doc.fileName}`)
    const uploadResult = await uploadToDrive(
      pdfBuffer,
      doc.fileName,
      "application/pdf",
      doc.category,
      year,
    )

    await prisma.document.create({
      data: {
        title: doc.title,
        description: doc.description,
        category: doc.category,
        documentNumber: doc.documentNumber,
        issuedDate: new Date(doc.issuedDate),
        issuer: doc.issuer,
        sortOrder: doc.sortOrder,
        isPublic: true,
        driveFileId: uploadResult.driveFileId,
        driveViewUrl: uploadResult.driveViewUrl,
        driveDownloadUrl: uploadResult.driveDownloadUrl,
        fileName: uploadResult.fileName,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
        uploadedBy: adminId,
      },
    })
    console.log(`   ✅ Imported: ${doc.title}`)
    return "imported"
  } catch (err) {
    console.error(`   ❌ Failed: ${doc.title}`)
    console.error(`      ${err instanceof Error ? err.message : String(err)}`)
    return "failed"
  }
}

async function main() {
  console.log("═".repeat(60))
  console.log("IMPORT VĂN BẢN PHÁP QUY từ hoitramhuongvietnam.org")
  console.log("═".repeat(60))

  // Find admin user
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    throw new Error("Không tìm thấy admin user. Chạy 'npx prisma db seed' trước.")
  }
  console.log(`Admin uploadedBy: ${admin.email}`)
  console.log(`Total documents: ${SOURCE_DOCS.length}\n`)

  let imported = 0
  let skipped = 0
  let failed = 0

  for (const doc of SOURCE_DOCS) {
    console.log(`\n📄 [${doc.category}] ${doc.title}`)
    const result = await importOne(doc, admin.id)
    if (result === "imported") imported++
    else if (result === "skipped") skipped++
    else failed++
  }

  console.log("\n" + "═".repeat(60))
  console.log("KẾT QUẢ")
  console.log("═".repeat(60))
  console.log(`✅ Imported: ${imported}`)
  console.log(`⏭️  Skipped:  ${skipped}`)
  console.log(`❌ Failed:   ${failed}`)
  console.log("")
  console.log("⚠️  Chú ý: Giấy phép Đại hội chưa có direct URL — admin cần upload thủ công")
  console.log("   qua /admin/phap-ly sau khi script chạy xong.")
  console.log("═".repeat(60))
}

main()
  .catch((err) => {
    console.error("FATAL:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
