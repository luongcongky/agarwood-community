import Link from "next/link"
import { prisma } from "@/lib/prisma"

/**
 * Khối "Kênh truyền thông chính thức + Cảnh báo giả mạo".
 *
 * Dùng ở /privacy, /terms, /gioi-thieu, /lien-he. Đọc từ SiteConfig
 * (facebook_url, zalo_url, youtube_url, association_website,
 * association_email, association_phone) để admin tự cập nhật.
 *
 * Căn cứ pháp lý: QĐ 23/QĐ-BNV (11/2010) của Bộ Nội Vụ — Hội Trầm Hương
 * Việt Nam là tổ chức xã hội nghề nghiệp được Nhà nước công nhận, có tư
 * cách pháp nhân để ra thông báo chính thức về kênh truyền thông.
 */

const KEYS = [
  "facebook_url",
  "zalo_url",
  "youtube_url",
  "association_website",
  "association_email",
  "association_phone",
] as const

export async function OfficialChannelsBlock({
  variant = "full",
}: {
  /** "full" — hiển thị mục cảnh báo dài (cho privacy/terms);
   *  "compact" — gọn hơn (cho gioi-thieu/lien-he) */
  variant?: "full" | "compact"
}) {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: [...KEYS] } },
  })
  const cfg = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<
    Record<(typeof KEYS)[number], string>
  >

  const channels: { label: string; value: string; href: string; icon: string }[] = []
  if (cfg.facebook_url)
    channels.push({ label: "Facebook chính thức", value: cfg.facebook_url, href: cfg.facebook_url, icon: "📘" })
  if (cfg.zalo_url)
    channels.push({ label: "Zalo chính thức", value: cfg.zalo_url, href: cfg.zalo_url, icon: "💬" })
  if (cfg.youtube_url)
    channels.push({ label: "YouTube chính thức", value: cfg.youtube_url, href: cfg.youtube_url, icon: "▶️" })
  if (cfg.association_website)
    channels.push({
      label: "Website chính thức",
      value: cfg.association_website.replace(/^https?:\/\//, ""),
      href: cfg.association_website,
      icon: "🌐",
    })
  if (cfg.association_email)
    channels.push({
      label: "Email chính thức",
      value: cfg.association_email,
      href: `mailto:${cfg.association_email}`,
      icon: "📧",
    })
  if (cfg.association_phone)
    channels.push({
      label: "Hotline chính thức",
      value: cfg.association_phone,
      href: `tel:${cfg.association_phone.replace(/\s+/g, "")}`,
      icon: "📞",
    })

  return (
    <section
      aria-labelledby="official-channels-title"
      className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 sm:p-8 space-y-5"
    >
      <header className="flex items-start gap-3">
        <span className="text-3xl shrink-0" aria-hidden>⚠️</span>
        <div>
          <h2
            id="official-channels-title"
            className="text-lg sm:text-xl font-bold text-amber-900"
          >
            Kênh truyền thông chính thức &amp; Cảnh báo giả mạo
          </h2>
          <p className="text-sm text-amber-800 mt-1">
            Hội Trầm Hương Việt Nam (VAWA) — thành lập theo Quyết định{" "}
            <strong>số 23/QĐ-BNV ngày 11/01/2010</strong> của Bộ Nội Vụ —
            chỉ truyền thông qua những kênh dưới đây. Mọi trang Facebook, Zalo,
            website hoặc tài khoản khác mạo danh đều <strong>không thuộc</strong> Hội.
          </p>
        </div>
      </header>

      {channels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {channels.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 rounded-lg bg-white border border-amber-200 px-4 py-3 hover:border-amber-400 transition-colors"
            >
              <span className="text-xl shrink-0" aria-hidden>{c.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-900">{c.label}</p>
                <p className="text-sm text-brand-700 truncate">{c.value}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {variant === "full" && (
        <div className="space-y-3 text-sm text-amber-900">
          <div className="rounded-lg bg-white border border-amber-200 p-4 space-y-2">
            <p className="font-semibold">Hội KHÔNG chịu trách nhiệm về:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              <li>Bất kỳ trang Facebook, Fanpage, group, Zalo OA, Zalo group, website,
                  TikTok, YouTube nào không nằm trong danh sách kênh chính thức ở trên.</li>
              <li>Mọi giao dịch, thanh toán, quyên góp, phí hội viên… được thực hiện
                  qua các tài khoản, trang giả mạo Hội.</li>
              <li>Nội dung, sản phẩm, dịch vụ do bên thứ ba phát ngôn nhân danh Hội
                  mà chưa được Ban Chấp hành Hội phê duyệt bằng văn bản.</li>
            </ul>
          </div>
          <div className="rounded-lg bg-white border border-amber-200 p-4 space-y-2">
            <p className="font-semibold">Khi phát hiện trang/tài khoản giả mạo, vui lòng:</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-800">
              <li>Gửi đường dẫn (URL) của trang giả mạo về email chính thức của Hội
                  để Ban Truyền thông xử lý.</li>
              <li>Báo cáo (Report) trang đó trực tiếp với Facebook/Zalo/Google.</li>
              <li>Không thực hiện chuyển khoản, cung cấp thông tin cá nhân hoặc giao dịch
                  với các trang chưa được xác minh.</li>
            </ol>
          </div>
        </div>
      )}
    </section>
  )
}
