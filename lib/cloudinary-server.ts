import "server-only"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Batch destroy Cloudinary asset theo public_id.
 *
 * - Dùng ở news DELETE (hướng A — xoá cover + content ảnh ngay khi bài bị xoá)
 *   và news PATCH (diff cũ/mới, xoá asset không còn dùng).
 * - Sweep nền (scripts/sweep-cloudinary-orphans.ts, hướng B) xài cloudinary
 *   SDK trực tiếp vì chạy ngoài Next runtime.
 *
 * Pure URL helpers (extractPublicId, collectNewsCloudinaryIds) tách ở
 * `lib/cloudinary-url.ts` không có `server-only` → script CLI import được.
 */
export {
  extractPublicId,
  extractCloudinaryUrls,
  collectNewsCloudinaryIds,
} from "./cloudinary-url"

type DeleteResourcesResponse = {
  deleted?: Record<string, string>
  partial?: boolean
}

/**
 * Dùng `api.delete_resources` (tối đa 100 id/lần) để tiết kiệm API call so
 * với loop `uploader.destroy`. Lỗi từng chunk được log, không throw ra caller
 * — sweep nền dọn nốt nếu có orphan.
 */
export async function destroyCloudinaryByPublicIds(
  ids: Iterable<string>,
): Promise<{ deleted: number; failed: number }> {
  const arr = [...new Set(ids)]
  if (arr.length === 0) return { deleted: 0, failed: 0 }
  let deleted = 0
  let failed = 0
  const CHUNK = 100
  for (let i = 0; i < arr.length; i += CHUNK) {
    const chunk = arr.slice(i, i + CHUNK)
    try {
      const res = (await cloudinary.api.delete_resources(chunk)) as DeleteResourcesResponse
      for (const status of Object.values(res.deleted ?? {})) {
        if (status === "deleted" || status === "not_found") deleted++
        else failed++
      }
    } catch (e) {
      console.error("[cloudinary] delete_resources chunk failed:", chunk.length, "ids —", e)
      failed += chunk.length
    }
  }
  return { deleted, failed }
}
