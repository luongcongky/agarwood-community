import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"

/**
 * Khối "Kênh truyền thông chính thức + Cảnh báo giả mạo".
 *
 * Dùng ở /privacy, /terms, /gioi-thieu, /lien-he. Đọc từ SiteConfig
 * (facebook_url, zalo_url, youtube_url, association_website,
 * association_email, association_phone) để admin tự cập nhật.
 */

const KEYS = [
  "facebook_url",
  "zalo_url",
  "youtube_url",
  "tiktok_url",
  "association_website",
  "association_email",
  "association_phone",
] as const

export async function OfficialChannelsBlock({
  variant = "full",
  showChannels = true,
}: {
  /** "full" — hiển thị mục cảnh báo dài (cho privacy/terms);
   *  "compact" — gọn hơn (cho gioi-thieu/lien-he) */
  variant?: "full" | "compact"
  /** Ẩn grid badge Facebook/Zalo/YouTube/Website/Email/Hotline.
   *  Dùng trên /lien-he vì thông tin liên hệ đã ở cột trái riêng. */
  showChannels?: boolean
}) {
  // Bỏ qua siteConfig query khi showChannels=false — tiết kiệm 1 DB hit.
  const [rows, t] = await Promise.all([
    showChannels
      ? prisma.siteConfig.findMany({ where: { key: { in: [...KEYS] } } })
      : Promise.resolve([] as Array<{ key: string; value: string }>),
    getTranslations("officialChannels"),
  ])
  const cfg = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<
    Record<(typeof KEYS)[number], string>
  >

  const channels: { label: string; value: string; href: string; icon: string }[] = []
  if (cfg.facebook_url)
    channels.push({ label: t("labelFacebook"), value: cfg.facebook_url, href: cfg.facebook_url, icon: "📘" })
  if (cfg.zalo_url)
    channels.push({ label: t("labelZalo"), value: cfg.zalo_url, href: cfg.zalo_url, icon: "💬" })
  if (cfg.youtube_url)
    channels.push({ label: t("labelYoutube"), value: cfg.youtube_url, href: cfg.youtube_url, icon: "▶️" })
  if (cfg.tiktok_url)
    channels.push({ label: t("labelTiktok"), value: cfg.tiktok_url, href: cfg.tiktok_url, icon: "🎵" })
  if (cfg.association_website)
    channels.push({
      label: t("labelWebsite"),
      value: cfg.association_website.replace(/^https?:\/\//, ""),
      href: cfg.association_website,
      icon: "🌐",
    })
  if (cfg.association_email)
    channels.push({
      label: t("labelEmail"),
      value: cfg.association_email,
      href: `mailto:${cfg.association_email}`,
      icon: "📧",
    })
  if (cfg.association_phone)
    channels.push({
      label: t("labelHotline"),
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
            {t("title")}
          </h2>
          <p className="text-sm text-amber-800 mt-1">{t("intro")}</p>
        </div>
      </header>

      {showChannels && channels.length > 0 && (
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
            <p className="font-semibold">{t("notResponsibleTitle")}</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              <li>{t("notResponsibleItem1")}</li>
              <li>{t("notResponsibleItem2")}</li>
              <li>{t("notResponsibleItem3")}</li>
            </ul>
          </div>
          <div className="rounded-lg bg-white border border-amber-200 p-4 space-y-2">
            <p className="font-semibold">{t("reportTitle")}</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-800">
              <li>{t("reportStep1")}</li>
              <li>{t("reportStep2")}</li>
              <li>{t("reportStep3")}</li>
            </ol>
          </div>
        </div>
      )}
    </section>
  )
}
