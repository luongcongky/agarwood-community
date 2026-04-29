import { Suspense } from "react"
import { SiteHeader } from "@/components/features/homepage/SiteHeader"
import { SiteFooter } from "@/components/features/homepage/SiteFooter"
import { BackToTop } from "@/components/features/layout/BackToTop"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"

function SiteFooterSkeleton() {
  return <footer aria-hidden className="min-h-[380px] bg-brand-900" />
}

/**
 * Bug fix (2026-04-29): trước đây dùng cũ `<Navbar />` + `<HeroBackdrop />`
 * → chrome khác hẳn public detail page (SiteHeader/SiteFooter VTV-style).
 * Owner navigate /san-pham/{slug} → click "Chỉnh sửa" → /san-pham/{slug}/sua
 * thấy template lệch. Đổi sang SiteHeader/SiteFooter để đồng nhất với public.
 *
 * (member) chỉ chứa 3 page (san-pham/tao-moi, [slug]/sua, [slug]/lich-su)
 * — đều là page tự quản lý SP của hội viên, không cần sidebar đặc biệt.
 */
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <div data-page="member" className="min-h-screen bg-white flex flex-col">
        <SiteHeader />
        <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Suspense fallback={<SiteFooterSkeleton />}>
          <SiteFooter />
        </Suspense>
        <BackToTop />
      </div>
    </NextIntlClientProvider>
  )
}
