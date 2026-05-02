import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { FeatureToggleBtn } from "./FeatureToggleBtn"

/**
 * Pre-localized data shape — server đã chọn ngôn ngữ qua `localize()` trước
 * khi pass xuống. Component này không cần biết về i18n nữa, chỉ render.
 * Nhờ vậy có thể dùng được cả ở server (page.tsx) lẫn client component
 * (DirectorySearch.tsx) mà không phải drag theo locale callback.
 */
export type CompanyCardData = {
  id: string
  slug: string
  /** Tên đã localized */
  name: string
  /** Địa chỉ đã localized — empty string nếu không có */
  address: string
  logoUrl: string | null
  coverImageUrl: string | null
  foundedYear: number | null
  phone: string | null
  website: string | null
  isVerified: boolean
  isFeatured: boolean
  productsCount: number
}

function lastAddressSegment(addr: string): string {
  return addr.split(",").pop()?.trim() ?? addr
}

function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export function DirectoryCard({
  card,
  isAdmin,
  visitWebsiteLabel,
  index,
  hidden,
}: {
  card: CompanyCardData
  isAdmin: boolean
  visitWebsiteLabel: string
  /** Index trong list — dùng cho stagger delay (không đổi khi filter để tránh re-animate). */
  index: number
  /** Khi search filter ẩn card — dùng `hidden` class thay vì unmount để
   *  preserve animation state (card đã animate xong không re-run). */
  hidden?: boolean
}) {
  const detailUrl = `/doanh-nghiep/${card.slug}`

  return (
    // Card không phải <a> wrapper duy nhất — footer chứa <a website> +
    // <button toggle> sẽ vi phạm HTML5 (<a> không nest <a>/<button>).
    // Cover + header có Link riêng tới detail; footer là layer độc lập.
    <div
      className={cn(
        "dn-card-stagger group flex flex-col overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-400 hover:shadow-xl",
        hidden && "hidden",
      )}
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* Cover (clickable) */}
      <Link
        href={detailUrl}
        aria-label={card.name}
        className="relative block aspect-16/7 w-full overflow-hidden bg-brand-100"
      >
        {card.coverImageUrl ? (
          <Image
            src={card.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-brand-100 via-amber-50/40 to-brand-200/60" />
        )}
        {card.isFeatured && (
          <span
            className="dn-pop absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-brand-900 shadow ring-1 ring-white"
            style={{ "--d": "200ms" } as React.CSSProperties}
          >
            ★ Tiêu biểu
          </span>
        )}
      </Link>

      {/* Header (logo + name) clickable */}
      <Link href={detailUrl} className="flex items-start gap-3 px-4 pt-3">
        <div className="relative -mt-9 h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white">
          {card.logoUrl ? (
            <Image src={card.logoUrl} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <AgarwoodPlaceholder
              className="h-full w-full"
              shape="full"
              size="sm"
              tone="light"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-brand-900 transition-colors group-hover:text-brand-700">
            {card.name}
          </h3>
          {card.isVerified && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
              ✓ Đã xác minh
            </span>
          )}
        </div>
      </Link>

      {/* Body — chỉ hiện số điện thoại liên hệ. */}
      <div className="flex flex-1 flex-col gap-2 px-4 pt-2">
        {card.phone && (
          <a
            href={`tel:${card.phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 transition-colors hover:text-brand-900"
          >
            <span aria-hidden>📞</span>
            <span className="tabular-nums">{card.phone}</span>
          </a>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {card.productsCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              ✓ {card.productsCount} chứng nhận
            </span>
          )}
          {card.foundedYear && (
            <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              Từ {card.foundedYear}
            </span>
          )}
          {card.address && (
            <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-2 py-0.5 text-[10px] font-medium text-brand-600">
              📍 {lastAddressSegment(card.address)}
            </span>
          )}
        </div>
      </div>

      {/* Footer — actions: detail + website + admin toggle. Tách khỏi Link
          wrapper để các phần tử anchor/button hợp lệ HTML5. */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-brand-100 px-4 py-2.5">
        <Link
          href={detailUrl}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700/80 transition-colors hover:text-brand-900 group-hover:text-brand-900"
        >
          <span>Xem chi tiết</span>
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {card.website && (
            <a
              href={card.website}
              target="_blank"
              rel="noopener noreferrer"
              title={displayWebsite(card.website)}
              className="inline-flex items-center gap-1 rounded-md border border-brand-300 bg-white px-2 py-1 text-[10px] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              {visitWebsiteLabel}
            </a>
          )}
          {isAdmin && (
            <FeatureToggleBtn
              companyId={card.id}
              initialFeatured={card.isFeatured}
            />
          )}
        </div>
      </div>
    </div>
  )
}
