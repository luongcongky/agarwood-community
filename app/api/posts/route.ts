import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getQuotaUsage } from "@/lib/quota"
import { getProductQuotaUsage } from "@/lib/product-quota"
import DOMPurify from "isomorphic-dompurify"
import type { PostCategory } from "@prisma/client"

/** Extract plain text từ HTML (dùng làm description cho product sidecar) */
function htmlToPlainText(html: string, maxLen = 10_000): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen)
}

/** Extract Cloudinary image URLs từ HTML */
function extractImageUrls(html: string): string[] {
  const matches = html.match(/https:\/\/res\.cloudinary\.com\/[^"'\s)]+/g)
  return matches ? [...new Set(matches)].slice(0, 10) : []
}

const VALID_CATEGORIES: PostCategory[] = ["GENERAL", "NEWS", "PRODUCT"]

// GET /api/posts?cursor=<postId>&category=NEWS|PRODUCT|GENERAL&certified=1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")
  const categoryParam = searchParams.get("category")
  const certifiedOnly = searchParams.get("certified") === "1"
  const session = await auth()
  const userId = session?.user?.id

  const category: PostCategory | undefined = VALID_CATEGORIES.includes(
    categoryParam as PostCategory,
  )
    ? (categoryParam as PostCategory)
    : undefined

  const posts = await prisma.post.findMany({
    where: {
      status: { in: ["PUBLISHED", "LOCKED"] },
      ...(category ? { category } : {}),
      ...(certifiedOnly
        ? { category: "PRODUCT", product: { is: { certStatus: "APPROVED" } } }
        : {}),
    },
    orderBy: [
      { isPromoted: "desc" },
      { authorPriority: "desc" },
      { createdAt: "desc" },
    ],
    take: 20,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      authorId: true,
      title: true,
      content: true,
      imageUrls: true,
      status: true,
      category: true,
      isPremium: true,
      isPromoted: true,
      authorPriority: true,
      viewCount: true,
      reportCount: true,
      lockedBy: true,
      lockReason: true,
      createdAt: true,
      updatedAt: true,
      lockedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          accountType: true,
          contributionTotal: true,
          company: { select: { name: true, slug: true } },
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          priceRange: true,
          category: true,
          badgeUrl: true,
          certStatus: true,
        },
      },
      reactions: {
        where: { userId: userId ?? "none" },
        select: { type: true },
      },
      _count: { select: { reactions: true } },
    },
  })

  const response = NextResponse.json({
    posts: posts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      lockedAt: p.lockedAt?.toISOString() ?? null,
    })),
  })
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
  return response
}

// POST /api/posts
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { title, content, category, product } = body as {
    title?: string
    content?: string
    category?: string
    product?: {
      name?: string
      slug?: string
      category?: string
      priceRange?: string
    }
  }

  if (!content || content.trim().length < 50) {
    return NextResponse.json({ error: "Nội dung quá ngắn (tối thiểu 50 ký tự)" }, { status: 400 })
  }

  // Validate category — default GENERAL nếu không truyền
  const cat: PostCategory = VALID_CATEGORIES.includes(category as PostCategory)
    ? (category as PostCategory)
    : "GENERAL"

  const wantsProduct = cat === "PRODUCT" && !!product?.name && !!product?.slug

  // Quota bài viết — áp dụng cho mọi post
  const usage = await getQuotaUsage(session.user.id)
  if (usage.limit !== -1 && usage.used >= usage.limit) {
    return NextResponse.json(
      {
        error: `Bạn đã đăng ${usage.used}/${usage.limit} bài tháng này. Hạn mức sẽ được làm mới vào đầu tháng sau. Nâng cấp VIP để tăng hạn mức.`,
        quota: usage,
      },
      { status: 429 },
    )
  }

  // Nếu đính kèm sản phẩm → validate + check product quota + slug uniqueness
  if (wantsProduct) {
    const slug = product!.slug!.trim()
    if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 2) {
      return NextResponse.json({ error: "Slug sản phẩm chỉ chứa a-z, 0-9, dấu gạch ngang, tối thiểu 2 ký tự" }, { status: 400 })
    }
    if (!product!.name || product!.name.trim().length < 2) {
      return NextResponse.json({ error: "Tên sản phẩm tối thiểu 2 ký tự" }, { status: 400 })
    }
    const pQuota = await getProductQuotaUsage(session.user.id)
    if (pQuota.limit !== -1 && pQuota.remaining <= 0) {
      return NextResponse.json(
        { error: `Đã đạt hạn mức ${pQuota.limit} sản phẩm/tháng. Hạn mức sẽ làm mới vào ${pQuota.resetAt.toLocaleDateString("vi-VN")}.` },
        { status: 429 },
      )
    }
    const slugTaken = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
    if (slugTaken) {
      return NextResponse.json({ error: "Slug sản phẩm đã được sử dụng — vui lòng chọn slug khác" }, { status: 409 })
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayPriority: true, contributionTotal: true },
  })

  const sanitizedContent = DOMPurify.sanitize(content)

  // Trường hợp đơn giản — chỉ tạo Post
  if (!wantsProduct) {
    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        title: title || null,
        content: sanitizedContent,
        imageUrls: [],
        category: cat,
        isPremium: session.user.role === "VIP",
        authorPriority: user?.displayPriority ?? 0,
      },
    })
    // Invalidate the /feed ISR cache so the new post shows up on the
    // next visit instead of waiting up to 60s for the revalidate tick.
    revalidatePath("/feed")
    revalidatePath("/[locale]/feed", "page")
    return NextResponse.json({ post }, { status: 201 })
  }

  // Trường hợp gộp — tạo Post + Product trong 1 transaction, link qua postId
  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  })
  const productImages = extractImageUrls(sanitizedContent)
  const productDescription = htmlToPlainText(sanitizedContent)

  const { post } = await prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        authorId: session.user.id,
        title: title || product!.name!,
        content: sanitizedContent,
        imageUrls: productImages,
        category: "PRODUCT",
        isPremium: session.user.role === "VIP",
        authorPriority: user?.displayPriority ?? 0,
      },
    })
    await tx.product.create({
      data: {
        ownerId: session.user.id,
        companyId: company?.id ?? null,
        postId: post.id,
        name: product!.name!.trim(),
        slug: product!.slug!.trim(),
        description: productDescription || null,
        category: product!.category?.trim() || null,
        priceRange: product!.priceRange?.trim() || null,
        imageUrls: productImages,
        ownerPriority: user?.displayPriority ?? 0,
      },
    })
    return { post }
  })

  revalidatePath("/feed")
  revalidatePath("/[locale]/feed", "page")
  return NextResponse.json({ post }, { status: 201 })
}
