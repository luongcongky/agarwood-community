import Link from "next/link"
import { cn } from "@/lib/utils"
import { getTranslations } from "next-intl/server"
import { ContactForm } from "./ContactForm"
import { OfficialChannelsBlock } from "@/components/features/layout/OfficialChannelsBlock"

export const revalidate = 600

export async function generateMetadata() {
  const t = await getTranslations("contact")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: "/lien-he" },
  }
}

export default async function LienHePage() {
  const t = await getTranslations("contact")
  const tc = await getTranslations("common")

  return (
    <div className="min-h-screen bg-brand-50/60">
      {/* ── Hero ── */}
      <section className="bg-brand-800 text-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="mb-4 text-sm text-brand-300" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">{tc("home")}</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{t("breadcrumbContact")}</span>
          </nav>
          <h1 className="text-3xl font-bold sm:text-4xl">{t("heroTitle")}</h1>
          <p className="mt-3 text-brand-200 max-w-xl">
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* ── Content card ── */}
      <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">

      {/* ── Contact Info + Form ── */}
      <section className="py-16 px-6 sm:px-10">
        <div>
          <div className="grid gap-12 md:grid-cols-2 md:items-start">
            {/* Left: Contact info */}
            <div>
              <h2 className="text-xl font-bold text-brand-900 mb-6">
                {t("contactInfo")}
              </h2>

              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-xl">📞</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">
                      {t("phone")}
                    </p>
                    <a href="tel:+84913810060" className="block text-brand-800 font-medium hover:text-brand-600 hover:underline">
                      0913 810 060
                    </a>
                    <p className="text-xs text-brand-500">Ông Phạm Văn Du — Chủ tịch Hội</p>
                    <a href="tel:+84938334647" className="mt-1 block text-brand-800 font-medium hover:text-brand-600 hover:underline">
                      0938 334 647
                    </a>
                    <p className="text-xs text-brand-500">Ông Nguyễn Văn Hùng — Phó Chủ tịch Hội</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-xl">📧</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">{t("email")}</p>
                    <a href="mailto:hoitramhuongvietnam2010@gmail.com" className="text-brand-800 font-medium hover:text-brand-600 hover:underline break-all">
                      hoitramhuongvietnam2010@gmail.com
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-xl">📍</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">{t("address")}</p>
                    <p className="text-brand-800 font-medium">
                      Số 150, Đường Lý Chính Thắng,<br />
                      Phường Xuân Hòa, TP. Hồ Chí Minh
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-xl">🌐</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">{t("website")}</p>
                    <a href="https://hoitramhuong.vn" target="_blank" rel="noopener noreferrer" className="text-brand-800 font-medium hover:text-brand-600 hover:underline">
                      hoitramhuong.vn
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-xl">🕐</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">{t("workingHours")}</p>
                    <p className="text-brand-800 font-medium">{t("workingHoursValue")}</p>
                  </div>
                </li>
              </ul>

              {/* Social links */}
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-3">
                  {t("socialMedia")}
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://www.facebook.com/hoitramhuongvietnam.org"
                    target="_blank" rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white",
                      "px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors",
                    )}
                  >
                    Facebook
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Quick form */}
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-8">
              <h2 className="text-xl font-bold text-brand-900 mb-6">{t("quickMessage")}</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Kênh chính thức + cảnh báo giả mạo ── */}
      <section className="py-12 lg:py-16 border-t border-brand-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <OfficialChannelsBlock variant="full" />
        </div>
      </section>

      {/* ── Map ── */}
      <section className="pb-16 px-6 sm:px-10">
        <div>
          <div className="overflow-hidden rounded-xl border border-brand-200 shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125411.87690118406!2d106.62966155!3d10.7544272!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4670702e31%3A0xa25c43e2beaadca4!2zVFAuIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2svn!4v1700000000000"
              width="100%" height="400" style={{ border: 0 }} loading="lazy" allow=""
              title={t("mapTitle")}
            />
          </div>
        </div>
      </section>

      </div>
      </div>
    </div>
  )
}
