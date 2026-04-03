export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* TODO: Header */}
      <main>{children}</main>
      {/* TODO: Footer */}
    </>
  )
}
