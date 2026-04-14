import Link from "next/link"
import type { PostCategory } from "@prisma/client"
import { getLatestPostsByCategory } from "@/lib/homepage"
import { PostCard } from "./PostCard"

export async function LatestPostsSection({
  category,
  title,
  subtitle,
  emptyText,
  bgClass = "bg-white",
  take = 6,
}: {
  category: PostCategory
  title: string
  subtitle: string
  emptyText: string
  bgClass?: string
  take?: number
}) {
  const posts = await getLatestPostsByCategory(category, take)

  return (
    <section className={`${bgClass} py-12 lg:py-16`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">{title}</h2>
            <p className="text-sm text-brand-500 mt-1">{subtitle}</p>
          </div>
          <Link
            href="/feed"
            className="hidden sm:inline-block text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-4"
          >
            Xem tất cả →
          </Link>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
            {emptyText}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} variant="vertical" />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
