import Link from "next/link"
import Image from "next/image"
import { getLatestResearchNews, type HomepageNewsItem } from "@/lib/homepage"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"

const BCP47: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-GB",
  zh: "zh-CN",
  ar: "ar",
}

function formatDate(d: Date | null | string, locale: Locale): string {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString(BCP47[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export async function LatestResearchSection() {
  const [items, t, locale] = await Promise.all([
    getLatestResearchNews(3),
    getTranslations("homepage"),
    getLocale() as Promise<Locale>,
  ])

  return (
    <section className="bg-white/85 backdrop-blur-[2px] py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("researchTitle")}
            </h2>
            <p className="text-sm text-brand-500 mt-1">
              {t("researchSubtitle")}
            </p>
          </div>
          <Link
            href="/nghien-cuu"
            className="hidden sm:inline-block text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-4"
          >
            {t("viewAll")}
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
            {t("researchEmpty")}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ResearchCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ResearchCard({
  item,
  locale,
}: {
  item: HomepageNewsItem
  locale: Locale
}) {
  const title = localize(item, "title", locale) as string
  const excerpt = localize(item, "excerpt", locale) as string | null

  return (
    <Link
      href={`/nghien-cuu/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm hover:shadow-md transition-all"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-100">
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="lg" shape="square" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-brand-900 group-hover:text-brand-700 line-clamp-2 leading-snug">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2 text-sm text-brand-600 line-clamp-3 leading-relaxed">
            {excerpt}
          </p>
        )}
        <time className="mt-auto pt-3 text-xs text-brand-500">
          {formatDate(item.publishedAt, locale)}
        </time>
      </div>
    </Link>
  )
}
