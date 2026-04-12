// ============================================================
// Agarwood Community Platform — Seed Data
// Chạy: npx prisma db seed
// Password mặc định: Demo@123
// Data thành viên thực tế — Hội Trầm Hương Việt Nam, nhiệm kỳ III
// ============================================================

import { PrismaClient, Role, AccountType, MemberCategory } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hash } from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Helpers ──────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// Generate placeholder email from name
function makeEmail(name: string): string {
  const clean = name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase().replace(/[^a-z\s]/g, "").trim()
  const parts = clean.split(/\s+/)
  // lastName + first letter of each other part
  const last = parts[parts.length - 1]
  const initials = parts.slice(0, -1).map(p => p[0]).join("")
  return `${last}${initials}@hoitramhuong.vn`
}

// ── Member data ─────────────────────────────────────────────

interface MemberSeed {
  stt: number
  name: string
  associationTitle: string   // chức danh trong Hội
  workTitle: string           // chức vụ đơn vị công tác
  companyName?: string        // tên công ty (nếu có)
  accountType: AccountType
  memberCategory: MemberCategory
  displayPriority: number
}

const members: MemberSeed[] = [
  // ── Ban Thường vụ ──────────────────────────────────────────
  {
    stt: 1, name: "Phạm Văn Du",
    associationTitle: "Chủ tịch",
    workTitle: "Giám đốc Công ty TNHH Liberty Việt Nam và Đông Dương",
    companyName: "Công ty TNHH Liberty Việt Nam và Đông Dương",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 100,
  },
  {
    stt: 2, name: "ThS. Nguyễn Văn Bình",
    associationTitle: "Phó Chủ tịch",
    workTitle: "Chủ tịch HĐTV Công ty Sản xuất Trầm hương Bình Nghĩa",
    companyName: "Công ty Sản xuất Trầm hương Bình Nghĩa",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 90,
  },
  {
    stt: 3, name: "ThS. Nguyễn Văn Hùng",
    associationTitle: "Phó Chủ tịch",
    workTitle: "Giám đốc Công ty TNHH Hùng Dung Agarwood",
    companyName: "Công ty TNHH Hùng Dung Agarwood",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 90,
  },
  {
    stt: 4, name: "Nguyễn Thị Thu",
    associationTitle: "Phó Chủ tịch",
    workTitle: "Chủ tịch Công ty TNHH Sản Xuất Trầm hương Việt Nam",
    companyName: "Công ty TNHH Sản Xuất Trầm hương Việt Nam",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 90,
  },
  {
    stt: 5, name: "ThS. Vương Bá Kiệt",
    associationTitle: "Tổng Thư ký",
    workTitle: "Giám đốc Công ty TNHH TM-DV Tâm Hiệp Thành",
    companyName: "Công ty TNHH TM-DV Tâm Hiệp Thành",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 85,
  },
  {
    stt: 6, name: "PGS. TS Trần Hợp",
    associationTitle: "Chủ tịch danh dự",
    workTitle: "Nghỉ hưu",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.HONORARY, displayPriority: 95,
  },

  // ── Ủy viên Ban Chấp hành ─────────────────────────────────
  {
    stt: 7, name: "Lê Kim Chương",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Giám đốc Công ty CP Đất Mới",
    companyName: "Công ty CP Đất Mới",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 8, name: "Đoàn Thanh Hoàng",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Giám đốc Công ty TNHH Trầm hương Thế Hữu",
    companyName: "Công ty TNHH Trầm hương Thế Hữu",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 9, name: "Võ Đào Khanh",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Phó Giám đốc Công ty TNHH Xuất nhập khẩu Trầm hương Đại Việt",
    companyName: "Công ty TNHH Xuất nhập khẩu Trầm hương Đại Việt",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 10, name: "Đinh Văn Mười",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Giám đốc Công ty TNHH Trầm hương Gia Bảo",
    companyName: "Công ty TNHH Trầm hương Gia Bảo",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 11, name: "Ngô Mỹ",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Giám đốc Công ty An Thanh Trầm Hương",
    companyName: "Công ty An Thanh Trầm Hương",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 12, name: "Trần Văn Quyến",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Giám đốc Công ty TNHH Sơn Thủy",
    companyName: "Công ty TNHH Sơn Thủy",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 13, name: "ThS. Nguyễn Thị Lệ Sương",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Giám đốc Công ty TNHH Xuất nhập khẩu Trầm hương Đại Việt",
    companyName: "Công ty TNHH Xuất nhập khẩu Trầm hương Đại Việt",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 14, name: "Trần Ngọc Xuân Trang",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Giám đốc Công ty TNHH Sản Xuất Trầm hương Việt Nam",
    companyName: "Công ty TNHH Sản Xuất Trầm hương Việt Nam",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 15, name: "Nguyễn Hoàng Trân",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 16, name: "Ngô Duy Tư",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Chủ Trang trại Dó bầu Tân Phú, Đồng Nai",
    companyName: "Trang trại Dó bầu Tân Phú",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 17, name: "Nguyễn Văn Bé Tùng",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Chủ trang trại Dó bầu, Bình Dương",
    companyName: "Trang trại Dó bầu Bình Dương",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 18, name: "Hoàng Văn Trưởng",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Giám đốc Công ty MTV Trầm hương Hoàng Trưởng",
    companyName: "Công ty MTV Trầm hương Hoàng Trưởng",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 19, name: "Đặng Thanh Phong",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Chủ xưởng chưng cất tinh dầu Trầm hương, H.Tân Phú, T. Đồng Nai",
    companyName: "Xưởng chưng cất tinh dầu Trầm hương Tân Phú",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 20, name: "TS. Hồ Cảnh Sơn",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Chủ tịch HĐQT Công ty CP Kiến trúc cảnh quan Sinh thái ECO ART",
    companyName: "Công ty CP Kiến trúc cảnh quan Sinh thái ECO ART",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },
  {
    stt: 21, name: "Nguyễn Văn Út",
    associationTitle: "Ủy viên Ban Chấp hành",
    workTitle: "Chủ Trang trại Dó bầu Tân Phú, Đồng Nai",
    companyName: "Trang trại Dó bầu Tân Phú Đồng Nai",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 70,
  },

  // ── Hội viên ──────────────────────────────────────────────
  {
    stt: 22, name: "Phạm Tuấn Anh",
    associationTitle: "Hội viên",
    workTitle: "Chủ trang trại Trầm hương Hoàng Trầm, Khánh Hòa",
    companyName: "Trang trại Trầm hương Hoàng Trầm",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 23, name: "Nguyễn Phước An",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 24, name: "Lê Duy Ân",
    associationTitle: "Hội viên",
    workTitle: "Giám đốc Công ty trầm hương Đông Sơn Hà Tĩnh",
    companyName: "Công ty trầm hương Đông Sơn Hà Tĩnh",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 25, name: "Nguyễn Hòa Bình",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 26, name: "LS. Phạm Quang Bình",
    associationTitle: "Hội viên",
    workTitle: "Chủ Trang trại Dó bầu Trầm hương Bình Phước",
    companyName: "Trang trại Dó bầu Trầm hương Bình Phước",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 28, name: "Trương Thị Cúc",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 29, name: "Trần Quốc Công",
    associationTitle: "Hội viên",
    workTitle: "Hợp tác xã Trầm hương Phúc Trạch",
    companyName: "Hợp tác xã Trầm hương Phúc Trạch",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 30, name: "Phan Minh Cường",
    associationTitle: "Hội viên",
    workTitle: "Giám đốc Công ty Trầm hương An Lành",
    companyName: "Công ty Trầm hương An Lành",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 31, name: "Nguyễn Cửu Thị Kim Chi",
    associationTitle: "Hội viên",
    workTitle: "Giám đốc Công ty TNHH Mỹ Mỹ",
    companyName: "Công ty TNHH Mỹ Mỹ",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 32, name: "Nguyễn Thị Ngọc Diễm",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 33, name: "Hồ Hoàng Diễm",
    associationTitle: "Hội viên",
    workTitle: "Công ty TNHH Phát triển chuỗi Dhouse",
    companyName: "Công ty TNHH Phát triển chuỗi Dhouse",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 34, name: "Bùi Khắc Dũng",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 35, name: "Võ Thị Thùy Dung",
    associationTitle: "Hội viên",
    workTitle: "Phó Giám đốc Công ty TNHH Hùng Dung Agarwood",
    // Cùng công ty với STT 3 — không tạo company riêng
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 36, name: "Biện Quốc Dũng",
    associationTitle: "Hội viên",
    workTitle: "Giám đốc Công ty TNHH Trầm hương Biện Quốc Dũng",
    companyName: "Công ty TNHH Trầm hương Biện Quốc Dũng",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 38, name: "Phạm Đặng",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 39, name: "Chế Xuân Đến",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 42, name: "Bảo Đôn Hậu",
    associationTitle: "Hội viên",
    workTitle: "Giám đốc Công ty TNHH Đầu tư - Sản xuất - thương mại Nguyên Phúc",
    companyName: "Công ty TNHH Đầu tư - Sản xuất - thương mại Nguyên Phúc",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 43, name: "Huỳnh Văn Hiếu",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 44, name: "Nguyễn Quang Huy",
    associationTitle: "Hội viên",
    workTitle: "Phó Chủ tịch Công ty TNHH DHouse",
    // Liên quan Dhouse (STT 33) — không tạo company riêng
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 45, name: "Bùi Quốc Khánh",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 46, name: "Nguyễn Thị Kính",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 47, name: "Dương Mỹ Kim",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 48, name: "Hồ Anh Khoa",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 51, name: "Nguyễn Thị Liên",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 52, name: "Lương Thị Mỹ Liên",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 53, name: "Nguyễn Phương Linh",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 54, name: "Nguyễn Thị Ánh Loan",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 55, name: "Lê Nguyễn Kim Long",
    associationTitle: "Hội viên",
    workTitle: "Giám đốc Kỹ thuật Công ty Cổ phần Đất Mới",
    // Cùng công ty với STT 7 — không tạo company riêng
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 56, name: "Nguyễn Phúc Lưu",
    associationTitle: "Hội viên",
    workTitle: "Công ty Cổ phần sản xuất và đầu tư Trầm hương Việt Nam",
    // Liên quan TNHH SX Trầm hương VN (STT 4) — không tạo company riêng
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 57, name: "Đinh Mã Lương",
    associationTitle: "Hội viên",
    workTitle: "Chủ vườn Dó bầu trồng",
    companyName: "Vườn Dó bầu Đinh Mã Lương",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 58, name: "TS. Nguyễn Văn Minh",
    associationTitle: "Hội viên",
    workTitle: "Nghỉ hưu",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.HONORARY, displayPriority: 50,
  },
  {
    stt: 59, name: "Hồ Văn Nhứt",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 60, name: "Nguyễn Thị Nga",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 61, name: "Nguyễn Thị Mỹ Nga",
    associationTitle: "Hội viên",
    workTitle: "Giám đốc Công ty TNHH TM XNK T&T Global",
    companyName: "Công ty TNHH TM XNK T&T Global",
    accountType: AccountType.BUSINESS, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 62, name: "Đinh Thị Bích Nguyệt",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 64, name: "Ngô Tấn Phong",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 65, name: "Nguyễn Phong Phú",
    associationTitle: "Hội viên",
    workTitle: "Công ty Cổ phần sản xuất và đầu tư Trầm hương Việt Nam",
    // Liên quan TNHH SX Trầm hương VN (STT 4) — không tạo company riêng
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
  {
    stt: 66, name: "Ngô Ngọc Phước",
    associationTitle: "Hội viên",
    workTitle: "Kinh doanh Trầm hương",
    accountType: AccountType.INDIVIDUAL, memberCategory: MemberCategory.OFFICIAL, displayPriority: 50,
  },
]

async function main() {
  console.log("🌱 Bắt đầu seed data...")

  console.log("🧹 Đang dọn dẹp dữ liệu cũ...")
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
  await prisma.news.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.siteConfig.deleteMany()
  console.log("✅ Đã dọn dẹp xong.")

  const passwordHash = await hash("Demo@123", 12)

  // ============================================================
  // 1. SITE CONFIG
  // ============================================================
  await prisma.siteConfig.createMany({
    skipDuplicates: true,
    data: [
      { key: "membership_fee_min",    value: "2000000",    description: "Niên liễn Tổ chức tối thiểu — theo Điều lệ Hội (VND)" },
      { key: "membership_fee_max",    value: "10000000",   description: "Niên liễn Tổ chức — mức đóng tự nguyện tối đa đề nghị (VND)" },
      { key: "join_fee_organization", value: "2000000",    description: "Phí gia nhập (1 lần) — Hội viên Tổ chức / Liên kết (VND)" },
      { key: "join_fee_individual",   value: "1000000",    description: "Phí gia nhập (1 lần) — Hội viên Cá nhân (VND)" },
      { key: "cert_fee",              value: "5000000",    description: "Phí xét duyệt chứng nhận SP (VND)" },
      { key: "association_name",      value: "Hội Trầm Hương Việt Nam", description: "Tên hội" },
      { key: "association_email",     value: "hoitramhuongvietnam2010@gmail.com", description: "Email liên hệ" },
      { key: "association_phone",     value: "0913 810 060", description: "Số điện thoại (Chủ tịch Hội)" },
      { key: "association_phone_2",   value: "0938 334 647", description: "Số điện thoại (Phó Chủ tịch Hội)" },
      { key: "contact_address",       value: "Số 150, Đường Lý Chính Thắng, Phường Xuân Hòa, Thành phố Hồ Chí Minh", description: "Địa chỉ trụ sở" },
      { key: "association_website",   value: "https://hoitramhuong.vn", description: "Website chính thức" },
      { key: "facebook_url",          value: "https://www.facebook.com/hoitramhuongvietnam.org", description: "Link Facebook" },
      { key: "max_vip_accounts",      value: "100",        description: "Số tài khoản VIP tối đa" },
      { key: "bank_name",            value: "Vietinbank", description: "Ngân hàng nhận CK" },
      { key: "bank_account_number",  value: "116000060707", description: "Số tài khoản" },
      { key: "bank_account_name",    value: "HOI TRAM HUONG VIET NAM", description: "Tên chủ TK" },
      { key: "bank_branch",          value: "",            description: "Chi nhánh ngân hàng" },
      { key: "tier_silver_threshold", value: "10000000",   description: "Ngưỡng hạng Bạc — Doanh nghiệp (VND)" },
      { key: "tier_gold_threshold",   value: "20000000",   description: "Ngưỡng hạng Vàng — Doanh nghiệp (VND)" },
      { key: "individual_fee_min",          value: "1000000",    description: "Niên liễn Cá nhân tối thiểu — theo Điều lệ Hội (VND)" },
      { key: "individual_fee_max",          value: "2000000",    description: "Niên liễn Cá nhân — mức đóng tự nguyện tối đa đề nghị (VND)" },
      { key: "individual_tier_silver",      value: "3000000",    description: "Ngưỡng hạng Bạc — Cá nhân (VND)" },
      { key: "individual_tier_gold",        value: "5000000",    description: "Ngưỡng hạng Vàng — Cá nhân (VND)" },
      { key: "banner_price_per_month", value: "1000000", description: "Giá banner / tháng (VND)" },
      { key: "banner_quota_guest",     value: "1",       description: "Quota banner / tháng — GUEST" },
      { key: "banner_quota_vip_1",     value: "5",       description: "Quota banner / tháng — VIP ★" },
      { key: "banner_quota_vip_2",     value: "10",      description: "Quota banner / tháng — VIP ★★ Bạc" },
      { key: "banner_quota_vip_3",     value: "20",      description: "Quota banner / tháng — VIP ★★★ Vàng" },
      { key: "product_quota_guest_monthly",  value: "3",   description: "Quota sản phẩm / tháng — GUEST" },
      { key: "product_quota_vip_1_monthly",  value: "10",  description: "Quota sản phẩm / tháng — VIP ★" },
      { key: "product_quota_vip_2_monthly",  value: "25",  description: "Quota sản phẩm / tháng — VIP ★★ Bạc" },
      { key: "product_quota_vip_3_monthly",  value: "-1",  description: "Quota sản phẩm / tháng — VIP ★★★ Vàng (unlimited)" },
    ],
  })
  console.log("✅ Site config")

  // ============================================================
  // 2. ADMIN USER
  // ============================================================
  const adminEmail = "admin@hoitramhuong.vn"
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!admin) {
    try {
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Ban Quản Trị Hội",
          phone: "028 3820 1234",
          role: Role.ADMIN,
          isActive: true,
          passwordHash,
          contributionTotal: 0,
          displayPriority: 999,
          accounts: { create: { type: "credentials", provider: "credentials", providerAccountId: adminEmail } },
        },
      })
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
        admin = await prisma.user.findUnique({ where: { email: adminEmail } })
      } else {
        throw e
      }
    }
  }

  if (!admin) throw new Error("Failed to create or find admin user")
  console.log("✅ Admin:", admin.email)

  // ============================================================
  // 3. HỘI VIÊN — Dữ liệu thực tế nhiệm kỳ III
  // ============================================================
  // Track created companies to avoid duplicates (some members share a company)
  const companySlugMap = new Map<string, boolean>()
  let memberCount = 0

  for (const m of members) {
    // Strip academic title prefix for display name (keep full name for record)
    const email = makeEmail(m.name.replace(/^(PGS\.\s*|TS\.\s*|ThS\.\s*|LS\.\s*)/g, ""))
    const companySlug = m.companyName ? slugify(m.companyName) : undefined

    // Build user create data
    const userData: Record<string, unknown> = {
      email,
      name: m.name,
      role: Role.VIP,
      isActive: true,
      passwordHash,
      accountType: m.accountType,
      memberCategory: m.memberCategory,
      contributionTotal: 0,
      displayPriority: m.displayPriority,
      accounts: { create: { type: "credentials", provider: "credentials", providerAccountId: email } },
    }

    // Create company only for BUSINESS type with a unique company
    if (m.companyName && companySlug && m.accountType === AccountType.BUSINESS && !companySlugMap.has(companySlug)) {
      companySlugMap.set(companySlug, true)
      userData.company = {
        create: {
          name: m.companyName,
          slug: companySlug,
          representativeName: m.name.replace(/^(PGS\.\s*|TS\.\s*|ThS\.\s*|LS\.\s*)/g, ""),
          representativePosition: m.workTitle.match(/^(Giám đốc|Chủ tịch|Phó Giám đốc|Phó Chủ tịch|Chủ tịch HĐTV|Chủ tịch HĐQT|Chủ|Giám đốc Kỹ thuật)/)?.[0] ?? "Giám đốc",
          isVerified: true,
          isPublished: true,
        },
      }
    }

    try {
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: userData as Parameters<typeof prisma.user.create>[0]["data"],
      })
      memberCount++
      const tierLabel = m.associationTitle === "Hội viên" ? "" : ` (${m.associationTitle})`
      console.log(`  ✅ ${m.stt.toString().padStart(2)}. ${m.name}${tierLabel}`)
    } catch (e: unknown) {
      console.error(`  ❌ ${m.stt}. ${m.name}: ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log(`✅ Hội viên: ${memberCount}/${members.length}`)

  // ============================================================
  // 4. TAGS
  // ============================================================
  await prisma.tag.createMany({
    skipDuplicates: true,
    data: [
      { name: "Trầm tự nhiên",    slug: "tram-tu-nhien" },
      { name: "Trầm nuôi cấy",    slug: "tram-nuoi-cay" },
      { name: "Tinh dầu",         slug: "tinh-dau" },
      { name: "Nhang trầm",       slug: "nhang-tram" },
      { name: "Vòng trầm",        slug: "vong-tram" },
      { name: "Xuất khẩu",        slug: "xuat-khau" },
      { name: "Thị trường",       slug: "thi-truong" },
      { name: "Kỹ thuật",         slug: "ky-thuat" },
      { name: "Kinh nghiệm",     slug: "kinh-nghiem" },
      { name: "Sự kiện",          slug: "su-kien" },
      { name: "Khánh Hòa",       slug: "khanh-hoa" },
      { name: "Quảng Nam",        slug: "quang-nam" },
      { name: "Phong thủy",       slug: "phong-thuy" },
      { name: "Sưu tầm",          slug: "suu-tam" },
    ],
  })
  console.log("✅ Tags: 14")

  // ============================================================
  // SUMMARY
  // ============================================================
  const businessCount = members.filter(m => m.accountType === AccountType.BUSINESS && m.companyName).length
  const individualCount = members.filter(m => m.accountType === AccountType.INDIVIDUAL).length
  const bchCount = members.filter(m => m.associationTitle !== "Hội viên").length
  const hvCount = members.filter(m => m.associationTitle === "Hội viên").length

  console.log("\n" + "═".repeat(55))
  console.log("🎉 SEED HOÀN TẤT — TỔNG KẾT")
  console.log("═".repeat(55))
  console.log(`Admin:            1 (admin@hoitramhuong.vn)`)
  console.log(`Hội viên:         ${memberCount} thành viên`)
  console.log(`  Ban Thường vụ:  ${members.filter(m => ["Chủ tịch", "Phó Chủ tịch", "Tổng Thư ký", "Chủ tịch danh dự"].includes(m.associationTitle)).length}`)
  console.log(`  UV Ban CH:      ${members.filter(m => m.associationTitle === "Ủy viên Ban Chấp hành").length}`)
  console.log(`  Hội viên:       ${hvCount}`)
  console.log(`Doanh nghiệp:    ${companySlugMap.size} (${businessCount} có DN)`)
  console.log(`Cá nhân:          ${individualCount}`)
  console.log(`Tags:             14`)
  console.log("─".repeat(55))
  console.log("Password:         Demo@123")
  console.log("Admin:            admin@hoitramhuong.vn")
  console.log("VIP email format: <tên viết tắt>@hoitramhuong.vn")
  console.log("─".repeat(55))
  console.log("Tin tức, sản phẩm, bài viết: nhập data thực qua admin UI")
  console.log("═".repeat(55))
}

main()
  .catch((e) => {
    console.error("❌ Seed thất bại!")
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
