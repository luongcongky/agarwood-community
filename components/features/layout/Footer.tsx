import Link from "next/link"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import { BackToTop } from "./BackToTop"

// Brand icons — inline SVG (lucide-react 1.7 đã remove các brand icon)
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 5 3.66 9.13 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.19 2.24.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 17 22 12c0-5.52-4.48-10-10-10z" />
  </svg>
)
const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.8 1-2 2.1C0 8.2 0 12 0 12s0 3.8.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1 2-2.1.5-2 .5-5.8.5-5.8s0-3.8-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
  </svg>
)
const ZaloIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M12 2C6.48 2 2 5.87 2 10.66c0 2.7 1.47 5.12 3.76 6.72l-.62 2.43a.5.5 0 00.74.55l2.8-1.57c1.03.28 2.14.44 3.32.44 5.52 0 10-3.87 10-8.57S17.52 2 12 2zM7.5 12.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.5 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.5 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
)

// Fetch Chủ tịch + Phó Chủ tịch + các SiteConfig social — cache 10 phút
const getFooterData = unstable_cache(
  async () => {
    const [leaders, configs] = await Promise.all([
      prisma.leader.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: "Chủ tịch", mode: "insensitive" } },
            { title: { contains: "Tổng Thư ký", mode: "insensitive" } },
            { title: { contains: "Chánh Văn Phòng", mode: "insensitive" } },
          ],
        },
        orderBy: [{ sortOrder: "asc" }],
        select: { id: true, name: true, title: true },
        take: 6,
      }),
      prisma.siteConfig.findMany({
        where: {
          key: {
            in: [
              "facebook_url",
              "zalo_url",
              "youtube_url",
              "association_email",
              "association_phone",
              "association_phone_2",
              "contact_address",
              "association_website",
              "footer_brand_desc",
              "footer_working_hours",
              "footer_legal_basis",
              "footer_copyright_notice",
              "footer_quick_links",
            ],
          },
        },
      }),
    ])
    const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]))
    return { leaders, cfg }
  },
  ["footer_data"],
  { revalidate: 600, tags: ["footer", "leaders"] },
)

export async function Footer() {
  const { leaders, cfg } = await getFooterData()

  // Tách Chủ tịch (unique) và Phó CT (nhiều)
  const chuTich = leaders.find((l) => /^Chủ tịch/i.test(l.title))
  const phoChuTich = leaders.filter((l) => /Phó Chủ tịch/i.test(l.title)).slice(0, 3)
  const tongThuKy = leaders.find((l) => /Tổng Thư ký/i.test(l.title))
  const chanhVanPhong = leaders.find((l) => /Chánh Văn Phòng/i.test(l.title))

  const brandDesc =
    cfg.footer_brand_desc ||
    "Kết nối cộng đồng doanh nghiệp trầm hương — chứng nhận sản phẩm, chia sẻ tri thức và phát triển thị trường bền vững."
  const workingHours = cfg.footer_working_hours || "Thứ 2 - Thứ 6: 8:00 - 17:00"
  const legalBasis =
    cfg.footer_legal_basis ||
    "Thành lập theo Quyết định số 23/QĐ-BNV ngày 11/01/2010 của Bộ Nội Vụ. Điều lệ Hội được phê duyệt qua Đại hội nhiệm kỳ."
  const copyrightNotice =
    cfg.footer_copyright_notice ||
    "⚠ Cấm sao chép dưới mọi hình thức nếu không có sự chấp thuận bằng văn bản của Hội Trầm Hương Việt Nam. Ghi rõ nguồn hoitramhuong.vn khi phát hành lại thông tin từ website này."
  const quickLinks: { label: string; href: string }[] = (cfg.footer_quick_links
    ? cfg.footer_quick_links.split("\n")
    : [
        "Trang chủ|/",
        "Doanh nghiệp|/doanh-nghiep",
        "Dịch vụ|/dich-vu",
        "Điều lệ Hội|/dieu-le",
        "Văn bản pháp quy|/phap-ly",
        "Liên hệ|/lien-he",
      ]
  )
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((s) => s.trim())
      return { label, href: href || "/" }
    })
    .filter((l) => l.label)

  return (
    <>
      <footer className="bg-brand-900 text-brand-200 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
            {/* ── Col 1 (span 2): Brand + Social ── */}
            <div className="space-y-4 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Hội Trầm Hương Việt Nam"
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0"
                />
                <div>
                  <h3 className="text-brand-100 font-semibold text-lg leading-tight">
                    Hội Trầm Hương Việt Nam
                  </h3>
                  <p className="text-xs text-brand-400 uppercase tracking-wider mt-0.5">
                    VAWA · Vietnam Agarwood Association
                  </p>
                </div>
              </div>
              <p className="text-sm text-brand-300 leading-relaxed whitespace-pre-line">
                {brandDesc}
              </p>

              {/* Social */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                  Theo dõi Hội trên
                </p>
                <div className="flex items-center gap-3">
                  {cfg.facebook_url && (
                    <a
                      href={cfg.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook chính thức"
                      className="inline-flex items-center justify-center text-brand-200 hover:text-brand-100 transition-colors"
                    >
                      <FacebookIcon className="w-7 h-7" />
                    </a>
                  )}
                  {cfg.zalo_url && (
                    <a
                      href={cfg.zalo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Zalo chính thức"
                      className="inline-flex items-center justify-center text-brand-200 hover:text-brand-100 transition-colors"
                    >
                      <ZaloIcon className="w-7 h-7" />
                    </a>
                  )}
                  {cfg.youtube_url && (
                    <a
                      href={cfg.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube chính thức"
                      className="inline-flex items-center justify-center text-brand-200 hover:text-brand-100 transition-colors"
                    >
                      <YoutubeIcon className="w-7 h-7" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ── Col 3 (span 1): Lãnh đạo Hội ── */}
            <div className="space-y-3 lg:col-span-1">
              <h4 className="text-brand-100 font-semibold text-sm uppercase tracking-wider">
                Lãnh đạo Hội
              </h4>
              <ul className="space-y-2 text-sm text-brand-300">
                {chuTich && (
                  <li>
                    <span className="block text-xs text-brand-400">Chủ tịch Hội</span>
                    <span className="text-brand-100 font-medium">{chuTich.name}</span>
                  </li>
                )}
                {phoChuTich.map((l) => (
                  <li key={l.id}>
                    <span className="block text-xs text-brand-400">Phó Chủ tịch</span>
                    <span className="text-brand-100 font-medium">{l.name}</span>
                  </li>
                ))}
                {tongThuKy && (
                  <li>
                    <span className="block text-xs text-brand-400">Tổng Thư ký</span>
                    <span className="text-brand-100 font-medium">{tongThuKy.name}</span>
                  </li>
                )}
                {chanhVanPhong && (
                  <li>
                    <span className="block text-xs text-brand-400">Chánh Văn Phòng</span>
                    <span className="text-brand-100 font-medium">{chanhVanPhong.name}</span>
                  </li>
                )}
                {leaders.length === 0 && (
                  <li className="text-brand-400 italic">Chưa cập nhật</li>
                )}
              </ul>
            </div>

            {/* ── Col 4-5 (span 2): Liên hệ (bỏ title) + Căn cứ pháp lý ── */}
            <div className="lg:col-span-2 space-y-4">
              <ul className="space-y-2 text-sm text-brand-300">
                {cfg.association_email && (
                  <li className="flex gap-2">
                    <span>📧</span>
                    <a
                      href={`mailto:${cfg.association_email}`}
                      className="hover:text-brand-100 transition-colors break-all"
                    >
                      {cfg.association_email}
                    </a>
                  </li>
                )}
                {(cfg.association_phone || cfg.association_phone_2) && (
                  <li className="flex gap-2">
                    <span>📞</span>
                    <span>
                      {cfg.association_phone}
                      {cfg.association_phone && cfg.association_phone_2 ? " · " : ""}
                      {cfg.association_phone_2}
                    </span>
                  </li>
                )}
                {cfg.contact_address && (
                  <li className="flex gap-2">
                    <span>📍</span>
                    <span>{cfg.contact_address}</span>
                  </li>
                )}
                {workingHours && (
                  <li className="flex gap-2">
                    <span>🕐</span>
                    <span>{workingHours}</span>
                  </li>
                )}
              </ul>

              {/* Căn cứ pháp lý — đặt ngay dưới thông tin liên hệ */}
              {legalBasis && (
                <div className="rounded-md border border-brand-700 bg-brand-800/60 p-3 text-xs text-brand-300 leading-relaxed">
                  <p className="text-brand-100 font-semibold mb-1">Căn cứ pháp lý</p>
                  <p className="whitespace-pre-line">{legalBasis}</p>
                </div>
              )}
            </div>

            {/* ── Col 3 (span 1): Liên kết nhanh ── */}
            <div className="space-y-3 lg:col-span-1">
              <h4 className="text-brand-100 font-semibold text-sm uppercase tracking-wider">
                Liên kết nhanh
              </h4>
              <ul className="space-y-1">
                {quickLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block py-1 text-sm text-brand-300 hover:text-brand-100 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="mt-8 mb-3 bg-brand-700" />

          {/* Copyright notice + legal links */}
          <div className="space-y-3">
            {copyrightNotice && (
              <p className="text-xs text-brand-400 leading-relaxed italic whitespace-pre-line">
                {copyrightNotice}
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-brand-400 pt-2 border-t border-brand-800">
              <span>
                © {new Date().getFullYear()} Hội Trầm Hương Việt Nam. Bảo lưu mọi quyền.
              </span>
              <div className="flex gap-4">
                <Link
                  href="/privacy"
                  className="hover:text-brand-200 transition-colors"
                >
                  Chính sách bảo mật
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-brand-200 transition-colors"
                >
                  Điều khoản sử dụng
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <BackToTop />
    </>
  )
}
