import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"
import mammoth from "mammoth"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST /api/upload/docx
 *
 * Parses a DOCX file into HTML with images uploaded to Cloudinary.
 * Returns { html, title, imageCount } ready to insert into TipTap editor.
 *
 * Flow:
 * 1. Receive DOCX file
 * 2. mammoth extracts HTML + embedded images
 * 3. Each image → upload to Cloudinary (webp, auto quality, max 1600px)
 * 4. Replace base64 image srcs with Cloudinary URLs
 * 5. Return clean HTML
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role === "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Vui lòng chọn file" }, { status: 400 })
  }

  // Validate DOCX
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ]
  if (!validTypes.includes(file.type) && !file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
    return NextResponse.json({ error: "Chỉ chấp nhận file DOC/DOCX" }, { status: 400 })
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File tối đa 20MB" }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    let imageCount = 0

    // Convert DOCX to HTML, uploading images to Cloudinary along the way
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imageBuffer = await image.read()
            const contentType = image.contentType || "image/png"
            const base64 = `data:${contentType};base64,${imageBuffer.toString("base64")}`

            const uploaded = await cloudinary.uploader.upload(base64, {
              folder: "agarwood/posts",
              resource_type: "image",
              format: "webp",
              quality: "auto",
              transformation: [{ width: 1600, crop: "limit" }],
            })

            imageCount++
            return { src: uploaded.secure_url }
          } catch (err) {
            console.error("Image upload failed:", err)
            // Return empty src if upload fails — don't break the whole parse
            return { src: "" }
          }
        }),
      },
    )

    // Extract title from first <h1> or <h2> or first <p> with <strong>
    let title = ""
    const h1Match = result.value.match(/<h1[^>]*>(.*?)<\/h1>/i)
    const h2Match = result.value.match(/<h2[^>]*>(.*?)<\/h2>/i)
    const strongMatch = result.value.match(/<p><strong>(.*?)<\/strong><\/p>/i)
    if (h1Match) title = h1Match[1].replace(/<[^>]*>/g, "").trim()
    else if (h2Match) title = h2Match[1].replace(/<[^>]*>/g, "").trim()
    else if (strongMatch) title = strongMatch[1].replace(/<[^>]*>/g, "").trim()

    // Clean up HTML — remove empty paragraphs, normalize tags
    let html = result.value
      .replace(/<p>\s*<\/p>/g, "") // remove empty paragraphs
      .replace(/\n{3,}/g, "\n\n") // collapse multiple newlines

    return NextResponse.json({
      html,
      title,
      imageCount,
      warnings: result.messages
        .filter((m) => m.type === "warning")
        .map((m) => m.message),
    })
  } catch (err) {
    console.error("DOCX parse error:", err)
    return NextResponse.json(
      { error: "Không thể đọc file DOCX. Vui lòng kiểm tra file và thử lại." },
      { status: 500 },
    )
  }
}
