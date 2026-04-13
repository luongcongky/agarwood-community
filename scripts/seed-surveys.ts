/**
 * Seed 2 khảo sát chính: Hội viên Cá nhân + Hội viên Doanh nghiệp.
 *
 * Mục đích kép:
 *  1. Thu thập thông tin chi tiết hội viên → đồng bộ về User/Company qua mapsTo
 *  2. Giới thiệu & làm nổi bật quyền lợi của nền tảng số (description)
 *
 * Run: npx tsx scripts/seed-surveys.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { config } from "dotenv"
config({ path: ".env.local" })

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ────────────────────────────────────────────────────────────────
// DESCRIPTION — marketing copy cho từng khảo sát
// Dùng xuống dòng \n — giao diện render với whitespace-pre-line
// ────────────────────────────────────────────────────────────────

const BUSINESS_DESCRIPTION = `🌟 KHẢO SÁT HỘI VIÊN DOANH NGHIỆP — NHIỆM KỲ SỐ HÓA 2026

Chào mừng Quý doanh nghiệp!

Hội Trầm Hương Việt Nam đang bước vào giai đoạn chuyển đổi số mạnh mẽ, đem lại nhiều quyền lợi mới mà hội viên trước đây chưa được tiếp cận. Khảo sát này giúp Ban Quản trị:

  • Hoàn thiện hồ sơ doanh nghiệp của Quý vị trên hệ thống
  • Gợi ý gói quyền lợi phù hợp nhất (Cơ bản / Bạc / Vàng)
  • Kết nối Quý vị với đối tác, thị trường xuất khẩu, cơ hội truyền thông

⏱ Chỉ mất 3-5 phút — câu trả lời sẽ tự động cập nhật vào hồ sơ doanh nghiệp.`

const INDIVIDUAL_DESCRIPTION = `🌿 KHẢO SÁT HỘI VIÊN CÁ NHÂN — NHIỆM KỲ SỐ HÓA 2026

Xin chào Quý hội viên!

Nền tảng số của Hội Trầm Hương Việt Nam đã chính thức ra mắt với nhiều tính năng mới. Chúng tôi mong muốn hiểu rõ hơn về Quý vị để phục vụ tốt hơn:

  • Kết nối cộng đồng những người yêu trầm hương
  • Chứng nhận chuyên môn cá nhân (nghệ nhân, chuyên gia)
  • Cơ hội tham gia sự kiện, đào tạo, giao thương
  • Cập nhật nghiên cứu khoa học mới nhất về trầm hương

⏱ Chỉ 2-3 phút — câu trả lời giúp Hội tổ chức hoạt động phù hợp với bạn.`

// ────────────────────────────────────────────────────────────────
// QUESTIONS
// ────────────────────────────────────────────────────────────────

const businessQuestions = [
  // Lưu ý: name/email/phone/companyName/logo được thu thập ở Bước 1 (contact step)
  // nên không lặp lại ở đây. Các câu dưới chỉ là thông tin chuyên môn bổ sung.
  {
    id: "founded_year",
    label: "Năm thành lập",
    type: "number",
    required: false,
    mapsTo: "company.foundedYear",
  },
  {
    id: "business_license",
    label: "Mã số giấy phép kinh doanh",
    type: "text",
    required: false,
    mapsTo: "company.businessLicense",
  },
  {
    id: "representative_name",
    label: "Người đại diện pháp luật",
    type: "text",
    required: true,
    mapsTo: "company.representativeName",
  },
  {
    id: "representative_position",
    label: "Chức vụ người đại diện",
    type: "text",
    required: false,
    mapsTo: "company.representativePosition",
    helpText: "VD: Giám đốc, Chủ tịch HĐQT",
  },
  {
    id: "representative_cccd",
    label: "Số CCCD/CMND của người đại diện",
    type: "text",
    required: true,
    helpText: "12 số (CCCD) hoặc 9 số (CMND cũ). Chỉ dùng cho xét duyệt hội viên, được bảo mật.",
  },
  {
    id: "company_address",
    label: "Địa chỉ trụ sở",
    type: "textarea",
    required: false,
    mapsTo: "company.address",
  },
  {
    id: "company_website",
    label: "Website (nếu có)",
    type: "text",
    required: false,
    mapsTo: "company.website",
    helpText: "VD: https://tenthuonghieu.vn",
  },
  {
    id: "company_description",
    label: "Mô tả ngắn về doanh nghiệp",
    type: "textarea",
    required: false,
    mapsTo: "company.description",
    helpText: "Câu chuyện thương hiệu, sản phẩm chủ lực, giá trị cốt lõi (2-3 câu)",
  },

  // ── Quy mô & năng lực (dùng cho recommendation) ──
  {
    id: "employee_count",
    label: "Quy mô nhân sự",
    type: "select",
    options: ["1-10", "10-50", "50-200", "200+"],
    required: true,
    mapsTo: "company.employeeCount",
    scoreRule: { "1-10": 1, "10-50": 3, "50-200": 5, "200+": 7 },
  },
  {
    id: "revenue_range",
    label: "Doanh thu năm gần nhất (khoảng)",
    type: "select",
    options: ["Dưới 1 tỷ", "1-5 tỷ", "5-20 tỷ", "20-100 tỷ", "Trên 100 tỷ"],
    required: false,
    helpText: "Thông tin được bảo mật, chỉ dùng để gợi ý gói hội viên phù hợp",
    scoreRule: {
      "Dưới 1 tỷ": 1,
      "1-5 tỷ": 3,
      "5-20 tỷ": 5,
      "20-100 tỷ": 7,
      "Trên 100 tỷ": 9,
    },
  },
  {
    id: "business_fields",
    label: "Lĩnh vực hoạt động chính (chọn nhiều)",
    type: "multiselect",
    options: [
      "Trồng & khai thác Dó bầu",
      "Chế biến trầm thô",
      "Chế tác thủ công mỹ nghệ",
      "Chưng cất tinh dầu",
      "Sản xuất nhang/trầm viên",
      "Bán lẻ — cửa hàng truyền thống",
      "Bán online (e-commerce)",
      "Xuất khẩu",
      "Nghiên cứu — đào tạo",
    ],
    required: true,
    scoreRule: {
      "Xuất khẩu": 3,
      "Chưng cất tinh dầu": 2,
      "Chế tác thủ công mỹ nghệ": 2,
      "Bán online (e-commerce)": 2,
    },
  },
  {
    id: "target_markets",
    label: "Thị trường chính (chọn nhiều)",
    type: "multiselect",
    options: [
      "Nội địa Việt Nam",
      "Trung Quốc",
      "Đông Nam Á",
      "Trung Đông (UAE, Saudi…)",
      "Châu Âu",
      "Bắc Mỹ",
      "Nhật Bản / Hàn Quốc",
    ],
    required: false,
    scoreRule: {
      "Trung Đông (UAE, Saudi…)": 3,
      "Châu Âu": 3,
      "Bắc Mỹ": 3,
      "Nhật Bản / Hàn Quốc": 2,
      "Trung Quốc": 2,
    },
  },

  // ── Hiện trạng số hóa (pain point) ──
  {
    id: "digital_presence",
    label: "Hiện trạng kênh online của doanh nghiệp",
    type: "select",
    options: [
      "Chưa có gì — đang cần xây dựng",
      "Có fanpage Facebook",
      "Có website giới thiệu",
      "Có shop online / e-commerce",
      "Đang chạy quảng cáo thường xuyên",
    ],
    required: false,
    scoreRule: {
      "Chưa có gì — đang cần xây dựng": 3,
      "Có fanpage Facebook": 2,
      "Có website giới thiệu": 2,
      "Có shop online / e-commerce": 2,
      "Đang chạy quảng cáo thường xuyên": 4,
    },
    helpText: "Giúp Hội đánh giá nhu cầu hỗ trợ truyền thông & marketing",
  },
  {
    id: "pain_points",
    label: "Khó khăn lớn nhất hiện nay (chọn tối đa 3)",
    type: "multiselect",
    options: [
      "Xây dựng thương hiệu / nhận diện",
      "Chứng nhận chất lượng sản phẩm",
      "Kết nối đối tác B2B",
      "Tìm thị trường xuất khẩu",
      "Nguồn vốn mở rộng",
      "Nhân lực có chuyên môn",
      "Cạnh tranh về giá / hàng nhái",
      "Thiếu kênh truyền thông hiệu quả",
    ],
    required: false,
  },
  {
    id: "expectations",
    label: "Kỳ vọng từ nền tảng số của Hội (chọn nhiều)",
    type: "multiselect",
    options: [
      "Trang giới thiệu doanh nghiệp trên Hội",
      "Chứng nhận sản phẩm bởi Hội",
      "Banner quảng cáo trên website Hội",
      "Hỗ trợ truyền thông chính thống",
      "Kết nối với hội viên khác",
      "Tham gia hội chợ / sự kiện xúc tiến",
      "Tư vấn pháp lý, xuất khẩu",
      "Đào tạo nhân sự chuyên môn",
    ],
    required: false,
  },

  // ── Hình ảnh doanh nghiệp (type=files) ──
  {
    id: "store_photos",
    label: "Ảnh cửa hàng / showroom / xưởng sản xuất",
    type: "files",
    maxFiles: 5,
    required: false,
    helpText: "Giúp Hội hiểu quy mô & không gian kinh doanh của bạn. Tối đa 5 ảnh.",
  },
  {
    id: "board_photos",
    label: "Ảnh Ban Giám đốc / Lãnh đạo doanh nghiệp",
    type: "files",
    maxFiles: 5,
    required: false,
    helpText: "Ảnh chân dung Giám đốc, Chủ tịch HĐQT hoặc đại diện lãnh đạo khác.",
  },
  {
    id: "team_photos",
    label: "Ảnh đội ngũ / thành viên quan trọng",
    type: "files",
    maxFiles: 5,
    required: false,
    helpText: "Ảnh tập thể nhân viên, nghệ nhân chủ chốt, team sản xuất...",
  },
]

const individualQuestions = [
  // Lưu ý: name/email/phone được thu thập ở Bước 1 (contact step).
  // Dưới đây chỉ là các câu chuyên môn.
  {
    id: "cccd",
    label: "Số CCCD/CMND của bạn",
    type: "text",
    required: true,
    helpText: "12 số (CCCD) hoặc 9 số (CMND cũ). Chỉ dùng cho xét duyệt hội viên, được bảo mật.",
  },
  {
    id: "role_in_industry",
    label: "Vai trò chính của bạn trong ngành trầm hương",
    type: "select",
    options: [
      "Nghệ nhân / Thợ thủ công",
      "Chủ cơ sở nhỏ (gia đình)",
      "Thương lái / Nhà phân phối",
      "Nhà nghiên cứu / Giảng viên",
      "Chuyên gia tư vấn",
      "Người yêu trầm (sưu tầm, thưởng thức)",
      "Khác",
    ],
    required: true,
    scoreRule: {
      "Nghệ nhân / Thợ thủ công": 3,
      "Chủ cơ sở nhỏ (gia đình)": 4,
      "Thương lái / Nhà phân phối": 4,
      "Nhà nghiên cứu / Giảng viên": 3,
      "Chuyên gia tư vấn": 3,
    },
  },
  {
    id: "years_experience",
    label: "Số năm gắn bó với nghề trầm",
    type: "select",
    options: [
      "Dưới 2 năm",
      "2 – 5 năm",
      "5 – 10 năm",
      "10 – 20 năm",
      "Trên 20 năm",
    ],
    required: false,
    scoreRule: {
      "Dưới 2 năm": 0,
      "2 – 5 năm": 1,
      "5 – 10 năm": 2,
      "10 – 20 năm": 4,
      "Trên 20 năm": 5,
    },
  },
  {
    id: "specializations",
    label: "Sở trường / chuyên môn (chọn nhiều)",
    type: "multiselect",
    options: [
      "Nhận biết trầm tự nhiên",
      "Chế tác trầm mỹ nghệ",
      "Chưng cất tinh dầu trầm",
      "Trồng và chăm sóc cây Dó bầu",
      "Giao thương / xuất nhập khẩu",
      "Nghiên cứu khoa học về trầm",
      "Lịch sử — văn hóa trầm hương",
    ],
    required: false,
  },
  {
    id: "is_trading",
    label: "Hiện bạn có đang kinh doanh sản phẩm trầm không?",
    type: "select",
    options: [
      "Có — kinh doanh toàn thời gian",
      "Có — bán thêm / thời vụ",
      "Chưa, chỉ làm nghề / nghiên cứu",
      "Chưa có nhưng quan tâm bắt đầu",
    ],
    required: false,
    scoreRule: {
      "Có — kinh doanh toàn thời gian": 5,
      "Có — bán thêm / thời vụ": 3,
      "Chưa có nhưng quan tâm bắt đầu": 2,
    },
  },

  // ── Insight về nền tảng số ──
  {
    id: "platform_awareness",
    label: "Bạn đã biết về nền tảng số mới của Hội chưa?",
    type: "select",
    options: [
      "Đã dùng và rành các tính năng",
      "Đã nghe qua nhưng chưa dùng nhiều",
      "Chưa từng biết — rất muốn tìm hiểu",
    ],
    required: false,
    helpText: "Giúp Hội biết mức độ nhận diện để có chương trình hướng dẫn phù hợp",
  },
  {
    id: "interested_features",
    label: "Tính năng nào của nền tảng số khiến bạn quan tâm nhất? (chọn nhiều)",
    type: "multiselect",
    options: [
      "Hồ sơ chuyên gia cá nhân trên website Hội",
      "Cộng đồng — bảng feed trao đổi hội viên",
      "Chứng nhận chuyên môn cá nhân",
      "Thư viện tài liệu nghiên cứu",
      "Tin tức ngành cập nhật liên tục",
      "Kết nối hợp tác giữa hội viên",
      "Sự kiện — hội chợ — đào tạo",
    ],
    required: false,
    scoreRule: {
      "Chứng nhận chuyên môn cá nhân": 2,
      "Kết nối hợp tác giữa hội viên": 2,
      "Hồ sơ chuyên gia cá nhân trên website Hội": 2,
    },
  },
  {
    id: "expectations",
    label: "Bạn mong đợi điều gì khi là Hội viên (chọn nhiều)",
    type: "multiselect",
    options: [
      "Giao lưu, kết bạn cùng sở thích",
      "Học hỏi kỹ thuật từ nghệ nhân",
      "Được chứng nhận chuyên môn bởi Hội",
      "Cơ hội giao thương — mở rộng kinh doanh",
      "Tham gia hội thảo, sự kiện văn hóa",
      "Cập nhật nghiên cứu khoa học",
      "Tham gia biểu quyết, xây dựng Hội",
    ],
    required: false,
  },
  {
    id: "contribution_interest",
    label: "Bạn có sẵn sàng đóng góp cho Hội ở mảng nào? (tùy chọn)",
    type: "multiselect",
    options: [
      "Chia sẻ kinh nghiệm tại sự kiện",
      "Viết bài lên cộng đồng",
      "Hướng dẫn người mới",
      "Làm giám khảo chứng nhận sản phẩm",
      "Tham gia Ban chuyên môn",
      "Hiện chưa có kế hoạch",
    ],
    required: false,
  },

  // ── Hình ảnh minh họa (type=files) ──
  {
    id: "work_photos",
    label: "Ảnh công việc / sản phẩm của bạn",
    type: "files",
    maxFiles: 5,
    required: false,
    helpText: "Ảnh sản phẩm bạn chế tác, không gian làm việc, giải thưởng, bằng khen... (tối đa 5 ảnh)",
  },
  {
    id: "certification_photos",
    label: "Ảnh chứng chỉ / bằng cấp (nếu có)",
    type: "files",
    maxFiles: 3,
    required: false,
    helpText: "Bằng tốt nghiệp, chứng chỉ chuyên môn, giải thưởng... Giúp Hội xét duyệt chứng nhận cá nhân.",
  },
]

// ────────────────────────────────────────────────────────────────
// Run
// ────────────────────────────────────────────────────────────────

async function main() {
  const surveys = [
    {
      slug: "khao-sat-hoi-vien-doanh-nghiep-2026",
      title: "Khảo sát Hội viên Doanh nghiệp 2026",
      description: BUSINESS_DESCRIPTION,
      audience: "BUSINESS" as const,
      status: "ACTIVE" as const,
      questions: businessQuestions,
      config: {
        recommendation: { silverFrom: 10, goldFrom: 22 },
      },
    },
    {
      slug: "khao-sat-hoi-vien-ca-nhan-2026",
      title: "Khảo sát Hội viên Cá nhân 2026",
      description: INDIVIDUAL_DESCRIPTION,
      audience: "INDIVIDUAL" as const,
      status: "ACTIVE" as const,
      questions: individualQuestions,
      config: {
        recommendation: { silverFrom: 6, goldFrom: 14 },
      },
    },
  ]

  for (const s of surveys) {
    const existing = await prisma.survey.findUnique({ where: { slug: s.slug } })
    if (existing) {
      await prisma.survey.update({
        where: { id: existing.id },
        data: {
          title: s.title,
          description: s.description,
          audience: s.audience,
          status: s.status,
          questions: s.questions,
          config: s.config,
        },
      })
      console.log(`✓ Updated: ${s.slug} (${s.questions.length} questions)`)
    } else {
      await prisma.survey.create({ data: s })
      console.log(`✓ Created: ${s.slug} (${s.questions.length} questions)`)
    }
  }

  const count = await prisma.survey.count()
  console.log(`\n📋 Total surveys in DB: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
