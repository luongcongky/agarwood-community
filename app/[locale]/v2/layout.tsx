import { Suspense } from "react"
import { Inter } from "next/font/google"
import { V2Header } from "@/components/features/homepage/v2/V2Header"
import { V2Footer } from "@/components/features/homepage/v2/V2Footer"

/** Skeleton match chiều cao + bg của V2Footer thật để tránh CLS khi
 *  footer còn đang fetch leadership query. */
function V2FooterSkeleton() {
  return <footer aria-hidden className="min-h-[380px] bg-brand-900" />
}

// Inter is the primary font VTV.vn self-hosts (441 font-family declarations
// on their homepage vs 71 Roboto + 134 Merriweather serif for article body).
// Scoped to /v2 only — root layout keeps Be Vietnam Pro for the rest of the site.
const inter = Inter({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-inter-v2",
  display: "swap",
})

export default function V2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      data-page="home-v2"
      className={`${inter.variable} min-h-screen bg-white`}
    >
      <V2Header />
      <main className="flex-1">{children}</main>
      <Suspense fallback={<V2FooterSkeleton />}>
        <V2Footer />
      </Suspense>
    </div>
  )
}
