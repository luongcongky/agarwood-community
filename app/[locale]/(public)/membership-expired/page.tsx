import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function MembershipExpiredPage() {
  const t = await getTranslations("membershipExpired")

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <Link href="/feed">{t("renewNow")}</Link>
    </div>
  )
}
