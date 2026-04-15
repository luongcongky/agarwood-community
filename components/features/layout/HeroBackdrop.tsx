import { getDailyHeroImage } from "@/lib/hero"

/**
 * Background ảnh toàn trang (fixed) — hiển thị phía sau mọi section.
 * Mỗi section có background màu bán-trong-suốt riêng phủ lên, nên ảnh
 * xuất hiện như 1 lớp "ambient" xuyên suốt trang, kết nối các section.
 */
export async function HeroBackdrop() {
  const hero = await getDailyHeroImage()
  if (!hero) return null

  return (
    <>
      <link rel="preload" as="image" href={hero.imageUrl} fetchPriority="high" />
      <div
        aria-hidden
        data-testid="hero-backdrop"
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${hero.imageUrl})` }}
      />
    </>
  )
}
