import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { ModerationItem } from "./ModerationItem"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Duyệt bài viết | Admin",
}

export default async function PostModerationPage() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login")
  }

  const pendingPosts = await prisma.post.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      content: true,
      imageUrls: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  })

  return (
    <div className="space-y-5 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Duyệt bài viết ({pendingPosts.length})
          </h1>
          <p className="mt-1 text-sm text-brand-500">
            Bài do hội viên đăng — chỉ owner thấy được cho đến khi admin duyệt.
            Duyệt → công khai. Từ chối → khoá + hiển thị lý do cho tác giả.
          </p>
        </div>
      </header>

      {pendingPosts.length === 0 ? (
        <div className="rounded border border-dashed border-brand-200 p-12 text-center text-brand-500">
          Không có bài chờ duyệt.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPosts.map((post) => (
            <ModerationItem
              key={post.id}
              post={{
                ...post,
                createdAt: post.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
