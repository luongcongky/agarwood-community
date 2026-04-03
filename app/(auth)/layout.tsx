export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-50 px-4">
      <div className="mb-8 text-center">
        <span className="text-4xl" aria-hidden>🌿</span>
        <h1 className="font-heading text-brand-800 font-semibold text-xl mt-2">
          Hội Trầm Hương Việt Nam
        </h1>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
