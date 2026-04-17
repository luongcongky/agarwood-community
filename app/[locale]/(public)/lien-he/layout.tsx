import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Liên hệ Hội Trầm Hương Việt Nam — địa chỉ, email, số điện thoại và form liên hệ trực tuyến.",
  alternates: { canonical: "/lien-he" },
}

export default function LienHeLayout({ children }: { children: React.ReactNode }) {
  return children
}
