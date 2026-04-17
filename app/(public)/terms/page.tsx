import type { Metadata } from "next"
import Link from "next/link"
import DOMPurify from "isomorphic-dompurify"
import { OfficialChannelsBlock } from "@/components/features/layout/OfficialChannelsBlock"
import { getLegalPage } from "@/lib/legal-pages"

export const revalidate = 600

export const metadata: Metadata = {
  title: "Điều khoản sử dụng — Hội Trầm Hương Việt Nam",
  description:
    "Điều khoản sử dụng website Hội Trầm Hương Việt Nam (VAWA).",
  alternates: { canonical: "/terms" },
}

export default async function TermsPage() {
  const page = await getLegalPage("terms")

  return (
    <div className="bg-brand-50/60 min-h-screen">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
    <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-6 sm:p-10 space-y-10">
      <header className="space-y-3 border-b border-brand-200 pb-6">
        <p className="text-xs uppercase tracking-wider font-semibold text-brand-500">
          Văn bản pháp lý
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-900">
          {page?.title ?? "Điều khoản sử dụng"}
        </h1>
        {page && (
          <p className="text-sm text-brand-500">
            Cập nhật lần cuối:{" "}
            {page.updatedAt.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        )}
      </header>

      {page ? (
        <article
          className="prose prose-brand max-w-none text-brand-800"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
        />
      ) : (
        <div className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-10 text-center space-y-3">
          <p className="text-brand-700 font-semibold">
            Chưa có nội dung điều khoản sử dụng.
          </p>
          <p className="text-sm text-brand-500">
            Admin cần tạo bài viết với category <strong>LEGAL</strong> và slug{" "}
            <code className="rounded bg-white border border-brand-200 px-1.5 py-0.5">
              dieu-khoan-su-dung
            </code>{" "}
            tại{" "}
            <Link href="/admin/tin-tuc" className="underline text-brand-700">
              /admin/tin-tuc
            </Link>
            .
          </p>
        </div>
      )}

      <OfficialChannelsBlock variant="full" />
    </div>
    </div>
    </div>
  )
}
