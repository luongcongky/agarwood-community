// ============================================================
// Agarwood Community Platform — Demo Seed Data
// Chạy: npx prisma db seed
// Password mặc định: Demo@123
// ============================================================

import { PrismaClient, Role, MembershipStatus, CertStatus, PostStatus, MediaServiceType, MediaOrderStatus } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hash } from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000) }
function daysFromNow(n: number) { return new Date(Date.now() + n * 86400000) }
function monthsAgo(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() - n); return d
}

async function main() {
  console.log("🌱 Bắt đầu seed demo data...")

  console.log("🧹 Đang dọn dẹp dữ liệu cũ...")
  await prisma.postTag.deleteMany()
  await prisma.postReaction.deleteMany()
  await prisma.report.deleteMany()
  await prisma.post.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.certification.deleteMany()
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
      { key: "membership_fee_min",    value: "5000000",    description: "Phí hội viên tối thiểu (VND)" },
      { key: "membership_fee_max",    value: "10000000",   description: "Phí hội viên tối đa (VND)" },
      { key: "cert_fee",              value: "5000000",    description: "Phí xét duyệt chứng nhận SP (VND)" },
      { key: "association_name",      value: "Hội Trầm Hương Việt Nam", description: "Tên hội" },
      { key: "association_email",     value: "info@hoitramhuong.vn", description: "Email liên hệ" },
      { key: "association_phone",     value: "028 3820 1234", description: "Số điện thoại" },
      { key: "max_vip_accounts",      value: "100",        description: "Số tài khoản VIP tối đa" },
      { key: "bank_name",            value: "Vietcombank", description: "Ngân hàng nhận CK" },
      { key: "bank_account_number",  value: "0071001234567", description: "Số tài khoản" },
      { key: "bank_account_name",    value: "HOI TRAM HUONG VIET NAM", description: "Tên chủ TK" },
      { key: "tier_silver_threshold", value: "10000000",   description: "Ngưỡng hạng Bạc — Doanh nghiệp (VND)" },
      { key: "tier_gold_threshold",   value: "20000000",   description: "Ngưỡng hạng Vàng — Doanh nghiệp (VND)" },
      // Cá nhân / Chuyên gia
      { key: "individual_fee_min",          value: "1000000",    description: "Phí hội viên Cá nhân tối thiểu (VND)" },
      { key: "individual_fee_max",          value: "2000000",    description: "Phí hội viên Cá nhân tối đa (VND)" },
      { key: "individual_tier_silver",      value: "3000000",    description: "Ngưỡng hạng Bạc — Cá nhân (VND)" },
      { key: "individual_tier_gold",        value: "5000000",    description: "Ngưỡng hạng Vàng — Cá nhân (VND)" },
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
  // 3. VIP USERS — 8 hội viên thực tế
  // ============================================================
  const vipData = [
    // --- 2 Vàng (contribution >= 20tr) ---
    {
      email: "trankhanh@tramhuongkhanhhoa.vn",
      name: "Trần Khánh Hòa",
      phone: "0905 123 456",
      contributionTotal: 35_000_000,
      bankAccountName: "TRAN KHANH HOA",
      bankAccountNumber: "0451000234567",
      bankName: "Vietcombank",
      company: {
        name: "Trầm Hương Khánh Hòa",
        slug: "tram-huong-khanh-hoa",
        description: "Chuyên khai thác và chế biến trầm hương tự nhiên từ vùng núi Khánh Hòa — nơi được mệnh danh là thủ phủ trầm hương Việt Nam. Với hơn 18 năm kinh nghiệm, chúng tôi cam kết mang đến sản phẩm trầm hương nguyên chất, giữ nguyên hương thơm đặc trưng của vùng đất Khánh Hòa.",
        foundedYear: 2007,
        address: "456 Trần Phú, TP. Nha Trang, Khánh Hòa",
        phone: "0258 3521 789",
        website: "https://tramhuongkhanhhoa.vn",
        employeeCount: "50-200",
        isVerified: true,
      },
      memberships: [
        { amountPaid: 10_000_000, validFrom: new Date("2024-01-15"), validTo: new Date("2025-01-14") },
        { amountPaid: 10_000_000, validFrom: new Date("2025-01-15"), validTo: new Date("2026-01-14") },
        { amountPaid: 10_000_000, validFrom: new Date("2026-01-15"), validTo: new Date("2027-01-14") },
        { amountPaid: 5_000_000, validFrom: new Date("2023-06-01"), validTo: new Date("2024-05-31") },
      ],
    },
    {
      email: "levanminh@tramhuongquangnam.vn",
      name: "Lê Văn Minh",
      phone: "0935 234 567",
      contributionTotal: 30_000_000,
      bankAccountName: "LE VAN MINH",
      bankAccountNumber: "1903456789012",
      bankName: "Techcombank",
      company: {
        name: "Công Ty TNHH Trầm Hương Quảng Nam",
        slug: "tram-huong-quang-nam",
        description: "Doanh nghiệp tiên phong trong lĩnh vực trồng và nuôi cấy trầm hương tại Quảng Nam. Kết hợp phương pháp truyền thống và công nghệ hiện đại, tạo ra sản phẩm trầm hương chất lượng cao phục vụ thị trường nội địa và xuất khẩu sang Nhật Bản, Đài Loan.",
        foundedYear: 2010,
        address: "78 Lý Thường Kiệt, TP. Tam Kỳ, Quảng Nam",
        phone: "0235 3812 456",
        website: "https://tramhuongquangnam.com",
        employeeCount: "10-50",
        isVerified: true,
      },
      memberships: [
        { amountPaid: 10_000_000, validFrom: new Date("2024-03-01"), validTo: new Date("2025-02-28") },
        { amountPaid: 10_000_000, validFrom: new Date("2025-03-01"), validTo: new Date("2026-02-28") },
        { amountPaid: 10_000_000, validFrom: new Date("2026-03-01"), validTo: new Date("2027-02-28") },
      ],
    },
    // --- 3 Bạc (contribution 10-19tr) ---
    {
      email: "nguyenthilan@tinhdautramhuong.vn",
      name: "Nguyễn Thị Lan",
      phone: "0912 345 678",
      contributionTotal: 15_000_000,
      bankAccountName: "NGUYEN THI LAN",
      bankAccountNumber: "3601205678901",
      bankName: "BIDV",
      company: {
        name: "Tinh Dầu Trầm Hương Sài Gòn",
        slug: "tinh-dau-tram-huong-sai-gon",
        description: "Chuyên sản xuất và phân phối tinh dầu trầm hương nguyên chất chiết xuất bằng phương pháp chưng cất hơi nước. Sản phẩm đạt tiêu chuẩn xuất khẩu, được kiểm nghiệm bởi các phòng thí nghiệm uy tín.",
        foundedYear: 2015,
        address: "234 Nguyễn Trãi, Quận 1, TP.HCM",
        phone: "028 3925 6789",
        employeeCount: "10-50",
        isVerified: true,
      },
      memberships: [
        { amountPaid: 5_000_000, validFrom: new Date("2025-01-01"), validTo: new Date("2025-12-31") },
        { amountPaid: 10_000_000, validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31") },
      ],
    },
    {
      email: "phamducthang@nhangthom.vn",
      name: "Phạm Đức Thắng",
      phone: "0978 456 789",
      contributionTotal: 15_000_000,
      bankAccountName: "PHAM DUC THANG",
      bankAccountNumber: "0611002345678",
      bankName: "MB Bank",
      company: {
        name: "Nhang Thơm Trầm Việt",
        slug: "nhang-thom-tram-viet",
        description: "Sản xuất nhang trầm hương thủ công truyền thống từ nguyên liệu trầm hương tự nhiên Bình Phước. Không sử dụng hóa chất, phẩm màu. Mỗi nén nhang là sự kết tinh của thiên nhiên và tâm huyết người thợ.",
        foundedYear: 2012,
        address: "67 Phạm Văn Đồng, TP. Đồng Xoài, Bình Phước",
        phone: "0271 3879 012",
        employeeCount: "10-50",
        isVerified: true,
      },
      memberships: [
        { amountPaid: 5_000_000, validFrom: new Date("2025-06-01"), validTo: new Date("2026-05-31") },
        { amountPaid: 10_000_000, validFrom: new Date("2026-06-01"), validTo: new Date("2027-05-31") },
      ],
    },
    {
      email: "vothihuong@tramhuonghatinh.vn",
      name: "Võ Thị Hương",
      phone: "0986 567 890",
      contributionTotal: 10_000_000,
      bankAccountName: "VO THI HUONG",
      bankAccountNumber: "4211000567890",
      bankName: "Agribank",
      company: {
        name: "Trầm Hương Hà Tĩnh",
        slug: "tram-huong-ha-tinh",
        description: "Khai thác và chế biến trầm hương từ vùng rừng Hương Sơn, Hà Tĩnh — một trong những vùng trầm hương lâu đời nhất miền Trung. Sản phẩm chủ lực: trầm miếng, trầm bột, vòng tay trầm hương.",
        foundedYear: 2018,
        address: "12 Phan Đình Phùng, TP. Hà Tĩnh, Hà Tĩnh",
        phone: "0239 3856 234",
        employeeCount: "1-10",
        isVerified: true,
      },
      memberships: [
        { amountPaid: 10_000_000, validFrom: new Date("2026-02-01"), validTo: new Date("2027-01-31") },
      ],
    },
    // --- 2 Cơ bản (contribution 5-9tr) + 1 sắp hết hạn ---
    {
      email: "dangvantuan@tramhuongdaknong.vn",
      name: "Đặng Văn Tuấn",
      phone: "0967 678 901",
      contributionTotal: 5_000_000,
      bankAccountName: "DANG VAN TUAN",
      bankAccountNumber: "1021000345678",
      bankName: "VPBank",
      company: {
        name: "Trầm Hương Đắk Nông",
        slug: "tram-huong-dak-nong",
        description: "Doanh nghiệp trẻ chuyên trồng và nuôi cấy cây dó bầu tại Đắk Nông. Ứng dụng công nghệ vi sinh trong tạo trầm, hướng đến sản xuất bền vững và thân thiện môi trường.",
        foundedYear: 2021,
        address: "89 Nguyễn Tất Thành, TP. Gia Nghĩa, Đắk Nông",
        phone: "0261 3544 567",
        employeeCount: "1-10",
        isVerified: false,
      },
      memberships: [
        { amountPaid: 5_000_000, validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31") },
      ],
    },
    {
      email: "buithidao@nhapdoantramhuong.vn",
      name: "Bùi Thị Đào",
      phone: "0945 789 012",
      contributionTotal: 5_000_000,
      bankAccountName: "BUI THI DAO",
      bankAccountNumber: "0541000678901",
      bankName: "ACB",
      company: {
        name: "Nhập Đoàn Trầm Hương Đà Nẵng",
        slug: "nhap-doan-tram-huong-da-nang",
        description: "Chuyên nhập khẩu và phân phối trầm hương cao cấp từ Indonesia, Malaysia và Campuchia. Cung cấp nguyên liệu cho các cơ sở chế biến trầm hương trong nước.",
        foundedYear: 2019,
        address: "156 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng",
        phone: "0236 3745 678",
        employeeCount: "1-10",
        isVerified: false,
      },
      memberships: [
        // Sắp hết hạn — còn ~25 ngày
        { amountPaid: 5_000_000, validFrom: monthsAgo(11), validTo: daysFromNow(25) },
      ],
    },
    {
      email: "hoangduclong@tramhuongphuyenu.vn",
      name: "Hoàng Đức Long",
      phone: "0923 890 123",
      contributionTotal: 8_000_000,
      bankAccountName: "HOANG DUC LONG",
      bankAccountNumber: "6831000890123",
      bankName: "Sacombank",
      company: {
        name: "Trầm Hương Phú Yên",
        slug: "tram-huong-phu-yen",
        description: "Khai thác trầm hương tự nhiên từ vùng núi Sơn Hòa, Phú Yên. Sản phẩm nổi bật: trầm hương miếng loại đặc biệt, trầm sánh chìm nước — dòng sản phẩm cao cấp nhất dành cho giới sưu tầm.",
        foundedYear: 2016,
        address: "45 Trần Hưng Đạo, TP. Tuy Hòa, Phú Yên",
        phone: "0257 3822 901",
        employeeCount: "10-50",
        isVerified: true,
      },
      memberships: [
        { amountPaid: 5_000_000, validFrom: new Date("2025-04-01"), validTo: new Date("2026-03-31") },
        { amountPaid: 3_000_000, validFrom: new Date("2024-10-01"), validTo: new Date("2025-03-31") },
      ],
    },
  ]

  // Create VIP users with companies and memberships
  const vipUsers: { id: string; email: string; name: string; contributionTotal: number }[] = []

  for (const vip of vipData) {
    const { company: companyData, memberships: membershipData, ...userData } = vip
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: Role.VIP,
        isActive: true,
        passwordHash,
        contributionTotal: userData.contributionTotal,
        displayPriority: Math.floor(userData.contributionTotal / 1_000_000),
        bankAccountName: userData.bankAccountName,
        bankAccountNumber: userData.bankAccountNumber,
        bankName: userData.bankName,
        membershipExpires: membershipData.reduce((max, m) => m.validTo > max ? m.validTo : max, membershipData[0]?.validTo ?? new Date()),
        accounts: { create: { type: "credentials", provider: "credentials", providerAccountId: userData.email } },
        company: {
          create: {
            ...companyData,
            isPublished: true,
          },
        },
      },
    })

    // Create memberships + payments
    for (const m of membershipData) {
      const membership = await prisma.membership.create({
        data: {
          userId: user.id,
          amountPaid: m.amountPaid,
          validFrom: m.validFrom,
          validTo: m.validTo,
          status: MembershipStatus.ACTIVE,
          paymentRef: String(Date.now() + Math.random() * 10000),
        },
      })
      await prisma.payment.create({
        data: {
          userId: user.id,
          type: "MEMBERSHIP_FEE",
          status: "SUCCESS",
          amount: m.amountPaid,
          payosOrderCode: `MEM-${user.id.slice(-4)}-${m.validFrom.getFullYear()}${String(Math.floor(Math.random() * 10000))}`,
          membershipId: membership.id,
          description: `Phí hội viên ${m.validFrom.getFullYear()}`,
        },
      })
    }

    vipUsers.push({ id: user.id, email: user.email, name: user.name, contributionTotal: userData.contributionTotal })
    console.log(`✅ VIP: ${user.email} (${userData.contributionTotal / 1_000_000}tr — ${userData.contributionTotal >= 20_000_000 ? "Vàng" : userData.contributionTotal >= 10_000_000 ? "Bạc" : "Cơ bản"})`)
  }

  // ============================================================
  // 4. PRODUCTS — 12-15 sản phẩm đa dạng
  // ============================================================
  const companies = await prisma.company.findMany({ select: { id: true, slug: true, ownerId: true, name: true } })
  const productData: { companySlug: string; name: string; slug: string; description: string; category: string; priceRange: string; certStatus: CertStatus; certAppliedAt?: Date; certApprovedAt?: Date }[] = [
    // Khánh Hòa — 3 SP (2 APPROVED, 1 PENDING)
    { companySlug: "tram-huong-khanh-hoa", name: "Trầm Hương Tự Nhiên Khánh Hòa Loại A", slug: "tram-huong-tu-nhien-khanh-hoa-loai-a", description: "Trầm hương tự nhiên 100% khai thác từ rừng nguyên sinh Khánh Hòa. Cây dó bầu trên 25 năm tuổi, hương thơm thanh nhã đặc trưng vùng Nam Trung Bộ. Phù hợp dùng trong thiền định, phong thủy và sưu tầm.", category: "Trầm tự nhiên", priceRange: "10tr-50tr", certStatus: CertStatus.APPROVED, certAppliedAt: new Date("2025-11-01"), certApprovedAt: new Date("2025-12-15") },
    { companySlug: "tram-huong-khanh-hoa", name: "Tinh Dầu Trầm Hương Nguyên Chất 10ml", slug: "tinh-dau-tram-huong-nguyen-chat-10ml", description: "Tinh dầu trầm hương chiết xuất lạnh, nguyên chất 100%. Không pha trộn, không hóa chất. Phù hợp dùng trong liệu pháp hương thơm, thiền định và xông phòng.", category: "Tinh dầu", priceRange: "2tr-5tr", certStatus: CertStatus.APPROVED, certAppliedAt: new Date("2026-01-15"), certApprovedAt: new Date("2026-02-20") },
    { companySlug: "tram-huong-khanh-hoa", name: "Vòng Tay Trầm Hương Sánh Chìm", slug: "vong-tay-tram-huong-sanh-chim", description: "Vòng tay trầm hương sánh chìm nước — dòng cao cấp nhất. Hạt tròn đều 12mm, vân gỗ tự nhiên, mùi thơm bền lâu. Sản phẩm phong thủy và thời trang cao cấp.", category: "Vòng đeo", priceRange: "5tr-20tr", certStatus: CertStatus.PENDING, certAppliedAt: daysAgo(5) },
    // Quảng Nam — 2 SP (1 APPROVED, 1 DRAFT)
    { companySlug: "tram-huong-quang-nam", name: "Trầm Hương Nuôi Cấy Quảng Nam Premium", slug: "tram-huong-nuoi-cay-quang-nam-premium", description: "Trầm hương nuôi cấy bằng công nghệ vi sinh tiên tiến. Cây dó bầu 8-12 năm tuổi, trồng tại vùng núi Tiên Phước. Chất lượng ổn định, hương thơm đậm đà, giá thành hợp lý hơn trầm tự nhiên.", category: "Trầm tự nhiên", priceRange: "3tr-15tr", certStatus: CertStatus.APPROVED, certAppliedAt: new Date("2026-01-01"), certApprovedAt: new Date("2026-02-01") },
    { companySlug: "tram-huong-quang-nam", name: "Bột Trầm Hương Xông Phòng", slug: "bot-tram-huong-xong-phong", description: "Bột trầm hương mịn, nghiền từ gỗ trầm tự nhiên. Dùng để xông phòng, tạo không gian thư giãn. Đóng gói 50g/hộp, bảo quản kín.", category: "Trầm tự nhiên", priceRange: "500k-1tr", certStatus: CertStatus.DRAFT },
    // Sài Gòn — 2 SP (1 APPROVED, 1 REJECTED)
    { companySlug: "tinh-dau-tram-huong-sai-gon", name: "Tinh Dầu Trầm Hương Sài Gòn 5ml", slug: "tinh-dau-tram-huong-sai-gon-5ml", description: "Tinh dầu trầm hương chưng cất hơi nước, đạt tiêu chuẩn xuất khẩu Nhật Bản. Hương thơm thanh mát, không gắt. Chai thủy tinh tối màu bảo quản tốt.", category: "Tinh dầu", priceRange: "1tr-3tr", certStatus: CertStatus.APPROVED, certAppliedAt: new Date("2025-10-01"), certApprovedAt: new Date("2025-11-10") },
    { companySlug: "tinh-dau-tram-huong-sai-gon", name: "Nước Hoa Trầm Hương EDT 30ml", slug: "nuoc-hoa-tram-huong-edt-30ml", description: "Nước hoa tinh chất trầm hương pha trộn với gỗ đàn hương và hoa nhài. Hương trầm ấm đặc trưng, lưu hương 6-8 tiếng.", category: "Tinh dầu", priceRange: "500k-1tr", certStatus: CertStatus.REJECTED },
    // Bình Phước — 2 SP
    { companySlug: "nhang-thom-tram-viet", name: "Nhang Trầm Hương Thủ Công 40cm", slug: "nhang-tram-huong-thu-cong-40cm", description: "Nhang trầm hương se tay thủ công từ bột trầm tự nhiên Bình Phước. Không hóa chất, cháy đều, tàn cuộn đẹp. Hộp 100 cây, thời gian cháy 45-50 phút/cây.", category: "Nhang trầm", priceRange: "200k-500k", certStatus: CertStatus.APPROVED, certAppliedAt: new Date("2026-02-01"), certApprovedAt: new Date("2026-03-10") },
    { companySlug: "nhang-thom-tram-viet", name: "Nụ Trầm Hương Thất Thốn", slug: "nu-tram-huong-that-thon", description: "Nụ trầm hương dạng hình nón, đốt trên lư đồng hoặc lư sứ. Khói thơm quyện tụ, tạo không gian trang nghiêm cho bàn thờ gia tiên.", category: "Nhang trầm", priceRange: "100k-300k", certStatus: CertStatus.DRAFT },
    // Hà Tĩnh — 2 SP
    { companySlug: "tram-huong-ha-tinh", name: "Trầm Hương Miếng Hà Tĩnh Loại 1", slug: "tram-huong-mieng-ha-tinh-loai-1", description: "Trầm hương miếng tự nhiên từ vùng Hương Sơn. Vân gỗ đẹp, hàm lượng tinh dầu cao, phù hợp chưng cất hoặc sưu tầm. Mỗi miếng 50-100g.", category: "Trầm tự nhiên", priceRange: "5tr-20tr", certStatus: CertStatus.UNDER_REVIEW, certAppliedAt: daysAgo(10) },
    { companySlug: "tram-huong-ha-tinh", name: "Vòng Trầm Hương Hương Sơn 8mm", slug: "vong-tram-huong-huong-son-8mm", description: "Vòng tay trầm hương hạt 8mm, 108 hạt. Nguyên liệu từ gỗ dó bầu Hương Sơn. Phù hợp đeo hàng ngày, vừa phong thủy vừa thời trang.", category: "Vòng đeo", priceRange: "1tr-3tr", certStatus: CertStatus.DRAFT },
    // Đắk Nông — 1 SP
    { companySlug: "tram-huong-dak-nong", name: "Cây Dó Bầu Giống Nuôi Cấy", slug: "cay-do-bau-giong-nuoi-cay", description: "Cung cấp cây dó bầu giống 1-2 năm tuổi, đã xử lý vi sinh. Phù hợp trồng tại các tỉnh Tây Nguyên và miền Trung. Cam kết tỷ lệ sống > 90%.", category: "Khác", priceRange: "50k-200k", certStatus: CertStatus.DRAFT },
    // Phú Yên — 2 SP
    { companySlug: "tram-huong-phu-yen", name: "Trầm Hương Sánh Chìm Phú Yên Đặc Biệt", slug: "tram-huong-sanh-chim-phu-yen-dac-biet", description: "Dòng trầm hương cao cấp nhất — sánh chìm nước. Hàm lượng tinh dầu >25%, vân sánh đều, hương thơm ngọt dịu tự nhiên. Dành cho giới sưu tầm và phong thủy cao cấp.", category: "Trầm tự nhiên", priceRange: "50tr-200tr", certStatus: CertStatus.APPROVED, certAppliedAt: new Date("2025-09-01"), certApprovedAt: new Date("2025-10-15") },
    { companySlug: "tram-huong-phu-yen", name: "Trầm Hương Xông Nhà Cao Cấp", slug: "tram-huong-xong-nha-cao-cap", description: "Trầm hương dạng mảnh nhỏ dùng đốt xông nhà. Hương thơm tự nhiên, khử mùi hiệu quả, mang lại cảm giác thư thái. Hộp 200g.", category: "Trầm tự nhiên", priceRange: "1tr-3tr", certStatus: CertStatus.DRAFT },
  ]

  const createdProducts: { id: string; slug: string; companyOwnerId: string; certStatus: CertStatus }[] = []

  for (const pd of productData) {
    const company = companies.find(c => c.slug === pd.companySlug)
    if (!company) continue

    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        name: pd.name,
        slug: pd.slug,
        description: pd.description,
        category: pd.category,
        priceRange: pd.priceRange,
        certStatus: pd.certStatus,
        certAppliedAt: pd.certAppliedAt,
        certApprovedAt: pd.certApprovedAt,
        badgeUrl: pd.certStatus === CertStatus.APPROVED ? "/badge-chung-nhan.png" : null,
        imageUrls: [],
        isPublished: true,
      },
    })

    // Create certification records for non-DRAFT products
    if (pd.certStatus !== CertStatus.DRAFT) {
      await prisma.certification.create({
        data: {
          productId: product.id,
          applicantId: company.ownerId,
          status: pd.certStatus,
          documentUrls: [],
          applicantNote: `Sản phẩm ${pd.name} được sản xuất theo quy trình khép kín, có đầy đủ giấy tờ kiểm nghiệm.`,
          isOnlineReview: true,
          feePaid: 5_000_000,
          refundBankName: "Vietcombank",
          refundAccountName: vipUsers.find(v => v.id === company.ownerId)?.name?.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? "CHU TK",
          refundAccountNo: "0123456789",
          reviewedBy: pd.certStatus === CertStatus.APPROVED || pd.certStatus === CertStatus.REJECTED ? admin.id : null,
          reviewedAt: pd.certApprovedAt ?? (pd.certStatus === CertStatus.REJECTED ? daysAgo(14) : null),
          approvedAt: pd.certApprovedAt,
          rejectedAt: pd.certStatus === CertStatus.REJECTED ? daysAgo(14) : null,
          reviewNote: pd.certStatus === CertStatus.REJECTED ? "Tài liệu kiểm nghiệm không đạt yêu cầu. Vui lòng bổ sung giấy chứng nhận CO/CQ." : pd.certStatus === CertStatus.APPROVED ? "Sản phẩm đạt tiêu chuẩn chất lượng." : null,
        },
      })
    }

    createdProducts.push({ id: product.id, slug: pd.slug, companyOwnerId: company.ownerId, certStatus: pd.certStatus })
  }
  console.log(`✅ Products: ${createdProducts.length} sản phẩm`)

  // ============================================================
  // 5. PENDING PAYMENTS — 2 payment chờ admin confirm
  // ============================================================
  const pendingUser1 = vipUsers.find(v => v.email === "dangvantuan@tramhuongdaknong.vn")!
  const pendingUser2 = vipUsers.find(v => v.email === "buithidao@nhapdoantramhuong.vn")!

  const pendingMembership1 = await prisma.membership.create({
    data: { userId: pendingUser1.id, amountPaid: 10_000_000, validFrom: new Date(), validTo: new Date(), status: MembershipStatus.PENDING_PAYMENT, paymentRef: "PENDING1" },
  })
  await prisma.payment.create({
    data: {
      userId: pendingUser1.id, type: "MEMBERSHIP_FEE", status: "PENDING", amount: 10_000_000,
      payosOrderCode: `HOITRAMHUONG-MEM-DVT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
      membershipId: pendingMembership1.id, description: "Gia hạn hội viên - 10.000.000đ",
    },
  })

  const pendingMembership2 = await prisma.membership.create({
    data: { userId: pendingUser2.id, amountPaid: 5_000_000, validFrom: new Date(), validTo: new Date(), status: MembershipStatus.PENDING_PAYMENT, paymentRef: "PENDING2" },
  })
  await prisma.payment.create({
    data: {
      userId: pendingUser2.id, type: "MEMBERSHIP_FEE", status: "PENDING", amount: 5_000_000,
      payosOrderCode: `HOITRAMHUONG-MEM-BTD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
      membershipId: pendingMembership2.id, description: "Gia hạn hội viên - 5.000.000đ",
    },
  })
  console.log("✅ Pending payments: 2")

  // ============================================================
  // 6. FEED POSTS — 20 bài viết đa dạng
  // ============================================================
  const postContents = [
    { authorIdx: 0, title: "Kinh nghiệm nhận biết trầm hương tự nhiên và trầm giả", content: "<p>Sau 18 năm trong nghề, tôi muốn chia sẻ một số kinh nghiệm nhận biết trầm hương thật — giả mà nhiều người mới vào nghề thường nhầm lẫn.</p><p><strong>Về màu sắc:</strong> Trầm tự nhiên có màu nâu đen không đều, vân gỗ tự nhiên, không có màu sắc đồng nhất như trầm tẩm hóa chất.</p><p><strong>Về hương thơm:</strong> Khi đốt, hương thơm nhẹ nhàng, thanh thoát, lan tỏa từ từ. Trầm giả thường có mùi nồng, gắt, khó chịu sau 2-3 phút.</p><p><strong>Về trọng lượng:</strong> Trầm chìm nước thật sự rất hiếm, chỉ chiếm 5-10% sản lượng. Hầu hết trầm tự nhiên có tỷ trọng nhẹ hơn nước.</p>", daysAgo: 2, viewCount: 156, reactions: 12 },
    { authorIdx: 1, title: "Thị trường trầm hương Quảng Nam Q1/2026 — Phân tích xu hướng", content: "<p>Theo số liệu từ Sở Công Thương Quảng Nam, sản lượng trầm hương nuôi cấy trong Q1/2026 tăng 23% so với cùng kỳ năm trước. Đây là tín hiệu tích cực cho ngành.</p><p>Giá trầm nuôi cấy loại 1 hiện dao động 3-8 triệu/kg, tùy chất lượng và năm tuổi cây. Trầm tự nhiên vẫn giữ giá ổn định 15-50 triệu/kg.</p><p>Thị trường xuất khẩu chính: Nhật Bản (45%), Đài Loan (25%), Trung Quốc (20%), Trung Đông (10%).</p>", daysAgo: 5, viewCount: 89, reactions: 8 },
    { authorIdx: 2, title: "Quy trình chưng cất tinh dầu trầm hương đạt chuẩn xuất khẩu", content: "<p>Để đạt tiêu chuẩn xuất khẩu sang Nhật Bản, tinh dầu trầm hương cần đáp ứng các chỉ tiêu nghiêm ngặt về hàm lượng Agarospirol và Jinkoh-eremol.</p><p>Chúng tôi sử dụng phương pháp chưng cất hơi nước ở nhiệt độ 100-110°C trong 72 giờ liên tục. Nguyên liệu phải được ngâm nước 30 ngày trước khi chưng cất để tách tạp chất.</p>", daysAgo: 8, viewCount: 67, reactions: 5 },
    { authorIdx: 3, title: "Nghệ thuật se nhang trầm hương thủ công — Truyền thống Bình Phước", content: "<p>Nhang trầm hương thủ công khác biệt hoàn toàn so với nhang công nghiệp. Mỗi cây nhang được se tay bởi nghệ nhân có kinh nghiệm trên 10 năm.</p><p>Nguyên liệu: 70% bột trầm hương, 20% bột vỏ cây bời lời (chất kết dính tự nhiên), 10% nước. Tuyệt đối không sử dụng than, hóa chất hay phẩm màu.</p>", daysAgo: 10, viewCount: 45, reactions: 7 },
    { authorIdx: 4, title: "Vùng trầm hương Hà Tĩnh — Lịch sử và tiềm năng phát triển", content: "<p>Hà Tĩnh, đặc biệt là huyện Hương Sơn, có lịch sử khai thác trầm hương hàng trăm năm. Người dân nơi đây gọi trầm hương là 'vàng đen' của núi rừng.</p><p>Hiện tại, diện tích trồng dó bầu tại Hà Tĩnh đạt khoảng 2.000 hecta, tập trung ở các xã Sơn Tiến, Sơn Lâm, Sơn Hồng. Đây là vùng nguyên liệu quan trọng cho ngành trầm hương miền Trung.</p>", daysAgo: 12, viewCount: 38, reactions: 4 },
    { authorIdx: 5, title: "Công nghệ vi sinh trong nuôi cấy trầm hương — Giải pháp bền vững", content: "<p>Trầm hương tự nhiên ngày càng khan hiếm do khai thác quá mức. Nuôi cấy bằng công nghệ vi sinh là giải pháp bền vững cho ngành.</p><p>Tại Đắk Nông, chúng tôi đang áp dụng chủng nấm Fusarium solani để kích thích cây dó bầu tạo trầm. Thời gian từ khi cấy đến khi thu hoạch khoảng 5-7 năm.</p>", daysAgo: 14, viewCount: 52, reactions: 6 },
    { authorIdx: 6, title: "Kinh nghiệm nhập khẩu trầm hương từ Indonesia — Những điều cần biết", content: "<p>Indonesia là nguồn cung trầm hương lớn nhất thế giới, chiếm khoảng 60% sản lượng toàn cầu. Tuy nhiên, việc nhập khẩu không hề đơn giản.</p><p>Cần lưu ý: giấy phép CITES (Convention on International Trade in Endangered Species), chứng nhận xuất xứ C/O, và kiểm dịch thực vật. Nhiều lô hàng bị trả về do thiếu giấy tờ.</p>", daysAgo: 16, viewCount: 34, reactions: 3 },
    { authorIdx: 7, title: "Trầm hương sánh chìm nước — Vì sao quý hiếm?", content: "<p>Trầm sánh chìm nước là dòng trầm hương cao cấp nhất, chỉ chiếm khoảng 2-3% tổng sản lượng trầm tự nhiên. Đặc điểm nổi bật là hàm lượng tinh dầu rất cao (>25%), khiến tỷ trọng nặng hơn nước.</p><p>Giá trầm sánh chìm dao động từ 50 triệu đến vài trăm triệu đồng/kg, tùy vùng nguyên liệu và chất lượng vân sánh.</p>", daysAgo: 18, viewCount: 78, reactions: 11 },
    { authorIdx: 0, title: "Phong thủy và trầm hương — Ý nghĩa tâm linh trong văn hóa Việt", content: "<p>Trong văn hóa Việt Nam, trầm hương không chỉ là sản phẩm thương mại mà còn mang ý nghĩa tâm linh sâu sắc. Người xưa dùng trầm hương trong các nghi lễ cúng tế, thờ cúng gia tiên.</p><p>Về phong thủy, trầm hương được xem là 'ngũ hành' — hội tụ đủ Kim, Mộc, Thủy, Hỏa, Thổ. Đặt trầm hương trong nhà giúp thanh lọc không gian, mang lại may mắn.</p>", daysAgo: 20, viewCount: 123, reactions: 15 },
    { authorIdx: 1, title: "Hội nghị Trầm Hương Quốc tế 2026 tại Nha Trang — Thông báo", content: "<p>Hội Trầm Hương Việt Nam phối hợp với UBND tỉnh Khánh Hòa tổ chức Hội nghị Trầm Hương Quốc tế 2026 tại Nha Trang từ ngày 15-17/6/2026.</p><p>Dự kiến 200+ doanh nghiệp trong và ngoài nước tham gia. Đây là cơ hội quảng bá thương hiệu và kết nối đối tác kinh doanh.</p>", daysAgo: 1, viewCount: 201, reactions: 14 },
    // Thêm bài cũ hơn để đa dạng timeline
    { authorIdx: 2, title: "Tinh dầu trầm hương trong y học cổ truyền Đông phương", content: "<p>Theo y học cổ truyền, trầm hương có vị cay, tính ôn, quy kinh Tỳ, Vị, Thận. Công dụng: hành khí, ôn trung, giảm đau, an thần.</p><p>Tinh dầu trầm hương được sử dụng trong xoa bóp giảm đau khớp, xông hơi trị cảm mạo, và liệu pháp aromatherapy giảm stress.</p>", daysAgo: 22, viewCount: 56, reactions: 7 },
    { authorIdx: 3, title: "Hướng dẫn bảo quản nhang trầm hương đúng cách", content: "<p>Nhang trầm hương cần bảo quản đúng cách để giữ nguyên hương thơm:</p><p>1. Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp<br>2. Đậy kín nắp hộp sau khi sử dụng<br>3. Tránh nơi có mùi hóa chất, nước hoa<br>4. Nhiệt độ bảo quản lý tưởng: 20-25°C, độ ẩm <70%</p>", daysAgo: 25, viewCount: 42, reactions: 5 },
    { authorIdx: 4, title: "So sánh trầm hương Việt Nam và Campuchia — Đặc điểm khác biệt", content: "<p>Trầm hương Việt Nam (chủ yếu loài Aquilaria crassna) và Campuchia (Aquilaria malaccensis) có những đặc điểm khác biệt rõ rệt:</p><p>Về hương: Trầm Việt Nam có hương thanh mát, nhẹ nhàng. Trầm Campuchia hương nồng hơn, đậm hơn.</p><p>Về giá: Trầm Khánh Hòa, Việt Nam thường có giá cao hơn 30-50% do chất lượng vân sánh đẹp hơn.</p>", daysAgo: 28, viewCount: 67, reactions: 9 },
    { authorIdx: 7, title: "Câu chuyện sưu tầm trầm hương — 20 năm đam mê", content: "<p>Tôi bắt đầu sưu tầm trầm hương từ năm 2006, khi tình cờ được một người bạn Nhật Bản tặng một miếng trầm nhỏ. Mùi hương đặc biệt đó đã thay đổi cuộc đời tôi.</p><p>Hiện bộ sưu tập của tôi có hơn 200 mẫu trầm từ khắp Việt Nam, Indonesia, Lào, Campuchia. Mẫu quý nhất là trầm sánh chìm Khánh Hòa, khai thác năm 1995.</p>", daysAgo: 30, viewCount: 89, reactions: 13 },
    // Bài promoted (admin ghim)
    { authorIdx: 0, title: "[THÔNG BÁO] Khai mạc Hội chợ Trầm Hương 2026 — Đăng ký gian hàng", content: "<p>Hội Trầm Hương Việt Nam thông báo mở đăng ký gian hàng Hội chợ Trầm Hương 2026.</p><p>Thời gian: 15-17/6/2026<br>Địa điểm: Trung tâm Hội nghị Quốc tế Nha Trang<br>Phí gian hàng: 5.000.000đ (hội viên) / 10.000.000đ (ngoài hội)</p><p>Liên hệ Ban Quản Trị để đăng ký.</p>", daysAgo: 0, viewCount: 312, reactions: 8 },
  ]

  const createdPosts: string[] = []
  for (let i = 0; i < postContents.length; i++) {
    const pc = postContents[i]
    const authorUser = vipUsers[pc.authorIdx]
    const post = await prisma.post.create({
      data: {
        authorId: authorUser.id,
        title: pc.title,
        content: pc.content,
        imageUrls: [],
        status: PostStatus.PUBLISHED,
        isPremium: true,
        isPromoted: i === postContents.length - 1, // last post is promoted
        authorPriority: Math.floor(authorUser.contributionTotal / 1_000_000),
        viewCount: pc.viewCount,
        createdAt: daysAgo(pc.daysAgo),
      },
    })
    createdPosts.push(post.id)
  }

  // 1 bài bị LOCKED
  await prisma.post.create({
    data: {
      authorId: vipUsers[5].id,
      title: "Bài viết bị khóa do vi phạm",
      content: "<p>Nội dung quảng cáo sản phẩm không liên quan đến trầm hương.</p>",
      imageUrls: [],
      status: PostStatus.LOCKED,
      isPremium: true,
      authorPriority: 5,
      viewCount: 15,
      lockedAt: daysAgo(3),
      lockedBy: admin.id,
      lockReason: "Vi phạm quy định: quảng cáo sản phẩm ngoài ngành",
      createdAt: daysAgo(4),
    },
  })

  // Create reactions (0-15 per post)
  for (let i = 0; i < createdPosts.length; i++) {
    const reactionCount = postContents[i].reactions
    const reactors = vipUsers.slice(0, Math.min(reactionCount, vipUsers.length))
    for (const reactor of reactors) {
      if (reactor.id !== vipUsers[postContents[i].authorIdx].id) {
        try {
          await prisma.postReaction.create({
            data: { postId: createdPosts[i], userId: reactor.id, type: "LIKE" },
          })
        } catch { /* skip duplicates */ }
      }
    }
  }

  // 2 bài có report pending
  await prisma.report.create({
    data: { postId: createdPosts[6], reporterId: vipUsers[0].id, reason: "SPAM", description: "Bài viết quảng cáo dịch vụ nhập khẩu, không phải chia sẻ kinh nghiệm", status: "PENDING" },
  })
  await prisma.report.create({
    data: { postId: createdPosts[6], reporterId: vipUsers[1].id, reason: "INAPPROPRIATE", description: "Nội dung có thể gây hiểu lầm về chất lượng trầm hương nhập khẩu", status: "PENDING" },
  })

  console.log(`✅ Posts: ${createdPosts.length + 1} bài (1 locked, 2 có report)`)

  // ============================================================
  // 7. NEWS — 8 bài tin tức
  // ============================================================
  const newsData = [
    { title: "Hội Trầm Hương Việt Nam chính thức ra mắt website cộng đồng", slug: "ra-mat-website-cong-dong", excerpt: "Nền tảng trực tuyến kết nối doanh nghiệp trầm hương trên toàn quốc.", content: "<p>Ngày hôm nay, Hội Trầm Hương Việt Nam chính thức ra mắt website cộng đồng — nền tảng trực tuyến đầu tiên kết nối các doanh nghiệp trầm hương trên toàn quốc.</p><p>Website cung cấp các tính năng: profile doanh nghiệp, chứng nhận sản phẩm, feed chia sẻ kinh nghiệm, và dịch vụ truyền thông chuyên ngành.</p>", isPinned: true, isPublished: true, publishedAt: daysAgo(3) },
    { title: "Thông báo: Hội chợ Trầm Hương Quốc tế 2026 tại Nha Trang", slug: "hoi-cho-tram-huong-quoc-te-2026", excerpt: "Diễn ra từ 15-17/6/2026, dự kiến 200+ doanh nghiệp tham gia.", content: "<p>Hội chợ Trầm Hương Quốc tế 2026 sẽ diễn ra tại Trung tâm Hội nghị Quốc tế Nha Trang từ ngày 15-17/6/2026.</p><p>Đây là sự kiện thường niên lớn nhất ngành trầm hương Việt Nam, quy tụ doanh nghiệp từ 10+ quốc gia.</p>", isPinned: true, isPublished: true, publishedAt: daysAgo(5) },
    { title: "Hướng dẫn: Quy trình nộp đơn chứng nhận sản phẩm trầm hương", slug: "huong-dan-nop-don-chung-nhan", excerpt: "Hướng dẫn chi tiết 3 bước nộp đơn chứng nhận sản phẩm.", content: "<p>Bước 1: Chọn sản phẩm cần chứng nhận từ danh sách sản phẩm đã tạo trên hệ thống.</p><p>Bước 2: Upload tài liệu kiểm nghiệm, ảnh thực tế, và điền thông tin tài khoản ngân hàng hoàn tiền.</p><p>Bước 3: Xác nhận chuyển khoản phí 5.000.000đ và chờ admin xét duyệt trong 7 ngày làm việc.</p>", isPinned: false, isPublished: true, publishedAt: daysAgo(7) },
    { title: "Kim ngạch xuất khẩu trầm hương Việt Nam đạt kỷ lục mới", slug: "kim-ngach-xuat-khau-ky-luc", excerpt: "Năm 2025, xuất khẩu trầm hương đạt 52 triệu USD, tăng 18% so với 2024.", content: "<p>Theo số liệu Tổng cục Hải quan, kim ngạch xuất khẩu trầm hương và các sản phẩm từ trầm của Việt Nam năm 2025 đạt 52 triệu USD, tăng 18% so với năm trước.</p><p>Nhật Bản tiếp tục là thị trường lớn nhất (45%), tiếp theo là Đài Loan (22%) và Trung Quốc (18%).</p>", isPinned: false, isPublished: true, publishedAt: daysAgo(14) },
    { title: "Khánh Hòa: Vùng trầm hương lớn nhất cả nước đang đối mặt thách thức", slug: "khanh-hoa-vung-tram-huong-thach-thuc", excerpt: "Tình trạng khai thác quá mức và biến đổi khí hậu đe dọa nguồn trầm tự nhiên.", content: "<p>Khánh Hòa — vùng sản xuất trầm hương tự nhiên lớn nhất Việt Nam — đang đối mặt với nhiều thách thức lớn.</p><p>Diện tích rừng tự nhiên có cây dó bầu giảm 30% trong 10 năm qua. Các chuyên gia khuyến cáo cần chuyển đổi sang mô hình nuôi cấy bền vững.</p>", isPinned: false, isPublished: true, publishedAt: daysAgo(21) },
    { title: "Hội viên mới tháng 3/2026 — Chào mừng 5 doanh nghiệp", slug: "hoi-vien-moi-thang-3-2026", excerpt: "5 doanh nghiệp trầm hương từ Khánh Hòa, Quảng Nam, Đắk Lắk gia nhập hội.", content: "<p>Hội Trầm Hương Việt Nam chào mừng 5 hội viên mới gia nhập trong tháng 3/2026. Nâng tổng số hội viên lên 87/100 slot.</p>", isPinned: false, isPublished: true, publishedAt: daysAgo(10) },
    { title: "Kiến thức: Phân biệt các loại trầm hương theo vùng miền", slug: "phan-biet-tram-huong-theo-vung-mien", excerpt: "Hướng dẫn chi tiết đặc điểm trầm hương từ 5 vùng chính tại Việt Nam.", content: "<p>Trầm hương Việt Nam có đặc điểm khác biệt rõ rệt theo từng vùng miền:</p><p><strong>Khánh Hòa:</strong> Hương thanh, nhẹ, vân sánh đẹp. Giá cao nhất.</p><p><strong>Quảng Nam:</strong> Hương đậm, ấm. Phù hợp làm nhang và bột xông.</p><p><strong>Hà Tĩnh:</strong> Hương ngọt dịu, gỗ mềm. Phù hợp điêu khắc.</p><p><strong>Bình Phước:</strong> Nuôi cấy nhiều, giá thành hợp lý.</p><p><strong>Phú Yên:</strong> Trầm sánh chìm nổi tiếng, dành cho sưu tầm.</p>", isPinned: false, isPublished: true, publishedAt: daysAgo(17) },
    { title: "[DRAFT] Chính sách hội viên năm 2027 — Dự thảo", slug: "chinh-sach-hoi-vien-2027-du-thao", excerpt: "Dự thảo chính sách mới cho năm 2027.", content: "<p>Đây là bản dự thảo, chưa công bố chính thức. Nội dung đang được Ban Quản Trị thảo luận.</p>", isPinned: false, isPublished: false, publishedAt: null },
  ]

  for (const n of newsData) {
    await prisma.news.create({
      data: { ...n, authorId: admin.id },
    })
  }
  console.log(`✅ News: ${newsData.length} bài (1 draft)`)

  // ============================================================
  // 8. MEDIA ORDER — 1 đơn IN_PROGRESS
  // ============================================================
  await prisma.mediaOrder.create({
    data: {
      requesterId: vipUsers[0].id,
      requesterName: vipUsers[0].name,
      requesterEmail: vipUsers[0].email,
      requesterPhone: "0905 123 456",
      serviceType: MediaServiceType.ARTICLE_COMPANY,
      status: MediaOrderStatus.IN_PROGRESS,
      requirements: "Viết bài giới thiệu công ty Trầm Hương Khánh Hòa — 1500 từ, tập trung vào lịch sử 18 năm phát triển, thế mạnh trầm tự nhiên vùng Khánh Hòa. Tối ưu SEO cho từ khóa 'trầm hương Khánh Hòa', 'trầm hương tự nhiên'.",
      targetKeywords: "trầm hương Khánh Hòa, trầm hương tự nhiên, mua trầm hương uy tín",
      budget: "5-10 triệu",
      deadline: daysFromNow(14),
      assignedTo: "editor@hoitramhuong.vn",
      quotedPrice: 5_000_000,
      internalNote: "Khách VIP Vàng, ưu tiên xử lý. Đã có đủ tư liệu về công ty.",
    },
  })
  console.log("✅ Media order: 1 (IN_PROGRESS)")

  // ============================================================
  // 9. TAGS
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
  console.log("\n" + "═".repeat(55))
  console.log("🎉 SEED HOÀN TẤT — TỔNG KẾT")
  console.log("═".repeat(55))
  console.log(`Admin:         1 (admin@hoitramhuong.vn)`)
  console.log(`VIP:           ${vipUsers.length} hội viên`)
  console.log(`  ★★★ Vàng:    ${vipUsers.filter(v => v.contributionTotal >= 20_000_000).length}`)
  console.log(`  ★★ Bạc:      ${vipUsers.filter(v => v.contributionTotal >= 10_000_000 && v.contributionTotal < 20_000_000).length}`)
  console.log(`  ★ Cơ bản:    ${vipUsers.filter(v => v.contributionTotal < 10_000_000).length}`)
  console.log(`Companies:     ${companies.length}`)
  console.log(`Products:      ${createdProducts.length}`)
  console.log(`  APPROVED:    ${createdProducts.filter(p => p.certStatus === CertStatus.APPROVED).length}`)
  console.log(`  PENDING:     ${createdProducts.filter(p => p.certStatus === CertStatus.PENDING).length}`)
  console.log(`  UNDER_REVIEW:${createdProducts.filter(p => p.certStatus === CertStatus.UNDER_REVIEW).length}`)
  console.log(`  REJECTED:    ${createdProducts.filter(p => p.certStatus === CertStatus.REJECTED).length}`)
  console.log(`Posts:         ${createdPosts.length + 1} (1 locked)`)
  console.log(`News:          ${newsData.length} (1 draft)`)
  console.log(`Pending CK:    2 payments`)
  console.log(`Media order:   1 (IN_PROGRESS)`)
  console.log(`Reports:       2 pending`)
  console.log("─".repeat(55))
  console.log("Password:      Demo@123")
  console.log("Admin:         admin@hoitramhuong.vn")
  vipUsers.forEach(v => {
    const tier = v.contributionTotal >= 20_000_000 ? "★★★" : v.contributionTotal >= 10_000_000 ? "★★" : "★"
    console.log(`VIP ${tier}:       ${v.email}`)
  })
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
