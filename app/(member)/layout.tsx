export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: redirect to /login if not authenticated or not VIP
  return (
    <>
      {/* TODO: Member sidebar / nav */}
      <main>{children}</main>
    </>
  )
}
