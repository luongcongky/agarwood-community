// ============================================================
// Seed Banner Quảng cáo — 3 TOP + 5 MID
// Chạy local:    npx tsx prisma/seed-banners.ts
// Chạy Supabase: cross-env DATABASE_URL=$SUPABASE_DIRECT_URL npx tsx prisma/seed-banners.ts
// ============================================================

import { PrismaClient, BannerPosition, BannerStatus } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { config as loadEnv } from "dotenv"
import path from "node:path"

loadEnv({ path: path.resolve(process.cwd(), ".env.local") })

// Cho phép override bằng DATABASE_URL (default) hoặc SUPABASE_DIRECT_URL khi truyền MIGRATE_TARGET=supabase
const connectionString =
  process.env.MIGRATE_TARGET === "supabase"
    ? process.env.SUPABASE_DIRECT_URL
    : process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("Missing DATABASE_URL / SUPABASE_DIRECT_URL")
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

type SeedBanner = {
  title: string
  imageUrl: string
  targetUrl: string
}

// Ảnh chủ đề từ loremflickr — `lock` giữ kết quả ổn định giữa các lần fetch.
const flickr = (tags: string, lock: number) =>
  `https://loremflickr.com/1600/400/${tags}/all?lock=${lock}`

const TOP_BANNERS: SeedBanner[] = [
  {
    title: "Khuyến mãi 30% Trầm Hương Khánh Hòa — Chỉ trong tháng này",
    imageUrl: flickr("incense,wood", 111),
    targetUrl: "https://hoitramhuong.vn/san-pham-doanh-nghiep",
  },
  {
    title: "Đại hội Hội Trầm Hương Việt Nam nhiệm kỳ IV — Đăng ký tham dự",
    imageUrl: flickr("meeting,hall", 112),
    targetUrl: "https://hoitramhuong.vn/tin-tuc",
  },
  {
    title: "Chương trình chứng nhận sản phẩm Trầm Hương 2026",
    imageUrl: flickr("medal,ceremony", 113),
    targetUrl: "https://hoitramhuong.vn/landing",
  },
]

const MID_BANNERS: SeedBanner[] = [
  {
    title: "Trầm Hương Tự Nhiên — Cơ sở Hương Trầm Đạt Phát",
    imageUrl: flickr("agarwood,forest", 201),
    targetUrl: "https://hoitramhuong.vn/san-pham-doanh-nghiep",
  },
  {
    title: "Nhang Trầm Cao Cấp — Xưởng Trầm Hương Phúc Lộc",
    imageUrl: flickr("incense,smoke", 202),
    targetUrl: "https://hoitramhuong.vn/san-pham-doanh-nghiep",
  },
  {
    title: "Tinh Dầu Trầm Hương Nguyên Chất — Công ty Thiên Hương",
    imageUrl: flickr("essential-oil,perfume", 203),
    targetUrl: "https://hoitramhuong.vn/san-pham-doanh-nghiep",
  },
  {
    title: "Vòng Trầm Hương Thủ Công — Nghệ nhân Phan Văn Hùng",
    imageUrl: flickr("bracelet,wood", 204),
    targetUrl: "https://hoitramhuong.vn/san-pham-doanh-nghiep",
  },
  {
    title: "Trầm Cảnh Phong Thủy — Hội viên Vàng ★★★ VAWA",
    imageUrl: flickr("bonsai,temple", 205),
    targetUrl: "https://hoitramhuong.vn/landing",
  },
]

async function main() {
  console.log(`🌱 Seeding banners → ${process.env.MIGRATE_TARGET === "supabase" ? "Supabase" : "local"}`)

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  })
  if (!admin) {
    throw new Error("Không tìm thấy user ADMIN — vui lòng chạy `prisma db seed` trước.")
  }
  console.log(`   Owner (ADMIN): ${admin.email}`)

  // Xoá banner seed cũ (match chính xác title để không đụng banner thật)
  const allTitles = [...TOP_BANNERS, ...MID_BANNERS].map((b) => b.title)
  const deleted = await prisma.banner.deleteMany({
    where: { title: { in: allTitles } },
  })
  if (deleted.count > 0) console.log(`   Đã xoá ${deleted.count} banner seed cũ`)

  const now = new Date()
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000) // hôm qua
  const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // +90 ngày

  const rows = [
    ...TOP_BANNERS.map((b) => ({ ...b, position: BannerPosition.TOP })),
    ...MID_BANNERS.map((b) => ({ ...b, position: BannerPosition.MID })),
  ].map((b) => ({
    userId: admin.id,
    title: b.title,
    imageUrl: b.imageUrl,
    targetUrl: b.targetUrl,
    position: b.position,
    startDate: start,
    endDate: end,
    status: BannerStatus.ACTIVE,
    approvedAt: now,
    approvedBy: admin.id,
    price: 3_000_000, // 3 tháng × 1tr
  }))

  await prisma.banner.createMany({ data: rows })
  const topCount = await prisma.banner.count({ where: { position: "TOP", status: "ACTIVE" } })
  const midCount = await prisma.banner.count({ where: { position: "MID", status: "ACTIVE" } })
  console.log(`✅ Seeded ${rows.length} banner — TOP ACTIVE: ${topCount}, MID ACTIVE: ${midCount}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
