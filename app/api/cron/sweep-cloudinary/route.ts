import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { prisma } from "@/lib/prisma"
import { collectNewsCloudinaryIds } from "@/lib/cloudinary-url"

/**
 * Cron monthly — dọn Cloudinary orphan (hướng B trong cleanup strategy).
 *
 * Phối hợp với inline cleanup trong `app/api/admin/news/[id]/route.ts`
 * (hướng A). Nếu inline destroy fail (lỗi mạng, deploy ngắt quãng), orphan
 * tích lũy — sweep này catch mỗi đầu tháng.
 *
 * Schedule: `0 3 1 * *` (Vercel Cron UTC, 03:00 ngày 1 hàng tháng = 10:00
 * Asia/Ho_Chi_Minh). Off-peak, không va với traffic thường.
 *
 * Auth: Vercel Cron gửi `Authorization: Bearer ${CRON_SECRET}`. Route trả
 * 401 nếu miss/sai; 500 nếu server chưa config secret.
 *
 * Safety:
 *  - Chỉ scan folder `tin-tuc/` (không chạm avatar/companies/banners/…).
 *  - Age filter 1h: asset mới < 1h được skip để tránh race với editor đang
 *    soạn bài (upload xong chưa nhấn Save).
 *  - Batch delete 100/call (giới hạn `api.delete_resources`).
 *  - Trả về JSON summary để Vercel Logs dễ grep.
 */

// Cloudinary API resources + delete có thể chậm nếu folder nhiều asset.
// Vercel Pro default 15s → kéo lên 5 phút để cover case 1000+ file.
export const maxDuration = 300

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const FOLDER = "tin-tuc"
const MIN_AGE_HOURS = 1

type CloudinaryResource = { public_id: string; created_at: string }

async function listAllAssets(folder: string): Promise<CloudinaryResource[]> {
  const assets: CloudinaryResource[] = []
  let cursor: string | undefined
  do {
    const res = (await cloudinary.api.resources({
      type: "upload",
      prefix: folder + "/",
      max_results: 500,
      ...(cursor ? { next_cursor: cursor } : {}),
    })) as {
      resources: Array<{ public_id: string; created_at: string }>
      next_cursor?: string
    }
    for (const r of res.resources ?? []) {
      assets.push({ public_id: r.public_id, created_at: r.created_at })
    }
    cursor = res.next_cursor
  } while (cursor)
  return assets
}

async function collectReferencedIds(): Promise<Set<string>> {
  const rows = await prisma.news.findMany({
    select: {
      coverImageUrl: true,
      content: true,
      content_en: true,
      content_zh: true,
      content_ar: true,
    },
  })
  const ids = new Set<string>()
  for (const row of rows) {
    for (const id of collectNewsCloudinaryIds(row)) ids.add(id)
  }
  return ids
}

export async function GET(request: Request) {
  // Auth: Vercel Cron gửi Bearer token
  const authHeader = request.headers.get("authorization")
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 },
    )
  }
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const [assets, referenced] = await Promise.all([
    listAllAssets(FOLDER),
    collectReferencedIds(),
  ])

  const cutoff = Date.now() - MIN_AGE_HOURS * 3600 * 1000
  const orphans: CloudinaryResource[] = []
  let skippedFresh = 0
  for (const a of assets) {
    if (referenced.has(a.public_id)) continue
    if (new Date(a.created_at).getTime() > cutoff) {
      skippedFresh++
      continue
    }
    orphans.push(a)
  }

  let deleted = 0
  let failed = 0
  const CHUNK = 100
  for (let i = 0; i < orphans.length; i += CHUNK) {
    const chunk = orphans.slice(i, i + CHUNK).map((o) => o.public_id)
    try {
      const res = (await cloudinary.api.delete_resources(chunk)) as {
        deleted?: Record<string, string>
      }
      for (const status of Object.values(res.deleted ?? {})) {
        if (status === "deleted" || status === "not_found") deleted++
        else failed++
      }
    } catch (e) {
      console.error(
        `[cron/sweep-cloudinary] chunk ${i} failed:`,
        e instanceof Error ? e.message : e,
      )
      failed += chunk.length
    }
  }

  const summary = {
    folder: FOLDER,
    totalAssets: assets.length,
    referenced: referenced.size,
    orphans: orphans.length,
    skippedFresh,
    deleted,
    failed,
    durationMs: Date.now() - startedAt,
  }
  console.log("[cron/sweep-cloudinary]", JSON.stringify(summary))
  return NextResponse.json(summary)
}
