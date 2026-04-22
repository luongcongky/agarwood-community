import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminMultimediaList() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login")
  }

  const items = await prisma.multimedia.findMany({
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      slug: true,
      title: true,
      coverImageUrl: true,
      youtubeId: true,
      imageUrls: true,
      isPublished: true,
      isPinned: true,
      publishedAt: true,
      createdAt: true,
    },
  })

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Multimedia ({items.length})</h1>
        <Link
          href="/admin/multimedia/tao-moi"
          className="rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + Tạo mới
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
          Chưa có multimedia nào. Nhấn <strong>Tạo mới</strong> để bắt đầu.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="px-3 py-2">Cover</th>
                <th className="px-3 py-2">Tiêu đề</th>
                <th className="px-3 py-2">Loại</th>
                <th className="px-3 py-2">Nội dung</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Xuất bản</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const cover =
                  it.coverImageUrl ??
                  (it.type === "VIDEO" && it.youtubeId
                    ? `https://img.youtube.com/vi/${it.youtubeId}/default.jpg`
                    : null)
                return (
                  <tr key={it.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-3 py-2">
                      {cover ? (
                        <div className="relative h-10 w-16 overflow-hidden bg-neutral-100">
                          <Image src={cover} alt="" fill className="object-cover" sizes="64px" />
                        </div>
                      ) : (
                        <div className="h-10 w-16 bg-neutral-100" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/multimedia/${it.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {it.title}
                      </Link>
                      <div className="text-xs text-neutral-500 font-mono">{it.slug}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                          it.type === "VIDEO"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {it.type === "VIDEO" ? "Video" : "Ảnh"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-neutral-600">
                      {it.type === "VIDEO"
                        ? it.youtubeId ?? "—"
                        : `${it.imageUrls.length} ảnh`}
                    </td>
                    <td className="px-3 py-2">
                      {it.isPublished ? (
                        <span className="text-xs text-green-700">● Đã xuất bản</span>
                      ) : (
                        <span className="text-xs text-neutral-500">○ Nháp</span>
                      )}
                      {it.isPinned && (
                        <span className="ml-2 text-xs text-amber-600">📌</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-neutral-600">
                      {it.publishedAt
                        ? new Date(it.publishedAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/multimedia/${it.id}`}
                        className="text-xs text-brand-700 hover:underline"
                      >
                        Sửa
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
