import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BannerRegisterForm } from "./BannerRegisterForm"

export const metadata = {
  title: "Đăng ký Banner Quảng cáo | Hội Trầm Hương Việt Nam",
  description: "Đăng ký banner quảng cáo trên trang chủ Hội Trầm Hương — quy trình tự phục vụ.",
}

export default async function BannerRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/banner/dang-ky`)
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="bg-brand-800 py-14 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">Đăng ký Banner Quảng cáo</h1>
        <p className="mt-2 text-brand-300 text-base">
          Quảng bá thương hiệu của bạn trên trang chủ Hội Trầm Hương Việt Nam
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <BannerRegisterForm />
      </div>
    </div>
  )
}
