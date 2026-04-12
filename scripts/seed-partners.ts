// ============================================================
// Agarwood Community Platform — Seed Partners Script
// Nguồn: crawled từ https://hoitramhuongvietnam.org/dich-vu-xuc-tien-thuong-mai.html
// Chạy: npx tsx scripts/seed-partners.ts
// ============================================================

import { PrismaClient, Role, MembershipStatus } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hash } from "bcryptjs"
import { v2 as cloudinary } from "cloudinary"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Cấu hình Cloudinary ──────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

// ── Helpers ──────────────────────────────────────────────────
function daysFromNow(n: number) { return new Date(Date.now() + n * 86400000) }

/**
 * Upload ảnh từ URL lên Cloudinary.
 * Nếu ảnh đã tồn tại (public_id trùng), skip và trả về URL cũ.
 */
async function uploadLogoFromUrl(imageUrl: string, publicId: string): Promise<string> {
  try {
    // Kiểm tra xem đã upload chưa
    const existing = await cloudinary.api.resource(publicId).catch(() => null)
    if (existing) {
      console.log(`  ⏭️  Logo đã tồn tại: ${publicId}`)
      return existing.secure_url as string
    }
  } catch {
    // không tồn tại, tiếp tục upload
  }

  console.log(`  ☁️  Đang upload: ${publicId} <- ${imageUrl}`)
  // LƯU Ý: publicId đã bao gồm full path "agarwood-community/members/xxx",
  // KHÔNG dùng thêm option `folder` — sẽ gây double prefix.
  const result = await cloudinary.uploader.upload(imageUrl, {
    public_id: publicId,
    overwrite: false,
    resource_type: "image",
    // Tối ưu logo: resize về max 400x400, giữ tỉ lệ, nền trắng
    transformation: [
      { width: 400, height: 400, crop: "pad", background: "white" },
      { fetch_format: "auto", quality: "auto" },
    ],
  })
  return result.secure_url
}

// ── Dữ liệu đối tác crawled ──────────────────────────────────
// contributionTotal = 10_000_000 → hạng Bạc (silver threshold theo SiteConfig)
const PARTNERS = [
  {
    email: "lienhe@baotram.vn",
    name: "Bảo Trầm - Tâm Hiệp Thành",
    phone: "",
    logoSourceUrl: "https://hoitramhuongvietnam.org/images/baotram.jpg",
    logoPublicId: "agarwood-community/members/baotram-tam-hiep-thanh",
    company: {
      name: "Bảo Trầm - Tâm Hiệp Thành",
      slug: "bao-tram-tam-hiep-thanh",
      description: "Đối tác của Hội Trầm Hương Việt Nam chuyên về sản phẩm Bảo Trầm.",
      website: "https://baotram.vn",
      isVerified: true,
    },
  },
  {
    email: "lienhe@kynamhuong.com",
    name: "Kỳ Nam Hương",
    phone: "",
    logoSourceUrl: "https://hoitramhuongvietnam.org/images/logo_gt.png",
    logoPublicId: "agarwood-community/members/ky-nam-huong",
    company: {
      name: "Kỳ Nam Hương",
      slug: "ky-nam-huong",
      description: "Đối tác của Hội Trầm Hương Việt Nam — Kỳ Nam Hương.",
      website: "https://kynamhuong.com",
      isVerified: true,
    },
  },
  {
    email: "lienhe@anthanhtramhuong.vn",
    name: "An Thanh Trầm Hương / THT Co.",
    phone: "",
    logoSourceUrl: "https://hoitramhuongvietnam.org/images/img_20240330_140322.jpg",
    logoPublicId: "agarwood-community/members/an-thanh-tram-huong",
    company: {
      name: "An Thanh Trầm Hương / THT Co.",
      slug: "an-thanh-tram-huong",
      description: "Đối tác của Hội Trầm Hương Việt Nam — An Thanh Trầm Hương.",
      website: "",
      isVerified: true,
    },
  },
  {
    email: "lienhe@tramhuongdaiviet.vn",
    name: "Trầm Hương Đại Việt",
    phone: "",
    logoSourceUrl: "https://hoitramhuongvietnam.org/images/daiviet.jpg",
    logoPublicId: "agarwood-community/members/tram-huong-dai-viet",
    company: {
      name: "Trầm Hương Đại Việt",
      slug: "tram-huong-dai-viet",
      description: "Đối tác của Hội Trầm Hương Việt Nam — Trầm Hương Đại Việt.",
      website: "",
      isVerified: true,
    },
  },
  {
    email: "lienhe@tramhuongtinhlong.com",
    name: "Trầm Hương Tinh Long",
    phone: "",
    logoSourceUrl: "https://hoitramhuongvietnam.org/images/tinhlong.jpg",
    logoPublicId: "agarwood-community/members/tram-huong-tinh-long",
    company: {
      name: "Trầm Hương Tinh Long",
      slug: "tram-huong-tinh-long",
      description: "Đối tác của Hội Trầm Hương Việt Nam — Trầm Hương Tinh Long.",
      website: "https://tramhuongtinhlong.com",
      isVerified: true,
    },
  },
  {
    email: "lienhe@agarvina.vn",
    name: "Agarvina",
    phone: "",
    logoSourceUrl: "https://hoitramhuongvietnam.org/images/agarvina.jpg",
    logoPublicId: "agarwood-community/members/agarvina",
    company: {
      name: "Agarvina",
      slug: "agarvina",
      description: "Đối tác của Hội Trầm Hương Việt Nam — Agarvina.",
      website: "",
      isVerified: true,
    },
  },
  {
    email: "lienhe@tramhuonghungdung.com",
    name: "Trầm Hương Hùng Dũng",
    phone: "",
    logoSourceUrl: "https://hoitramhuongvietnam.org/images/hungdung.jpg",
    logoPublicId: "agarwood-community/members/tram-huong-hung-dung",
    company: {
      name: "Trầm Hương Hùng Dũng",
      slug: "tram-huong-hung-dung",
      description: "Đối tác của Hội Trầm Hương Việt Nam — Trầm Hương Hùng Dũng.",
      website: "https://tramhuonghungdung.com",
      isVerified: true,
    },
  },
  {
    email: "lienhe@nhangtramhuong.com",
    name: "Nhang Trầm Hương Cao Cấp Thế Hữu",
    phone: "",
    logoSourceUrl: "https://hoitramhuongvietnam.org/images/thehuu.jpg",
    logoPublicId: "agarwood-community/members/nhang-tram-huong-the-huu",
    company: {
      name: "Nhang Trầm Hương Cao Cấp Thế Hữu",
      slug: "nhang-tram-huong-the-huu",
      description: "Đối tác của Hội Trầm Hương Việt Nam — Nhang Trầm Hương Cao Cấp Thế Hữu.",
      website: "https://nhangtramhuong.com",
      isVerified: true,
    },
  },
  {
    email: "lienhe@agarwood.vn",
    name: "Binh Nghia Agarwood",
    phone: "",
    logoSourceUrl: "https://hoitramhuongvietnam.org/images/logo-binhnghia-footer(1).png",
    logoPublicId: "agarwood-community/members/binh-nghia-agarwood",
    company: {
      name: "Binh Nghia Agarwood",
      slug: "binh-nghia-agarwood",
      description: "Đối tác của Hội Trầm Hương Việt Nam — Binh Nghia Agarwood.",
      website: "https://agarwood.vn",
      isVerified: true,
    },
  },
]

// Hạng Bạc: contributionTotal = 10.000.000 VND (đúng threshold tier_silver)
const SILVER_CONTRIBUTION = 10_000_000

async function main() {
  console.log("🌱 Bắt đầu seed đối tác (Partners → VIP Bạc)...")
  console.log("")

  const passwordHash = await hash("Demo@123", 12)

  // ── Bước 1: Upload tất cả logo lên Cloudinary ──────────────
  console.log("📸 Upload logo lên Cloudinary...")
  const logoUrls: Record<string, string> = {}

  for (const partner of PARTNERS) {
    try {
      const url = await uploadLogoFromUrl(partner.logoSourceUrl, partner.logoPublicId)
      logoUrls[partner.email] = url
      console.log(`  ✅ ${partner.name}: ${url}`)
    } catch (err) {
      console.error(`  ❌ Lỗi upload logo ${partner.name}:`, err)
      // Fallback: dùng URL gốc nếu upload thất bại
      logoUrls[partner.email] = partner.logoSourceUrl
    }
  }

  console.log("")
  console.log("👥 Tạo tài khoản VIP Bạc cho các đối tác...")

  // ── Bước 2: Xóa VIP users + companies cũ (giữ lại admin) ──
  console.log("🧹 Đang xóa VIP users cũ (giữ nguyên admin, siteConfig, news, tags)...")
  await prisma.postTag.deleteMany()
  await prisma.postReaction.deleteMany()
  await prisma.report.deleteMany()
  await prisma.post.deleteMany()
  await prisma.membershipApplication.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.certification.deleteMany()
  await prisma.banner.deleteMany()
  await prisma.product.deleteMany()
  await prisma.company.deleteMany()
  await prisma.mediaOrder.deleteMany()
  // Xóa non-admin users
  await prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } })
  console.log("✅ Đã xóa VIP users cũ.")
  console.log("")

  // ── Bước 3: Tạo VIP Bạc cho từng đối tác ──────────────────
  const createdPartners: { name: string; email: string }[] = []

  for (const partner of PARTNERS) {
    const logoUrl = logoUrls[partner.email]
    const validFrom = new Date("2026-01-01")
    const validTo   = new Date("2027-01-01")

    const user = await prisma.user.upsert({
      where: { email: partner.email },
      update: {},
      create: {
        email: partner.email,
        name: partner.name,
        phone: partner.phone || null,
        role: Role.VIP,
        isActive: true,
        passwordHash,
        avatarUrl: logoUrl,
        contributionTotal: SILVER_CONTRIBUTION,
        displayPriority: Math.floor(SILVER_CONTRIBUTION / 1_000_000),
        membershipExpires: validTo,
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: partner.email,
          },
        },
        company: {
          create: {
            name: partner.company.name,
            slug: partner.company.slug,
            description: partner.company.description,
            logoUrl: logoUrl,
            website: partner.company.website || null,
            isVerified: partner.company.isVerified,
            isPublished: true,
            isFeatured: false,
          },
        },
      },
    })

    // Tạo Membership
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        amountPaid: SILVER_CONTRIBUTION,
        validFrom,
        validTo,
        status: MembershipStatus.ACTIVE,
        paymentRef: `PARTNER-${partner.company.slug}`,
        note: "Import từ danh sách đối tác Hội Trầm Hương Việt Nam",
      },
    })

    // Tạo Payment tương ứng
    await prisma.payment.create({
      data: {
        userId: user.id,
        type: "MEMBERSHIP_FEE",
        status: "SUCCESS",
        amount: SILVER_CONTRIBUTION,
        payosOrderCode: `PARTNER-${partner.company.slug}-2026`,
        membershipId: membership.id,
        description: `Phí hội viên 2026 — ${partner.name}`,
      },
    })

    createdPartners.push({ name: partner.name, email: partner.email })
    console.log(`  ✅ VIP ★★ Bạc: ${partner.name} <${partner.email}>`)
  }

  console.log("")
  console.log("═".repeat(55))
  console.log("🎉 SEED ĐỐI TÁC HOÀN TẤT")
  console.log("═".repeat(55))
  console.log(`Tổng số đối tác: ${createdPartners.length}`)
  console.log(`Hạng:            VIP ★★ Bạc (${SILVER_CONTRIBUTION.toLocaleString("vi-VN")}đ)`)
  console.log(`Password:        Demo@123`)
  console.log("")
  createdPartners.forEach(p => console.log(`  - ${p.name} <${p.email}>`))
  console.log("═".repeat(55))
}

main()
  .catch((e) => {
    console.error("❌ Seed đối tác thất bại!")
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
