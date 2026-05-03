/**
 * Seed full leadership board for Nhiệm kỳ III (2023–2028).
 * Data source: https://hoitramhuongvietnam.org/thong-tin-hoi/lanh-dao-hoi.html
 *
 * Run: npx tsx scripts/seed-leaders.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { config } from "dotenv"
config({ path: ".env.local" })

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const TERM = "Nhiệm kỳ III (2023–2028)"

type Cat = "BTV" | "BCH" | "BKT"

interface LeaderSeed {
  name: string
  title: string
  category: Cat
  workTitle: string
  sortOrder: number
}

const leaders: LeaderSeed[] = [
  // ── Ban Thường vụ (7 người) ──────────────────────────────────
  {
    name: "Phạm Văn Du",
    title: "Chủ tịch",
    category: "BTV",
    workTitle: "Giám đốc Công ty TNHH Liberty Việt Nam và Đông Dương",
    sortOrder: 1,
  },
  {
    name: "ThS. Nguyễn Văn Bình",
    title: "Phó Chủ tịch",
    category: "BTV",
    workTitle: "Chủ tịch HĐTV Công ty Sản xuất Trầm hương Bình Nghĩa",
    sortOrder: 2,
  },
  {
    name: "ThS. Nguyễn Văn Hùng",
    title: "Phó Chủ tịch",
    category: "BTV",
    workTitle: "Giám đốc Công ty TNHH Hùng Dung Agarwood",
    sortOrder: 3,
  },
  {
    name: "Nguyễn Thị Thu",
    title: "Phó Chủ tịch",
    category: "BTV",
    workTitle: "Chủ tịch Công ty TNHH Sản Xuất Trầm hương Việt Nam",
    sortOrder: 4,
  },
  {
    name: "ThS. Vương Bá Kiệt",
    title: "Tổng Thư ký",
    category: "BTV",
    workTitle: "Giám đốc Công ty TNHH TM-DV Tâm Hiệp Thành",
    sortOrder: 5,
  },
  {
    name: "Đoàn Thanh Hoàng",
    title: "Ủy viên Thường vụ, Trưởng Ban Kiểm tra",
    category: "BTV",
    workTitle: "Giám đốc Công ty TNHH Trầm hương Thế Hữu",
    sortOrder: 6,
  },
  {
    name: "Võ Đào Khanh",
    title: "Ủy viên Thường vụ",
    category: "BTV",
    workTitle: "Giám đốc Công ty TNHH XNK Trầm hương Đại Việt",
    sortOrder: 7,
  },

  // ── Ban Kiểm tra (3 người, Trưởng Ban = Đoàn Thanh Hoàng ở BTV) ──
  {
    name: "Đinh Văn Mười",
    title: "Ủy viên Ban Kiểm tra",
    category: "BKT",
    workTitle: "Giám đốc Công ty TNHH Trầm hương Gia Bảo",
    sortOrder: 1,
  },
  {
    name: "Nguyễn Hoàng Trân",
    title: "Ủy viên Ban Kiểm tra",
    category: "BKT",
    workTitle: "Kinh doanh Trầm hương",
    sortOrder: 2,
  },

  // ── Ủy viên Ban Chấp hành (11 người còn lại) ─────────────────
  {
    name: "PGS. TS Trần Hợp",
    title: "Chủ tịch danh dự",
    category: "BCH",
    workTitle: "Nghỉ hưu",
    sortOrder: 1,
  },
  {
    name: "Lê Kim Chương",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Giám đốc Công ty CP Đất Mới",
    sortOrder: 2,
  },
  {
    name: "Ngô Mỹ",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Giám đốc Công ty TNHH An Thanh Trầm Hương",
    sortOrder: 3,
  },
  {
    name: "Đặng Thanh Phong",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Chưng cất tinh dầu, Tân Phú, Đồng Nai",
    sortOrder: 4,
  },
  {
    name: "Trần Văn Quyến",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Giám đốc Công ty TNHH Sơn Thủy",
    sortOrder: 5,
  },
  {
    name: "TS. Hồ Cảnh Sơn",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Giám đốc Công ty TNHH ECO ART",
    sortOrder: 6,
  },
  {
    name: "ThS. Nguyễn Thị Lệ Sương",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Công ty TNHH XNK Trầm hương Đại Việt",
    sortOrder: 7,
  },
  {
    name: "Nguyễn Văn Bé Tùng",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Trang trại vườn Dó bầu, Tân Phú",
    sortOrder: 8,
  },
  {
    name: "Ngô Duy Tư",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Trang trại Dó bầu, Tân Phú",
    sortOrder: 9,
  },
  {
    name: "Trần Ngọc Xuân Trang",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Công ty TNHH Sản Xuất Trầm hương Việt Nam",
    sortOrder: 10,
  },
  {
    name: "Hoàng Văn Trưởng",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Giám đốc Công ty TNHH Trầm hương Hoàng Trưởng",
    sortOrder: 11,
  },
  {
    name: "Nguyễn Văn Út",
    title: "Ủy viên",
    category: "BCH",
    workTitle: "Trang trại Dó bầu Bình Dương",
    sortOrder: 12,
  },
]

async function main() {
  // Clear existing leaders for this term
  const deleted = await prisma.leader.deleteMany({ where: { term: TERM } })
  console.log(`Deleted ${deleted.count} existing leaders for ${TERM}\n`)

  let linked = 0

  for (const l of leaders) {
    // Try to link to existing user
    const searchName = l.name.replace(/^(ThS\.|PGS\. TS|TS\.) /, "")
    const user = await prisma.user.findFirst({
      where: { name: { contains: searchName, mode: "insensitive" } },
      select: { id: true, avatarUrl: true },
    })

    await prisma.leader.create({
      data: {
        name: l.name,
        title: l.title,
        category: l.category,
        workTitle: l.workTitle,
        term: TERM,
        sortOrder: l.sortOrder,
        isActive: true,
        photoUrl: user?.avatarUrl ?? null,
        userId: user?.id ?? null,
      },
    })

    const cat = l.category === "BTV" ? "BTV" : l.category === "BKT" ? "BKT" : "BCH"
    if (user) linked++
    console.log(`  [${cat}] #${l.sortOrder} ${l.title}: ${l.name}${user ? " ✓linked" : ""}`)
  }

  console.log(`\nSeeded ${leaders.length} leaders for ${TERM} (${linked} linked to users)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
