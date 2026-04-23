import { Navbar } from "@/components/features/layout/Navbar"
import { Footer } from "@/components/features/layout/Footer"
import { HeroBackdrop } from "@/components/features/layout/HeroBackdrop"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HeroBackdrop />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
