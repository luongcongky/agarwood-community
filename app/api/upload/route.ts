import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role === "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images are allowed" }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

  // Folder structure: {menu}/{MM-YYYY}
  // menu from request (e.g. "bai-viet", "tin-tuc", "san-pham", "doanh-nghiep")
  const menu = (formData.get("folder") as string) || "bai-viet"
  const now = new Date()
  const monthFolder = `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`
  const folder = `${menu}/${monthFolder}`

  // Cap width tự động theo ngữ cảnh — giảm size đáng kể so với cap chung 1600px.
  // Client có thể override bằng formData "maxWidth" (số px, kẹp 200..4000).
  const FOLDER_MAX_WIDTH: Record<string, number> = {
    "bai-viet": 1200, // ảnh trong bài post — content thường max-width ~800px
    "tin-tuc": 1600, // thumbnail + hero tin tức
    "san-pham": 1600, // ảnh sản phẩm — modal zoom cần nét
    "doi-tac": 600, // logo đối tác — max render 200px
    "doanh-nghiep": 1600, // logo + cover chung; client có thể override
    banner: 2560, // banner quảng cáo full-width desktop
    gallery: 2560, // gallery hero trang chủ — full viewport width, cần nét trên 4K
    "thu-chi": 1600, // ảnh chứng từ sổ quỹ — cần đọc rõ chữ trên hóa đơn/UNC
  }
  const DEFAULT_MAX_WIDTH = 1600

  const clientMax = Number(formData.get("maxWidth"))
  const maxWidth =
    Number.isFinite(clientMax) && clientMax >= 200 && clientMax <= 4000
      ? Math.round(clientMax)
      : FOLDER_MAX_WIDTH[menu] ?? DEFAULT_MAX_WIDTH

  const result = await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: "image",
    format: "webp",
    quality: "auto",
    transformation: [
      { width: maxWidth, crop: "limit" },
      { fetch_format: "auto", quality: "auto" },
    ],
  })

  return NextResponse.json({ secure_url: result.secure_url, url: result.secure_url })
}
