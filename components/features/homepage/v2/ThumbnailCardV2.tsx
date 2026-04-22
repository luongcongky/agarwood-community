import Link from "next/link"
import Image from "next/image"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"

export function ThumbnailCardV2({
  href,
  coverUrl,
  title,
  meta,
  badge,
  sizes = "(max-width: 640px) 50vw, 25vw",
}: {
  href: string
  coverUrl: string | null
  title: string
  meta?: string
  badge?: string
  sizes?: string
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-16/10 w-full overflow-hidden bg-brand-100">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes={sizes}
            className="object-cover"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="lg" shape="square" />
        )}
        {badge && (
          <span className="absolute left-0 top-2 bg-brand-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
        {title}
      </h3>
      {meta && (
        <p className="mt-1 text-[11px] uppercase tracking-wide text-brand-500">{meta}</p>
      )}
    </Link>
  )
}
