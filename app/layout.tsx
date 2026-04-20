import type { Metadata } from "next"
import { Be_Vietnam_Pro, Noto_Sans_SC, Noto_Sans_Arabic, Playfair_Display } from "next/font/google"
import Script from "next/script"
import { headers } from "next/headers"
import { ProgressBar } from "@/components/features/layout/ProgressBar"
import { isRtlLocale, isValidLocale } from "@/i18n/config"
import "./globals.css"

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  // 300 (Light) added for the thinner homepage treatment — headings
  // render at 500 there instead of 700 for a lighter editorial feel.
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
  display: "swap",
})

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-zh",
  display: "swap",
})

// Arabic webfont — Be Vietnam Pro doesn't cover Arabic glyphs. Noto Sans
// Arabic is the free, reliable default that Google Fonts recommends for
// Arabic UI. Exposed as `--font-ar` and applied via `html[lang="ar"]`
// rule in globals.css.
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ar",
  display: "swap",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoitramhuong.vn"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hội Trầm Hương Việt Nam — Cộng đồng Doanh nghiệp Trầm Hương",
    template: "%s | Hội Trầm Hương Việt Nam",
  },
  description: "Cộng đồng kết nối, chứng nhận và truyền thông sản phẩm trầm hương Việt Nam. Nơi quy tụ doanh nghiệp trầm hương uy tín trên toàn quốc.",
  keywords: ["trầm hương", "hội trầm hương", "trầm hương Việt Nam", "chứng nhận trầm hương", "tinh dầu trầm hương", "nhang trầm", "trầm hương Khánh Hòa", "trầm hương Quảng Nam"],
  authors: [{ name: "Hội Trầm Hương Việt Nam" }],
  creator: "Hội Trầm Hương Việt Nam",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Hội Trầm Hương Việt Nam",
    title: "Hội Trầm Hương Việt Nam",
    description: "Cộng đồng kết nối, chứng nhận và truyền thông sản phẩm trầm hương Việt Nam.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hội Trầm Hương Việt Nam",
    description: "Cộng đồng kết nối, chứng nhận và truyền thông sản phẩm trầm hương Việt Nam.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const h = await headers()
  const headerLocale = h.get("x-locale")
  const lang = headerLocale && isValidLocale(headerLocale) ? headerLocale : "vi"
  const dir = isRtlLocale(lang) ? "rtl" : "ltr"

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${beVietnamPro.variable} ${playfairDisplay.variable} ${notoSansSC.variable} ${notoSansArabic.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col antialiased refined-typography" suppressHydrationWarning>
        <ProgressBar />
        {children}

        {/* Google Analytics 4 */}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
            <Script id="ga4" strategy="lazyOnload">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
