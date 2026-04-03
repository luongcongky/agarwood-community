// prisma/seed.ts
// Chạy: npx prisma db seed

import { PrismaClient, Role, MembershipStatus, CertStatus, PostStatus, MediaServiceType, MediaOrderStatus } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Bắt đầu seed data...")

  // ----------------------------------------------------------
  // 1. SITE CONFIG
  // ----------------------------------------------------------
  await prisma.siteConfig.createMany({
    skipDuplicates: true,
    data: [
      { key: "membership_fee_min",  value: "5000000",  description: "Phí hội viên tối thiểu (VND)" },
      { key: "membership_fee_max",  value: "10000000", description: "Phí hội viên tối đa (VND)" },
      { key: "cert_fee",            value: "5000000",  description: "Phí xét duyệt chứng nhận SP (VND)" },
      { key: "association_name",    value: "Hội Trầm Hương Việt Nam", description: "Tên hội" },
      { key: "association_email",   value: "info@hoi-tram-huong.vn", description: "Email liên hệ" },
      { key: "association_phone",   value: "0901234567", description: "Số điện thoại liên hệ" },
      { key: "max_vip_accounts",    value: "100",      description: "Số tài khoản VIP tối đa" },
    ],
  })
  console.log("✅ Site config")

  // ----------------------------------------------------------
  // 2. ADMIN USER
  // ----------------------------------------------------------
  const adminPassword = await hash("Admin@123456", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@hoi-tram-huong.vn" },
    update: {},
    create: {
      email:            "admin@hoi-tram-huong.vn",
      name:             "Ban Quản Trị Hội",
      phone:            "0901234567",
      role:             Role.ADMIN,
      isActive:         true,
      contributionTotal: 0,
      displayPriority:  999, // admin luôn ở trên cùng nếu cần
      accounts: {
        create: {
          type:              "credentials",
          provider:          "credentials",
          providerAccountId: "admin@hoi-tram-huong.vn",
        }
      }
    },
  })
  console.log("✅ Admin user:", admin.email)

  // ----------------------------------------------------------
  // 3. VIP USERS (3 mẫu với mức đóng góp khác nhau)
  // ----------------------------------------------------------
  const vipData = [
    {
      email:             "nguyen.van.a@tramhuong-hn.vn",
      name:              "Nguyễn Văn A",
      phone:             "0912345678",
      contributionTotal: 20000000, // đóng 2 năm × 10tr
      displayPriority:   20000000,
      bankAccountName:   "NGUYEN VAN A",
      bankAccountNumber: "1234567890",
      bankName:          "Vietcombank",
      company: {
        name:         "Trầm Hương Hà Nội",
        slug:         "tram-huong-ha-noi",
        description:  "Chuyên cung cấp trầm hương tự nhiên cao cấp khu vực miền Bắc",
        foundedYear:  2010,
        address:      "123 Phố Huế, Hà Nội",
      }
    },
    {
      email:             "tran.thi.b@tramhuong-hcm.vn",
      name:              "Trần Thị B",
      phone:             "0923456789",
      contributionTotal: 15000000, // đóng 2 năm × 7.5tr
      displayPriority:   15000000,
      bankAccountName:   "TRAN THI B",
      bankAccountNumber: "9876543210",
      bankName:          "Techcombank",
      company: {
        name:        "Công Ty TNHH Trầm Hương Sài Gòn",
        slug:        "tram-huong-sai-gon",
        description: "Sản xuất và xuất khẩu tinh dầu trầm hương, nhang trầm chất lượng cao",
        foundedYear: 2015,
        address:     "456 Nguyễn Trãi, TP.HCM",
      }
    },
    {
      email:             "le.van.c@tramhuong-dn.vn",
      name:              "Lê Văn C",
      phone:             "0934567890",
      contributionTotal: 5000000, // mới vào, đóng 1 năm × 5tr
      displayPriority:   5000000,
      bankAccountName:   "LE VAN C",
      bankAccountNumber: "1122334455",
      bankName:          "BIDV",
      company: {
        name:        "Trầm Hương Đà Nẵng",
        slug:        "tram-huong-da-nang",
        description: "Khai thác và chế biến trầm hương tự nhiên vùng miền Trung",
        foundedYear: 2018,
        address:     "789 Trần Phú, Đà Nẵng",
      }
    },
  ]

  const vipUsers = []
  for (const vip of vipData) {
    const { company: companyData, ...userData } = vip
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        role:             Role.VIP,
        isActive:         true,
        membershipExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm từ hôm nay
        accounts: {
          create: {
            type:              "credentials",
            provider:          "credentials",
            providerAccountId: userData.email,
          }
        },
        company: {
          create: {
            ...companyData,
            isVerified:  true,
            isPublished: true,
          }
        }
      },
      include: { company: true }
    })
    vipUsers.push(user)
    console.log("✅ VIP user:", user.email)
  }

  // ----------------------------------------------------------
  // 4. MEMBERSHIPS
  // ----------------------------------------------------------
  const membershipData = [
    { userId: vipUsers[0].id, amountPaid: 10000000, validFrom: new Date("2024-01-01"), validTo: new Date("2024-12-31"), paymentRef: "PAYOS_001" },
    { userId: vipUsers[0].id, amountPaid: 10000000, validFrom: new Date("2025-01-01"), validTo: new Date("2025-12-31"), paymentRef: "PAYOS_002" },
    { userId: vipUsers[1].id, amountPaid: 7500000,  validFrom: new Date("2024-06-01"), validTo: new Date("2025-05-31"), paymentRef: "PAYOS_003" },
    { userId: vipUsers[1].id, amountPaid: 7500000,  validFrom: new Date("2025-06-01"), validTo: new Date("2026-05-31"), paymentRef: "PAYOS_004" },
    { userId: vipUsers[2].id, amountPaid: 5000000,  validFrom: new Date("2025-10-01"), validTo: new Date("2026-09-30"), paymentRef: "PAYOS_005" },
  ]

  for (const m of membershipData) {
    await prisma.membership.create({
      data: { ...m, status: MembershipStatus.ACTIVE }
    })
  }
  console.log("✅ Memberships:", membershipData.length, "records")

  // ----------------------------------------------------------
  // 5. PRODUCTS & CERTIFICATIONS
  // ----------------------------------------------------------
  const companies = await prisma.company.findMany()

  // Sản phẩm của công ty 1 — đã được chứng nhận
  const product1 = await prisma.product.create({
    data: {
      companyId:   companies[0].id,
      name:        "Trầm Hương Tự Nhiên Khánh Hòa Loại A",
      slug:        "tram-huong-tu-nhien-khanh-hoa-loai-a",
      description: "Trầm hương tự nhiên 100% từ vùng Khánh Hòa, độ tuổi cây trên 20 năm, hương thơm đặc trưng, đạt tiêu chuẩn xuất khẩu.",
      category:    "Trầm tự nhiên",
      priceRange:  "10tr-50tr",
      certStatus:  CertStatus.APPROVED,
      certAppliedAt:  new Date("2025-03-01"),
      certApprovedAt: new Date("2025-03-15"),
      imageUrls:   ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
      badgeUrl:    "https://res.cloudinary.com/demo/image/upload/badge_certified.png",
      isPublished: true,
    }
  })

  // Sản phẩm của công ty 2 — đang chờ xét duyệt
  const product2 = await prisma.product.create({
    data: {
      companyId:   companies[1].id,
      name:        "Tinh Dầu Trầm Hương Nguyên Chất 10ml",
      slug:        "tinh-dau-tram-huong-nguyen-chat-10ml",
      description: "Tinh dầu trầm hương chiết xuất lạnh, nguyên chất 100%, không pha trộn, phù hợp dùng trong liệu pháp hương thơm và thiền định.",
      category:    "Tinh dầu",
      priceRange:  "500k-2tr",
      certStatus:  CertStatus.PENDING,
      certAppliedAt: new Date("2026-03-01"),
      imageUrls:   [],
      isPublished: true,
    }
  })

  console.log("✅ Products:", 2)

  // Certification record cho product2
  await prisma.certification.create({
    data: {
      productId:         product2.id,
      applicantId:       vipUsers[1].id,
      status:            CertStatus.PENDING,
      feePaid:           500000000,
      isOnlineReview:    true,
      refundBankName:    "Techcombank",
      refundAccountName: "TRAN THI B",
      refundAccountNo:   "9876543210",
      documentUrls:      ["https://res.cloudinary.com/demo/image/upload/sample_doc.pdf"],
      applicantNote:     "Sản phẩm được sản xuất theo quy trình khép kín, có đầy đủ giấy tờ kiểm nghiệm.",
    }
  })
  console.log("✅ Certifications")

  // ----------------------------------------------------------
  // 6. POSTS — bài viết mạng xã hội
  // ----------------------------------------------------------
  const postsData = [
    {
      authorId:       vipUsers[0].id,
      title:          "Chia sẻ kinh nghiệm nhận biết trầm hương tự nhiên",
      content:        "Trầm hương tự nhiên có những đặc điểm nhận biết rõ ràng mà không phải ai cũng biết. Sau 15 năm trong nghề, tôi muốn chia sẻ một số kinh nghiệm quý báu...\n\nMàu sắc: Trầm tự nhiên thường có màu nâu đen không đều, vân gỗ tự nhiên, không có màu sắc đồng nhất.\n\nMùi hương: Khi đốt, hương thơm nhẹ nhàng, thanh thoát, không gắt, không có mùi hóa chất.",
      isPremium:      true,
      authorPriority: vipUsers[0].contributionTotal,
      imageUrls:      ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
      status:         PostStatus.PUBLISHED,
    },
    {
      authorId:       vipUsers[1].id,
      title:          "Thị trường tinh dầu trầm hương xuất khẩu Q1/2026",
      content:        "Theo số liệu mới nhất từ Tổng cục Hải quan, kim ngạch xuất khẩu tinh dầu trầm hương Việt Nam trong Q1/2026 đạt 12,5 triệu USD, tăng 23% so với cùng kỳ năm trước...",
      isPremium:      true,
      authorPriority: vipUsers[1].contributionTotal,
      imageUrls:      [],
      status:         PostStatus.PUBLISHED,
    },
    {
      authorId:       vipUsers[2].id,
      title:          "Giới thiệu vùng trầm hương Quảng Nam",
      content:        "Quảng Nam từ lâu đã nổi tiếng với những cánh rừng trầm hương tự nhiên quý hiếm. Bài viết này giới thiệu đôi nét về vùng nguyên liệu đặc biệt này...",
      isPremium:      true,
      authorPriority: vipUsers[2].contributionTotal,
      imageUrls:      [],
      status:         PostStatus.PUBLISHED,
    },
  ]

  for (const post of postsData) {
    await prisma.post.create({ data: post })
  }
  console.log("✅ Posts:", postsData.length)

  // ----------------------------------------------------------
  // 7. NEWS
  // ----------------------------------------------------------
  await prisma.news.createMany({
    data: [
      {
        title:        "Hội Trầm Hương Việt Nam ra mắt website cộng đồng chính thức",
        slug:         "ra-mat-website-cong-dong",
        excerpt:      "Hội Trầm Hương Việt Nam chính thức ra mắt nền tảng cộng đồng trực tuyến, tạo không gian kết nối cho các doanh nghiệp trong ngành.",
        content:      "Ngày hôm nay, Hội Trầm Hương Việt Nam chính thức ra mắt website cộng đồng...",
        isPublished:  true,
        isPinned:     true,
        publishedAt:  new Date(),
        authorId:     admin.id,
        coverImageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      },
      {
        title:       "Thông báo: Khai mạc Hội chợ Trầm Hương Quốc tế 2026",
        slug:        "hoi-cho-tram-huong-quoc-te-2026",
        excerpt:     "Hội chợ Trầm Hương Quốc tế 2026 sẽ diễn ra tại Hà Nội từ ngày 15-17/6/2026.",
        content:     "Ban tổ chức Hội chợ Trầm Hương Quốc tế 2026 trân trọng thông báo...",
        isPublished: true,
        isPinned:    false,
        publishedAt: new Date(),
        authorId:    admin.id,
      },
    ]
  })
  console.log("✅ News")

  // ----------------------------------------------------------
  // 8. MEDIA ORDER MẪU
  // ----------------------------------------------------------
  await prisma.mediaOrder.create({
    data: {
      requesterId:    vipUsers[0].id,
      requesterName:  vipUsers[0].name,
      requesterEmail: vipUsers[0].email,
      requesterPhone: vipUsers[0].phone!,
      serviceType:    MediaServiceType.ARTICLE_COMPANY,
      status:         MediaOrderStatus.IN_PROGRESS,
      requirements:   "Viết bài giới thiệu công ty 1000 từ, tập trung vào thế mạnh trầm tự nhiên Khánh Hòa, định hướng SEO từ khóa 'trầm hương Khánh Hòa'.",
      targetKeywords: "trầm hương Khánh Hòa, trầm hương tự nhiên, trầm hương cao cấp",
      quotedPrice:    3000000,
      assignedTo:     "editor@hoi-tram-huong.vn",
      internalNote:   "Khách hàng VIP, ưu tiên xử lý trong tuần này",
    }
  })
  console.log("✅ Media order mẫu")

  // ----------------------------------------------------------
  // 9. TAGS
  // ----------------------------------------------------------
  await prisma.tag.createMany({
    skipDuplicates: true,
    data: [
      { name: "Trầm tự nhiên",   slug: "tram-tu-nhien" },
      { name: "Tinh dầu",        slug: "tinh-dau" },
      { name: "Xuất khẩu",       slug: "xuat-khau" },
      { name: "Thị trường",      slug: "thi-truong" },
      { name: "Kỹ thuật",        slug: "ky-thuat" },
      { name: "Kinh nghiệm",     slug: "kinh-nghiem" },
      { name: "Sản phẩm mới",    slug: "san-pham-moi" },
      { name: "Hội viên chia sẻ", slug: "hoi-vien-chia-se" },
    ]
  })
  console.log("✅ Tags")

  console.log("\n🎉 Seed hoàn tất!")
  console.log("─────────────────────────────────────")
  console.log("Admin:   admin@hoi-tram-huong.vn")
  console.log("VIP 1:   nguyen.van.a@tramhuong-hn.vn   (contribution: 20tr)")
  console.log("VIP 2:   tran.thi.b@tramhuong-hcm.vn    (contribution: 15tr)")
  console.log("VIP 3:   le.van.c@tramhuong-dn.vn        (contribution: 5tr)")
  console.log("Password mặc định tất cả: Admin@123456")
  console.log("─────────────────────────────────────")
}

main()
  .catch((e) => {
    console.error("❌ Seed thất bại:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
