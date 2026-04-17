import { Navbar } from "@/components/features/layout/Navbar"
import { HeroBackdrop } from "@/components/features/layout/HeroBackdrop"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen bg-brand-50/60">
        <HeroBackdrop />
        <Navbar />
        <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  )
}
