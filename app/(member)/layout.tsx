import { Navbar } from "@/components/features/layout/Navbar"

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth guard handled by middleware — layout chỉ cần render
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </>
  )
}
