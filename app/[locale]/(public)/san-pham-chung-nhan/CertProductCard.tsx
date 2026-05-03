import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { cloudinaryResize } from "@/lib/cloudinary"
import { BLUR_DATA_URL } from "@/lib/seo/blur-placeholder"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { ProductFeatureToggleBtn } from "./ProductFeatureToggleBtn"
import { CertifiedSeal } from "@/components/ui/CertifiedSeal"

/**
 * Card sản phẩm chứng nhận — portrait orientation 4/5 + cert seal stamp
 * tròn ở góc. Server component pure render, page server đã localize trước
 * và pass qua props string.
 */
export type CertProductCardData = {
  id: string
  slug: string
  name: string
  companyName: string
  category: string
  imageFirst: string | null
  /** ISO string */
  certApprovedAt: string | null
  /** Pin status — dùng cho admin quick-toggle. */
  isFeatured: boolean
}

export function CertProductCard({
  card,
  index,
  isAdmin,
}: {
  card: CertProductCardData
  /** Index trong list — dùng cho stagger delay (--i CSS var). */
  index: number
  /** Admin-only quick toggle "SP tiêu biểu" — render ở góc trên-trái. */
  isAdmin?: boolean
}) {
  // Featured cards có "tủ kính prestige" treatment riêng: gold ring +
  // warm shadow + cream-amber gradient bg → user lướt qua thấy ngay sự
  // khác biệt với SP thường, kích thích tò mò "tại sao SP này khác?".
  const featured = card.isFeatured

  return (
    <Link
      href={`/san-pham/${card.slug}`}
      className={cn(
        "cp-card-stagger group flex flex-col overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-1",
        featured
          ? "cp-halo border-2 border-amber-400/70 bg-linear-to-b from-amber-50/60 to-white shadow-[0_8px_28px_rgb(180,120,30,0.18)] hover:border-amber-500 hover:shadow-[0_12px_36px_rgb(180,120,30,0.28)]"
          : "border border-stone-200 bg-white hover:border-emerald-400 hover:shadow-lg",
      )}
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="relative aspect-4/5 overflow-hidden bg-stone-100">
        {card.imageFirst ? (
          // Wrap Image trong div riêng cho Ken Burns animation. Featured
          // cards có cinematic slow zoom 12s alternate; normal cards giữ
          // wrap đơn giản với hover scale.
          featured ? (
            <div className="cp-kb-slow absolute inset-0">
              <Image
                src={cloudinaryResize(card.imageFirst, 360)}
                alt={card.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </div>
          ) : (
            <Image
              src={cloudinaryResize(card.imageFirst, 360)}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          )
        ) : (
          <AgarwoodPlaceholder
            className="h-full w-full"
            size="md"
            shape="square"
            tone="light"
          />
        )}
        {/* Cert seal stamp — emerald wax-seal style ở góc phải-trên */}
        <div className="absolute right-2 top-2 z-20">
          <CertifiedSeal size={48} delay={400} />
        </div>

        {/* Admin-only ★ tiêu biểu toggle — góc trái-trên (không đè cert seal) */}
        {isAdmin && (
          <div className="absolute left-2 top-2">
            <ProductFeatureToggleBtn
              productId={card.id}
              initialFeatured={card.isFeatured}
            />
          </div>
        )}

        {/* Featured ribbon to + có shimmer animation. Chỉ hiện cho user
            thường (admin xem thấy toggle thay vì ribbon). */}
        {featured && !isAdmin && (
          <span className="cp-ribbon-gold absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-linear-to-br from-amber-400 to-amber-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-900 shadow-lg ring-2 ring-white">
            <span className="text-xs leading-none">★</span>
            <span>Tiêu biểu</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {/* Premium tagline cho featured — text amber-700 mảnh, italic
            uppercase serif → cảm giác "danh hiệu của Hội" khác hẳn SP thường */}
        {featured && (
          <p className="font-serif-headline text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
            ★ Tiêu biểu của Hội
          </p>
        )}
        <h3
          className={cn(
            "font-serif-headline line-clamp-2 text-sm font-semibold leading-snug transition-colors",
            featured
              ? "text-amber-900 group-hover:text-amber-700"
              : "text-brand-900 group-hover:text-emerald-700",
          )}
        >
          {card.name}
        </h3>
        <p className="line-clamp-1 text-[11px] text-stone-500">
          {card.companyName}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[10px] text-stone-400">
          {card.category && (
            <span className="line-clamp-1">{card.category}</span>
          )}
          {card.certApprovedAt && (
            <span className="shrink-0 tabular-nums">
              {new Date(card.certApprovedAt).toLocaleDateString("vi-VN", {
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
