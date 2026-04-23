import Link from "next/link"
import type { ReactNode } from "react"

/**
 * Header format chuẩn VTV-style cho các section trên trang chủ:
 *  - Đường kẻ ngang mờ neutral-200 ở trên (phân cách với section trước)
 *  - Title in đậm chữ hoa ~20px
 *  - Thanh nâu ngắn 3px ngay dưới title (chỉ bằng độ rộng chữ)
 *  - Tabs/nav liên quan nằm baseline cùng hàng với title, cỡ nhỏ hơn
 *  - Content (children) render bên dưới header
 */
export function Section({
  title,
  titleHref,
  rightNav,
  ariaLabel,
  children,
}: {
  /** Title chữ hoa, hiển thị góc trên-trái. */
  title: string
  /** Nếu có, title thành <Link> dẫn về trang listing. */
  titleHref?: string
  /** Các tab / link nằm baseline cùng hàng bên phải title (optional). */
  rightNav?: ReactNode
  /** Aria label cho section wrapper. Mặc định = title. */
  ariaLabel?: string
  children: ReactNode
}) {
  const titleEl = (
    <h2 className="inline-block border-b border-brand-700 pb-1 text-[20px] font-bold uppercase leading-tight tracking-wide text-neutral-900">
      {title}
    </h2>
  )

  return (
    <section
      aria-label={ariaLabel ?? title}
      className="border-t border-neutral-200 pt-6"
    >
      <div className="mb-5 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        {titleHref ? (
          <Link
            href={titleHref}
            className="inline-block transition-colors hover:text-brand-700"
          >
            {titleEl}
          </Link>
        ) : (
          titleEl
        )}
        {rightNav && (
          <nav
            aria-label={`${title} — điều hướng`}
            className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[14px] text-neutral-700"
          >
            {rightNav}
          </nav>
        )}
      </div>
      {children}
    </section>
  )
}
