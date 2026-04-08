import type { Metadata } from "next"
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google"
import Script from "next/script"
import "./globals.css"

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${playfairDisplay.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col antialiased">
        {children}

        {/* Google Analytics 4 */}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
