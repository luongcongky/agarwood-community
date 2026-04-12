import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST /api/upload/delete
 * Delete an image from Cloudinary by URL.
 * Only allows deleting images in the agarwood/ folder.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role === "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { url } = await request.json()
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 })
  }

  // Extract public_id from Cloudinary URL
  // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{filename}.{ext}
  try {
    // Support both old pattern (agarwood/...) and new pattern (tin-tuc/04-2026/...)
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
    if (!match) {
      return NextResponse.json({ error: "Invalid Cloudinary URL" }, { status: 400 })
    }

    const publicId = match[1]
    await cloudinary.uploader.destroy(publicId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Cloudinary delete error:", err)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
