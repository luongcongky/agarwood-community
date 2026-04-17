import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { BannerRegisterForm } from "./BannerRegisterForm"

export async function generateMetadata() {
  const t = await getTranslations("bannerRegister")
  return { title: t("metaTitle") }
}

export default async function BannerRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [session, t] = await Promise.all([auth(), getTranslations("bannerRegister")])
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/banner/dang-ky`)
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="bg-brand-800 py-14 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">{t("pageTitle")}</h1>
        <p className="mt-2 text-brand-300 text-base">
          {t("pageSubtitle")}
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <BannerRegisterForm />
      </div>
    </div>
  )
}
