import Image from "next/image"
import { getTranslations } from "next-intl/server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations("common")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-50 px-4">
      <div className="mb-8 text-center">
        <Image
          src="/logo.png"
          alt={t("siteName")}
          width={96}
          height={96}
          className="h-24 w-24 mx-auto"
          priority
        />
        <h1 className="text-brand-800 font-semibold text-xl mt-2">
          {t("siteName")}
        </h1>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
