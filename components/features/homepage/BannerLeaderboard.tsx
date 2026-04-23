import { cloudinaryFit } from "@/lib/cloudinary"

type BannerItem = {
  id: string
  title: string
  imageUrl: string
  targetUrl: string
}

/**
 * VTV-style leaderboard banner (TOP position).
 *
 * Container max-width 970px (VTV's `.demo-bg .box-demo-bg` width), total
 * aspect ratio 970:90. Up to 2 banners side-by-side inside — flex-row with
 * gap-3, each child takes 1/2 width and full height. If only 1 banner,
 * it spans the full row. Server component, no rotation.
 */
export function BannerLeaderboard({ banners }: { banners: BannerItem[] }) {
  const displayed = banners.slice(0, 2)
  if (displayed.length === 0) return null

  return (
    <div className="mx-auto flex aspect-970/90 max-w-[970px] gap-3">
      {displayed.map((banner, idx) => {
        const wrapperClass = "relative flex-1 overflow-hidden bg-neutral-100"
        const media = (
          <picture>
            <source
              media="(min-width: 640px)"
              srcSet={cloudinaryFit(banner.imageUrl, { ar: "485:90", w: 970 })}
            />
            <img
              src={cloudinaryFit(banner.imageUrl, { ar: "485:90", w: 640 })}
              alt={banner.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "auto"}
            />
          </picture>
        )
        return banner.targetUrl ? (
          <a
            key={banner.id}
            href={banner.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={wrapperClass}
          >
            {media}
          </a>
        ) : (
          <div key={banner.id} className={wrapperClass}>
            {media}
          </div>
        )
      })}
    </div>
  )
}
