/**
 * Seed giá trị mặc định cho các key footer vào SiteConfig.
 * Chỉ tạo nếu chưa có (không ghi đè giá trị admin đã chỉnh).
 *
 * Chạy: npx tsx scripts/seed-footer-settings.ts
 */
import { prisma } from "@/lib/prisma"

const defaults: { key: string; value: string; description: string }[] = [
  {
    key: "footer_brand_desc",
    value:
      "Kết nối cộng đồng doanh nghiệp trầm hương — chứng nhận sản phẩm, chia sẻ tri thức và phát triển thị trường bền vững.",
    description: "Mô tả ngắn về Hội hiển thị dưới logo ở footer",
  },
  {
    key: "footer_working_hours",
    value: "Thứ 2 - Thứ 6: 8:00 - 17:00",
    description: "Giờ làm việc hiển thị trong khối liên hệ footer",
  },
  {
    key: "footer_legal_basis",
    value:
      "Thành lập theo Quyết định số 23/QĐ-BNV ngày 11/01/2010 của Bộ Nội Vụ. Điều lệ Hội được phê duyệt qua Đại hội nhiệm kỳ.",
    description: "Đoạn căn cứ pháp lý ở footer",
  },
  {
    key: "footer_copyright_notice",
    value:
      "⚠ Cấm sao chép dưới mọi hình thức nếu không có sự chấp thuận bằng văn bản của Hội Trầm Hương Việt Nam. Ghi rõ nguồn hoitramhuong.vn khi phát hành lại thông tin từ website này.",
    description: "Cảnh báo bản quyền ở cuối footer",
  },
  {
    key: "footer_quick_links",
    value: [
      "Trang chủ|/",
      "Doanh nghiệp|/doanh-nghiep",
      "Dịch vụ|/dich-vu",
      "Điều lệ Hội|/dieu-le",
      "Văn bản pháp quy|/phap-ly",
      "Liên hệ|/lien-he",
    ].join("\n"),
    description: "Danh sách liên kết nhanh ở footer — mỗi dòng: Nhãn|đường-dẫn",
  },
]

async function main() {
  for (const d of defaults) {
    const existing = await prisma.siteConfig.findUnique({ where: { key: d.key } })
    if (existing) {
      console.log(`↷ skip  ${d.key}  (đã có)`)
      continue
    }
    await prisma.siteConfig.create({ data: d })
    console.log(`✓ seed  ${d.key}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
