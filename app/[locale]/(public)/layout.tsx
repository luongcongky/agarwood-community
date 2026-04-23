import { Suspense } from "react"
import { Inter, Merriweather } from "next/font/google"
import { SiteHeader } from "@/components/features/homepage/SiteHeader"
import { SiteFooter } from "@/components/features/homepage/SiteFooter"
import { BackToTop } from "@/components/features/layout/BackToTop"

function SiteFooterSkeleton() {
  return <footer aria-hidden className="min-h-[380px] bg-brand-900" />
}

// Inter: primary font cho phong cách thuần báo chí (Option VTV-style).
// Scoped trong public layout — member/admin layouts giữ Be Vietnam Pro.
const inter = Inter({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-inter",
  display: "swap",
})

// Merriweather: serif nhấn mạnh cho article headline (VTV-style).
// Không subset "vietnamese" vì Merriweather không hỗ trợ — fallback về latin
// coverage có đủ dấu Việt cơ bản qua combining diacritics.
// Chỉ tải weight 700 — duy nhất được dùng via `.font-serif-headline` (h1
// detail + h2 hero list đều là font-bold). Giảm ~40% font payload so với 3
// weights.
const merriweather = Merriweather({
  subsets: ["latin", "latin-ext"],
  weight: ["700"],
  variable: "--font-merriweather",
  display: "swap",
})

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      data-page="public"
      className={`${inter.variable} ${merriweather.variable} min-h-screen bg-white`}
    >
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Suspense fallback={<SiteFooterSkeleton />}>
        <SiteFooter />
      </Suspense>
      <BackToTop />
    </div>
  )
}
