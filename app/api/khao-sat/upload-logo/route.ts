import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { checkRateLimit, getClientIp } from "@/lib/survey/rate-limit"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST /api/khao-sat/upload-logo — public, rate-limited
export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(`upload:${ip}`, 5, 60_000) // 5 uploads / phút / IP
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Quá nhiều yêu cầu, vui lòng chờ ${Math.ceil(rl.resetInMs / 1000)}s` },
      { status: 429 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Không có file" }, { status: 400 })
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Chỉ chấp nhận hình ảnh" }, { status: 400 })
  }
  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: "File quá lớn (tối đa 3MB)" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString("base64")}`

  const now = new Date()
  const monthFolder = `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`

  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: `khao-sat/${monthFolder}`,
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "limit" },
        { quality: "auto:good" },
      ],
    })
    return NextResponse.json({ url: result.secure_url })
  } catch (e) {
    console.error("Cloudinary upload failed:", e)
    return NextResponse.json({ error: "Upload thất bại" }, { status: 500 })
  }
}
