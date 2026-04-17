import { redirect } from "next/navigation"

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/gioi-thieu`)
}
