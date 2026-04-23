import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMonthlyQuota, startOfMonth, startOfNextMonth } from "@/lib/quota"
import { getMonthlyProductQuota } from "@/lib/product-quota"
import DOMPurify from "isomorphic-dompurify"
import type { PostCategory } from "@prisma/client"

const POST_AUTHOR_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  role: true,
  accountType: true,
  contributionTotal: true,
  company: { select: { name: true, slug: true } },
} as const

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
  const mineOnly = searchParams.get("mine") === "1"
  const session = await auth()
  const userId = session?.user?.id

  const category: PostCategory | undefined = VALID_CATEGORIES.includes(
    categoryParam as PostCategory,
  )
    ? (categoryParam as PostCategory)
    : undefined

  // `mine=1` chỉ có nghĩa khi đã login. Guest gửi mine=1 → bỏ qua, trả
  // feed mặc định (không empty cho viewer chưa login).
  const effectiveMine = mineOnly && !!userId

  // Moderation visibility — match logic in feed/page.tsx:
  //  PUBLISHED → all; LOCKED no-note → all (auto-lock); LOCKED with note or
  //  PENDING → owner only (bai admin reject voi ly do, hoac cho duyet).
  //
  // mine=1 → loại bỏ moderation OR, chỉ lấy bài của chính user (bao gồm
  // PENDING/LOCKED của họ để họ tracking moderation state). Ignore
  // category filter cho view MINE — user muốn thấy TẤT CẢ bài của mình.
  const posts = await prisma.post.findMany({
    where: effectiveMine
      ? {
          authorId: userId,
          // Loại DELETED để khỏi lộ bài đã xoá mềm
          status: { not: "DELETED" },
        }
      : {
          ...(userId
            ? {
                OR: [
                  { status: "PUBLISHED" },
                  { status: "LOCKED", moderationNote: null },
                  { status: "PENDING", authorId: userId },
                  { status: "LOCKED", moderationNote: { not: null }, authorId: userId },
                ],
              }
            : {
                OR: [
                  { status: "PUBLISHED" },
                  { status: "LOCKED", moderationNote: null },
                ],
              }),
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
    take: 10,
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
      moderationNote: true,
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
      // Latest promotion request (chỉ 1 — dùng để hiện badge cho owner).
      // Nếu không có request nào → array rỗng. Client filter theo authorId
      // để chỉ attach vào owner's posts (tránh leak state ra viewer khác).
      promotionRequests: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { status: true, reviewNote: true },
      },
      _count: { select: { reactions: true } },
    },
  })

  const response = NextResponse.json({
    posts: posts.map((p) => {
      const { promotionRequests, ...rest } = p
      return {
        ...rest,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        lockedAt: p.lockedAt?.toISOString() ?? null,
        // Only expose promotion state to the author of the post.
        latestPromotionRequest:
          userId && p.authorId === userId
            ? (promotionRequests[0] ?? null)
            : null,
      }
    }),
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

  const cat: PostCategory = VALID_CATEGORIES.includes(category as PostCategory)
    ? (category as PostCategory)
    : "GENERAL"

  const wantsProduct = cat === "PRODUCT" && !!product?.name && !!product?.slug
  const userId = session.user.id

  // Validate product fields synchronously before hitting the DB
  let productSlug = ""
  if (wantsProduct) {
    productSlug = product!.slug!.trim()
    if (!/^[a-z0-9-]+$/.test(productSlug) || productSlug.length < 2) {
      return NextResponse.json({ error: "Slug sản phẩm chỉ chứa a-z, 0-9, dấu gạch ngang, tối thiểu 2 ký tự" }, { status: 400 })
    }
    if (!product!.name || product!.name.trim().length < 2) {
      return NextResponse.json({ error: "Tên sản phẩm tối thiểu 2 ký tự" }, { status: 400 })
    }
  }

  // ── All independent reads in one round-trip ─────────────────────────────
  // Single user fetch (was duplicated 3x previously) + counts + slug check
  // + company lookup, all parallel via Promise.all.
  const monthStart = startOfMonth()
  const [user, postCount, productCount, slugConflict, company] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        contributionTotal: true,
        accountType: true,
        displayPriority: true,
      },
    }),
    prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: monthStart },
        status: { in: ["PUBLISHED", "LOCKED"] },
      },
    }),
    wantsProduct
      ? prisma.product.count({ where: { ownerId: userId, createdAt: { gte: monthStart } } })
      : Promise.resolve(0),
    wantsProduct
      ? prisma.product.findUnique({ where: { slug: productSlug }, select: { id: true } })
      : Promise.resolve(null),
    wantsProduct
      ? prisma.company.findUnique({ where: { ownerId: userId }, select: { id: true } })
      : Promise.resolve(null),
  ])

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Quota checks (siteConfig is cached 60s — usually a no-op DB call)
  const limit = await getMonthlyQuota({
    role: user.role,
    contributionTotal: user.contributionTotal,
    accountType: user.accountType,
  })
  if (limit !== -1 && postCount >= limit) {
    return NextResponse.json(
      {
        error: `Bạn đã đăng ${postCount}/${limit} bài tháng này. Hạn mức sẽ được làm mới vào đầu tháng sau. Nâng cấp VIP để tăng hạn mức.`,
        quota: { used: postCount, limit, remaining: 0, resetAt: startOfNextMonth() },
      },
      { status: 429 },
    )
  }

  if (wantsProduct) {
    const productLimit = await getMonthlyProductQuota({
      role: user.role,
      contributionTotal: user.contributionTotal,
      accountType: user.accountType,
    })
    if (productLimit !== -1 && productCount >= productLimit) {
      return NextResponse.json(
        { error: `Đã đạt hạn mức ${productLimit} sản phẩm/tháng. Hạn mức sẽ làm mới vào ${startOfNextMonth().toLocaleDateString("vi-VN")}.` },
        { status: 429 },
      )
    }
    if (slugConflict) {
      return NextResponse.json({ error: "Slug sản phẩm đã được sử dụng — vui lòng chọn slug khác" }, { status: 409 })
    }
  }

  const sanitizedContent = DOMPurify.sanitize(content)

  // Moderation: ADMIN bypass (auto-PUBLISHED), mọi role khác vào hàng PENDING
  // chờ admin duyệt. Không bypass cho VIP/INFINITE để giữ công bằng mọi tier.
  const initialStatus: "PENDING" | "PUBLISHED" =
    session.user.role === "ADMIN" ? "PUBLISHED" : "PENDING"

  // Trường hợp đơn giản — chỉ tạo Post
  if (!wantsProduct) {
    const post = await prisma.post.create({
      data: {
        authorId: userId,
        title: title || null,
        content: sanitizedContent,
        imageUrls: [],
        category: cat,
        status: initialStatus,
        // INFINITE = "full quyền VIP Vàng" per schema — their posts get
        // the premium badge alongside regular VIP. Admins don't typically
        // post via this flow, so they're left out.
        isPremium: session.user.role === "VIP" || session.user.role === "INFINITE",
        authorPriority: user.displayPriority,
      },
      include: { author: { select: POST_AUTHOR_SELECT } },
    })
    // Invalidate the /feed ISR cache so the new post shows up on the
    // next visit instead of waiting up to 60s for the revalidate tick.
    revalidatePath("/[locale]/feed", "page")
    return NextResponse.json({ post }, { status: 201 })
  }

  // Trường hợp gộp — tạo Post + Product trong 1 transaction, link qua postId
  const productImages = extractImageUrls(sanitizedContent)
  const productDescription = htmlToPlainText(sanitizedContent)

  const created = await prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        authorId: userId,
        title: title || product!.name!,
        content: sanitizedContent,
        imageUrls: productImages,
        category: "PRODUCT",
        status: initialStatus,
        // INFINITE = "full quyền VIP Vàng" per schema — their posts get
        // the premium badge alongside regular VIP. Admins don't typically
        // post via this flow, so they're left out.
        isPremium: session.user.role === "VIP" || session.user.role === "INFINITE",
        authorPriority: user.displayPriority,
      },
      include: { author: { select: POST_AUTHOR_SELECT } },
    })
    const newProduct = await tx.product.create({
      data: {
        ownerId: userId,
        companyId: company?.id ?? null,
        postId: post.id,
        name: product!.name!.trim(),
        slug: productSlug,
        description: productDescription || null,
        category: product!.category?.trim() || null,
        priceRange: product!.priceRange?.trim() || null,
        imageUrls: productImages,
        ownerPriority: user.displayPriority,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        priceRange: true,
        category: true,
        badgeUrl: true,
        certStatus: true,
      },
    })
    return { post, product: newProduct }
  })

  revalidatePath("/[locale]/feed", "page")
  return NextResponse.json(
    { post: { ...created.post, product: created.product } },
    { status: 201 },
  )
}
