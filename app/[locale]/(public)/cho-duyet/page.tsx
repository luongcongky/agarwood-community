import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function PendingApprovalPage() {
  const t = await getTranslations("pendingApproval")
  const tc = await getTranslations("common")

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-brand-200 shadow-lg p-8 space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
          <span className="text-3xl">⏳</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-brand-900">{t("title")}</h1>
          <p className="text-sm text-brand-500 mt-2">
            {t("description")}
          </p>
        </div>

        <div className="bg-brand-50 rounded-xl p-4 text-sm text-brand-600 space-y-2">
          <p className="font-medium">{t("emailNotice")}</p>
          <ul className="text-left space-y-1 ml-4 list-disc">
            <li>{t("approved")}</li>
            <li>{t("moreInfo")}</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-block rounded-xl bg-brand-700 text-white font-semibold py-2.5 px-6 text-sm hover:bg-brand-800 transition-colors"
          >
            {tc("backToHome")}
          </Link>
          <Link
            href="/lien-he"
            className="text-sm text-brand-600 hover:text-brand-800"
          >
            {t("contactAdmin")}
          </Link>
        </div>
      </div>
    </div>
  )
}
