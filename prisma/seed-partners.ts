// ============================================================
// Seed Partner — đối tác / cơ quan đoàn thể liên kết với Hội.
// Idempotent: upsert theo `name`. Logo để null — admin tự upload sau.
//
// Chạy local:    npx tsx prisma/seed-partners.ts
// Chạy Supabase: MIGRATE_TARGET=supabase npx tsx prisma/seed-partners.ts
// ============================================================

import { PrismaClient, PartnerCategory } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { config as loadEnv } from "dotenv"
import path from "node:path"

loadEnv({ path: path.resolve(process.cwd(), ".env.local") })

const connectionString =
  process.env.MIGRATE_TARGET === "supabase"
    ? process.env.SUPABASE_DIRECT_URL
    : process.env.DATABASE_URL

if (!connectionString) throw new Error("Missing DATABASE_URL / SUPABASE_DIRECT_URL")

const pool = new Pool({ connectionString })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

type SeedPartner = {
  name: string
  shortName?: string
  category: PartnerCategory
  websiteUrl?: string
  description?: string
  sortOrder: number
}

const PARTNERS: SeedPartner[] = [
  // ── Cơ quan nhà nước ──
  {
    name: "Bộ Nông nghiệp & Phát triển Nông thôn",
    shortName: "MARD",
    category: PartnerCategory.GOVERNMENT,
    websiteUrl: "https://mard.gov.vn",
    description: "Cơ quan quản lý chuyên ngành lâm nghiệp, lâm sản",
    sortOrder: 10,
  },

  // ── Cơ quan báo chí, truyền thông ──
  {
    name: "Đài Truyền hình Việt Nam",
    shortName: "VTV",
    category: PartnerCategory.MEDIA,
    websiteUrl: "https://vtv.vn",
    description: "Đài Truyền hình Quốc gia Việt Nam",
    sortOrder: 20,
  },
  {
    name: "Đài Tiếng nói Việt Nam",
    shortName: "VOV",
    category: PartnerCategory.MEDIA,
    websiteUrl: "https://vov.vn",
    description: "Đài Phát thanh Quốc gia Việt Nam",
    sortOrder: 30,
  },
  {
    name: "Thông tấn xã Việt Nam",
    shortName: "TTXVN",
    category: PartnerCategory.MEDIA,
    websiteUrl: "https://vnanet.vn",
    description: "Cơ quan thông tấn quốc gia Việt Nam",
    sortOrder: 40,
  },
  {
    name: "Báo Nhân Dân",
    shortName: "ND",
    category: PartnerCategory.MEDIA,
    websiteUrl: "https://nhandan.vn",
    description: "Cơ quan ngôn luận của Đảng Cộng sản Việt Nam",
    sortOrder: 50,
  },
  {
    name: "Báo Nông nghiệp Việt Nam",
    shortName: "NNVN",
    category: PartnerCategory.MEDIA,
    websiteUrl: "https://nongnghiep.vn",
    description: "Cơ quan ngôn luận của Bộ Nông nghiệp & PTNT",
    sortOrder: 60,
  },
  {
    name: "Báo Thanh Niên",
    shortName: "TN",
    category: PartnerCategory.MEDIA,
    websiteUrl: "https://thanhnien.vn",
    sortOrder: 70,
  },
  {
    name: "Báo Tuổi Trẻ",
    shortName: "TT",
    category: PartnerCategory.MEDIA,
    websiteUrl: "https://tuoitre.vn",
    sortOrder: 80,
  },
]

async function main() {
  const target = process.env.MIGRATE_TARGET === "supabase" ? "Supabase" : "local"
  console.log(`🤝 Seed Partner (${target})`)

  let created = 0
  let updated = 0
  for (const p of PARTNERS) {
    const existed = await prisma.partner.findFirst({ where: { name: p.name } })
    if (existed) {
      await prisma.partner.update({
        where: { id: existed.id },
        data: {
          shortName: p.shortName ?? null,
          category: p.category,
          websiteUrl: p.websiteUrl ?? null,
          description: p.description ?? null,
          sortOrder: p.sortOrder,
          isActive: true,
        },
      })
      updated++
    } else {
      await prisma.partner.create({
        data: {
          name: p.name,
          shortName: p.shortName ?? null,
          category: p.category,
          websiteUrl: p.websiteUrl ?? null,
          description: p.description ?? null,
          sortOrder: p.sortOrder,
          isActive: true,
        },
      })
      created++
    }
  }

  console.log(`✅ Đã upsert ${PARTNERS.length} đối tác (mới: ${created}, cập nhật: ${updated})`)

  // Xoá partner cũ không còn trong danh sách (giữ DB sạch sau khi đổi seed)
  const keepNames = PARTNERS.map((p) => p.name)
  const removed = await prisma.partner.deleteMany({
    where: { name: { notIn: keepNames } },
  })
  if (removed.count > 0) console.log(`🗑️  Đã xoá ${removed.count} partner cũ ngoài danh sách`)

  console.log(`   Logo để null — admin upload qua Cloudinary và update Partner.logoUrl sau.`)
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
