import Link from "next/link"

const CATEGORIES: { label: string; href: string }[] = [
  { label: "Trang chủ", href: "/v2" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Nghiên cứu", href: "/nghien-cuu" },
  { label: "Hội viên", href: "/hoi-vien" },
  { label: "Doanh nghiệp", href: "/doanh-nghiep" },
  { label: "Sản phẩm", href: "/san-pham-chung-nhan" },
  { label: "Ban lãnh đạo", href: "/ban-lanh-dao" },
  { label: "Pháp lý", href: "/phap-ly" },
  { label: "Điều lệ", href: "/dieu-le" },
  { label: "Liên hệ", href: "/lien-he" },
]

export function CategoryBarV2() {
  return (
    <nav aria-label="Chuyên mục" className="bg-brand-700 text-white">
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <ul className="v2-category-scroll flex overflow-x-auto whitespace-nowrap">
          {CATEGORIES.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="inline-flex items-center px-3.5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/95 hover:bg-brand-800 transition-colors"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
