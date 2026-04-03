export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: redirect to / if not ADMIN role
  return (
    <>
      {/* TODO: Admin sidebar */}
      <main>{children}</main>
    </>
  )
}
