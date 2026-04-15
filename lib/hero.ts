import { unstable_cache, revalidateTag } from "next/cache"
import { prisma } from "./prisma"

export type HeroImage = {
  id: string
  imageUrl: string
  label: string | null
}

const TAG = "hero-images"

/** Clear cache — gọi sau khi admin thay đổi gallery. */
export function clearHeroCache() {
  revalidateTag(TAG)
}

/** YYYY-MM-DD theo múi giờ VN — deterministic daily key. */
function vnDateKey(d: Date = new Date()): string {
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return vn.toISOString().slice(0, 10)
}

/** FNV-1a hash — deterministic cross-platform. */
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const getActiveImages = unstable_cache(
  async (): Promise<HeroImage[]> => {
    return prisma.heroImage.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, imageUrl: true, label: true },
    })
  },
  ["hero-active-images"],
  { tags: [TAG], revalidate: 300 },
)

/**
 * Chọn 1 hero image cho ngày hôm nay (deterministic).
 * Trả null khi chưa có ảnh nào active → caller fallback về bg mặc định.
 */
export async function getDailyHeroImage(): Promise<HeroImage | null> {
  const images = await getActiveImages()
  if (images.length === 0) return null
  const idx = hashStr(vnDateKey()) % images.length
  return images[idx]
}
