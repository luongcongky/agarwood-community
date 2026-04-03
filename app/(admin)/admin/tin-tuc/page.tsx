import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DeleteNewsButton } from "./DeleteNewsButton"

export const revalidate = 0

export default async function AdminNewsPage() {
  const newsList = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      isPinned: true,
      publishedAt: true,
      createdAt: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Quản lý Tin tức</h1>
        <Link
          href="/admin/tin-tuc/moi"
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
        >
          + Tạo tin tức mới
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Tiêu đề
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Đã xuất bản
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Ghim
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Ngày
              </th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {newsList.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Chưa có tin tức nào
                </td>
              </tr>
            )}
            {newsList.map((news) => (
              <tr
                key={news.id}
                className="hover:bg-brand-50/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-900 line-clamp-1">
                    {news.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{news.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      news.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {news.isPublished ? "Đã xuất bản" : "Nháp"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {news.isPinned && (
                    <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                      Ghim
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {news.publishedAt
                    ? new Date(news.publishedAt).toLocaleDateString("vi-VN")
                    : new Date(news.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/tin-tuc/${news.id}`}
                      className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                    >
                      Chỉnh sửa
                    </Link>
                    <DeleteNewsButton newsId={news.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
