import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { v2 as cloudinary } from "cloudinary"
import { revalidatePath } from "next/cache"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MAX_PER_COMPANY = 30
const MAX_FILE_MB = 5

type Ctx = { params: Promise<{ id: string }> }

/** POST — upload 1 ảnh vào gallery. Chỉ owner hoặc ADMIN được upload. */
export async function POST(request: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: companyId } = await params
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, slug: true, ownerId: true },
  })
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

  const isOwner = session.user.id === company.ownerId
  const isAdmin = session.user.role === "ADMIN"
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const currentCount = await prisma.companyGalleryImage.count({ where: { companyId } })
  if (currentCount >= MAX_PER_COMPANY) {
    return NextResponse.json(
      { error: `Đã đạt giới hạn ${MAX_PER_COMPANY} ảnh trong bộ sưu tập.` },
      { status: 400 },
    )
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Chỉ chấp nhận ảnh" }, { status: 400 })
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Ảnh quá lớn (tối đa ${MAX_FILE_MB}MB)` }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString("base64")}`
  const now = new Date()
  const monthFolder = `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`
  const folder = `doanh-nghiep/${monthFolder}`

  const uploaded = await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: "image",
    format: "webp",
    transformation: [
      { width: 1600, crop: "limit" },
      { fetch_format: "auto", quality: "auto" },
    ],
  })

  // Caption + sortOrder (cuối danh sách)
  const caption = (formData.get("caption") as string | null)?.trim() || null
  const last = await prisma.companyGalleryImage.findFirst({
    where: { companyId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  })
  const sortOrder = (last?.sortOrder ?? -1) + 1

  const image = await prisma.companyGalleryImage.create({
    data: { companyId, imageUrl: uploaded.secure_url, caption, sortOrder },
    select: { id: true, imageUrl: true, caption: true, sortOrder: true },
  })

  revalidatePath(`/doanh-nghiep/${company.slug}`)
  return NextResponse.json({ image })
}

/** GET — list ảnh gallery (public). Route SSR-fetch trong page.tsx dùng Prisma
 *  trực tiếp, nhưng endpoint này tiện cho client-side refresh sau upload. */
export async function GET(_request: Request, { params }: Ctx) {
  const { id: companyId } = await params
  const images = await prisma.companyGalleryImage.findMany({
    where: { companyId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, imageUrl: true, caption: true, sortOrder: true },
  })
  return NextResponse.json({ images })
}
