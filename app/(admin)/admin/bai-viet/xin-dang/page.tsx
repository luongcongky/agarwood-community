import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { PromotionRequestItem } from "./PromotionRequestItem"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Xin đẩy lên trang chủ | Admin",
}

/**
 * Admin inbox cho promotion request (hướng "thụ động" — owner xin).
 *
 * Hiển thị tất cả request PENDING, sort cũ trước (FIFO). Lịch sử đã xử lý
 * có link xem riêng nếu admin cần audit — không dồn vào đây để inbox gọn.
 */
export default async function PromotionRequestsPage() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login")
  }

  const pending = await prisma.postPromotionRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      reason: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          content: true,
          imageUrls: true,
          category: true,
          isPromoted: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
              company: { select: { name: true } },
            },
          },
        },
      },
      requester: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  return (
    <div className="space-y-5 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Xin đẩy lên trang chủ ({pending.length})
          </h1>
          <p className="mt-1 text-sm text-brand-500">
            Hội viên đề xuất đẩy bài feed của mình lên trang chủ. Duyệt →
            bài được gắn cờ <code>isPromoted</code> + nổi lên homepage section
            tương ứng. Từ chối → kèm lý do để owner biết.
          </p>
          <p className="mt-2 text-xs text-brand-400">
            Muốn đẩy trực tiếp 1 bài (không qua xin duyệt)?{" "}
            <Link
              href="/admin/bai-viet/cho-duyet"
              className="underline hover:text-brand-700"
            >
              Dùng menu trên từng bài feed →
            </Link>
          </p>
        </div>
      </header>

      {pending.length === 0 ? (
        <div className="rounded border border-dashed border-brand-200 p-12 text-center text-brand-500">
          Không có yêu cầu đang chờ.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((req) => (
            <PromotionRequestItem
              key={req.id}
              request={{
                id: req.id,
                reason: req.reason,
                createdAt: req.createdAt.toISOString(),
                requester: req.requester,
                post: {
                  ...req.post,
                  createdAt: req.post.createdAt.toISOString(),
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
