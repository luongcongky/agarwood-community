// ============================================================
// Seed bài "Cảnh báo các trang Facebook/Zalo giả mạo Hội Trầm Hương Việt Nam"
// + đảm bảo SiteConfig có key zalo_url (default rỗng để admin tự cập nhật).
//
// Chạy local:    npx tsx prisma/seed-warning-news.ts
// Chạy Supabase: MIGRATE_TARGET=supabase npx tsx prisma/seed-warning-news.ts
// ============================================================

import { PrismaClient } from "@prisma/client"
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

const NEWS_SLUG = "canh-bao-cac-trang-facebook-zalo-gia-mao-hoi-tram-huong-viet-nam"
const NEWS_TITLE =
  "Cảnh báo các trang Facebook, Zalo giả mạo Hội Trầm Hương Việt Nam"

const NEWS_CONTENT = /* html */ `
<p><strong>Hội Trầm Hương Việt Nam (VAWA)</strong> — tổ chức xã hội nghề nghiệp được Bộ Nội Vụ cho phép thành lập theo Quyết định số <strong>23/QĐ-BNV ngày 11/01/2010</strong> — trân trọng thông báo tới quý hội viên và công chúng:</p>

<h2>1. Thực trạng các trang giả mạo</h2>
<p>Thời gian gần đây, Ban Truyền thông Hội Trầm Hương Việt Nam ghi nhận nhiều trang Facebook (Fanpage, Group), tài khoản Zalo cá nhân, Zalo OA, website, kênh TikTok, YouTube… <strong>sử dụng tên gọi, logo, hình ảnh và uy tín của Hội</strong> nhưng <strong>không thuộc</strong> hệ thống truyền thông chính thức.</p>
<p>Nhiều trang trong số đó đã có hành vi:</p>
<ul>
  <li>Mạo danh Hội kêu gọi quyên góp, đóng phí hội viên.</li>
  <li>Quảng cáo sản phẩm trầm hương không rõ nguồn gốc, gắn nhãn "VAWA chứng nhận" giả.</li>
  <li>Mời tham gia khoá học, sự kiện không có thật.</li>
  <li>Lừa đảo chuyển khoản qua tài khoản cá nhân.</li>
</ul>

<h2>2. Kênh truyền thông chính thức của Hội</h2>
<p>Hội Trầm Hương Việt Nam <strong>chỉ truyền thông qua các kênh sau</strong>:</p>
<ul>
  <li><strong>Website chính thức</strong>: hoitramhuong.vn</li>
  <li><strong>Facebook chính thức</strong>: facebook.com/hoitramhuongvietnam.org</li>
  <li><strong>Email chính thức</strong>: hoitramhuongvietnam2010@gmail.com</li>
  <li><strong>Hotline chính thức</strong>: 0913 810 060 (Ông Phạm Văn Du — Chủ tịch Hội), 0938 334 647 (Ông Nguyễn Văn Hùng — Phó Chủ tịch Hội)</li>
  <li><strong>Trụ sở</strong>: Số 150, Đường Lý Chính Thắng, Phường Xuân Hòa, TP. Hồ Chí Minh</li>
</ul>
<p>Mọi tài khoản Zalo OA, kênh YouTube, TikTok khác (nếu được Hội mở) đều sẽ được công bố chính thức trên website tại trang <a href="/lien-he">/lien-he</a> và trang <a href="/privacy">Chính sách bảo mật</a>.</p>

<h2>3. Tuyên bố từ chối trách nhiệm</h2>
<p>Hội Trầm Hương Việt Nam <strong>không chịu trách nhiệm</strong> đối với:</p>
<ul>
  <li>Mọi nội dung, phát ngôn, sản phẩm, dịch vụ do các trang/tài khoản giả mạo đăng tải.</li>
  <li>Mọi giao dịch, chuyển khoản, quyên góp được thực hiện qua kênh không chính thức.</li>
  <li>Thiệt hại phát sinh từ việc người dùng không kiểm tra danh sách kênh chính thức trước khi giao dịch.</li>
</ul>

<h2>4. Đề nghị cộng đồng phối hợp</h2>
<ol>
  <li><strong>Báo cáo cho Hội</strong>: gửi đường dẫn (URL) trang giả mạo về email <a href="mailto:hoitramhuongvietnam2010@gmail.com">hoitramhuongvietnam2010@gmail.com</a> kèm ảnh chụp màn hình. Ban Truyền thông sẽ xử lý theo trình tự pháp lý.</li>
  <li><strong>Báo cáo trực tiếp</strong> với nền tảng (Facebook, Zalo, Google) bằng tính năng Report — chọn lý do "Mạo danh tổ chức".</li>
  <li><strong>Tuyệt đối không</strong> chuyển khoản, cung cấp CMND/CCCD, mã OTP, hoặc thực hiện giao dịch với các kênh chưa được xác minh trên website chính thức.</li>
  <li><strong>Chia sẻ thông báo này</strong> tới hội viên, đối tác và cộng đồng để cùng nhau bảo vệ uy tín của Hội và quyền lợi của người tiêu dùng trầm hương.</li>
</ol>

<h2>5. Cam kết của Hội</h2>
<p>Ban Chấp hành Hội Trầm Hương Việt Nam cam kết sẽ phối hợp với các cơ quan chức năng (Bộ Thông tin &amp; Truyền thông, Cục An ninh mạng – Bộ Công an, các nền tảng mạng xã hội) để xử lý nghiêm các hành vi mạo danh, lừa đảo nhằm bảo vệ uy tín của Hội và quyền lợi hợp pháp của hội viên, người tiêu dùng.</p>

<p style="margin-top: 32px;"><em>Trân trọng,</em><br/><strong>Ban Chấp hành Hội Trầm Hương Việt Nam</strong></p>
`

async function main() {
  const target = process.env.MIGRATE_TARGET === "supabase" ? "Supabase" : "local"
  console.log(`📰 Seed bài cảnh báo giả mạo (${target})`)

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  })
  if (!admin) throw new Error("Không tìm thấy user ADMIN — chạy `prisma db seed` trước.")
  console.log(`   Author: ${admin.email}`)

  // Đảm bảo SiteConfig có zalo_url (rỗng — admin sẽ điền sau)
  await prisma.siteConfig.upsert({
    where: { key: "zalo_url" },
    update: {},
    create: {
      key: "zalo_url",
      value: "",
      description: "URL Zalo OA chính thức của Hội (để trống nếu chưa có)",
    },
  })
  console.log(`   ✓ SiteConfig.zalo_url đã sẵn sàng`)

  // Upsert bài news theo slug
  const now = new Date()
  const news = await prisma.news.upsert({
    where: { slug: NEWS_SLUG },
    update: {
      title: NEWS_TITLE,
      content: NEWS_CONTENT,
      isPinned: true,
      isPublished: true,
      publishedAt: now,
    },
    create: {
      title: NEWS_TITLE,
      slug: NEWS_SLUG,
      excerpt:
        "Hội Trầm Hương Việt Nam thông báo: chỉ truyền thông qua các kênh chính thức được liệt kê. Mọi trang Facebook, Zalo, website mạo danh đều không thuộc Hội và Hội không chịu trách nhiệm.",
      content: NEWS_CONTENT,
      category: "GENERAL",
      isPublished: true,
      isPinned: true,
      publishedAt: now,
      authorId: admin.id,
    },
  })
  console.log(`✅ Bài "${news.title.slice(0, 60)}…" đã sẵn sàng (slug=${news.slug})`)
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
