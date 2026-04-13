// ============================================================
// Seed 2 trang pháp lý (LEGAL) — Chính sách bảo mật + Điều khoản sử dụng.
// Dùng `upsert` theo slug: chạy nhiều lần cũng an toàn.
// Sau khi seed, admin có thể vào /admin/tin-tuc/[id] để chỉnh sửa nội dung.
//
// Chạy local:    npx tsx prisma/seed-legal-pages.ts
// Chạy Supabase: MIGRATE_TARGET=supabase npx tsx prisma/seed-legal-pages.ts
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

const PRIVACY_HTML = /* html */ `
<h2>1. Phạm vi áp dụng</h2>
<p>Chính sách bảo mật này áp dụng cho mọi cá nhân, tổ chức truy cập và sử dụng website chính thức của <strong>Hội Trầm Hương Việt Nam</strong> (gọi tắt là "Hội"), bao gồm hội viên, doanh nghiệp hội viên, cộng tác viên và khách thăm.</p>
<p>Hội Trầm Hương Việt Nam là tổ chức xã hội nghề nghiệp được Bộ Nội Vụ cho phép thành lập theo Quyết định số <strong>23/QĐ-BNV ngày 11/01/2010</strong>, có tư cách pháp nhân, con dấu và tài khoản riêng theo quy định pháp luật Việt Nam.</p>

<h2>2. Thông tin Hội thu thập</h2>
<ul>
  <li><strong>Thông tin tài khoản</strong>: họ tên, email, số điện thoại, mật khẩu (mã hoá), ảnh đại diện.</li>
  <li><strong>Thông tin hội viên</strong>: CCCD/CMND, địa chỉ, doanh nghiệp đại diện, mức phí hội viên đã đóng.</li>
  <li><strong>Thông tin doanh nghiệp</strong>: tên, mã số thuế, địa chỉ trụ sở, ngành nghề, sản phẩm.</li>
  <li><strong>Thông tin sử dụng</strong>: nhật ký truy cập, loại thiết bị, trình duyệt, địa chỉ IP, hành vi tương tác cơ bản trên website.</li>
  <li><strong>Thông tin thanh toán</strong>: Hội <em>không lưu</em> số thẻ ngân hàng/CVV; chỉ lưu thông tin giao dịch (số tiền, mã giao dịch, nội dung CK) phục vụ đối chiếu.</li>
</ul>

<h2>3. Mục đích sử dụng thông tin</h2>
<ul>
  <li>Quản lý hồ sơ hội viên, gia hạn niên liễn, cấp chứng nhận sản phẩm.</li>
  <li>Cung cấp dịch vụ trên website: bài viết, marketplace, banner quảng cáo, khảo sát.</li>
  <li>Liên lạc thông báo từ Ban Chấp hành Hội (tin tức, đại hội, sự kiện).</li>
  <li>Phòng chống lạm dụng, gian lận, vi phạm pháp luật.</li>
  <li>Tuân thủ yêu cầu của cơ quan nhà nước có thẩm quyền (khi có văn bản hợp pháp).</li>
</ul>

<h2>4. Chia sẻ thông tin với bên thứ ba</h2>
<p>Hội <strong>không bán, không trao đổi</strong> thông tin cá nhân của người dùng cho bất kỳ bên thứ ba nào vì mục đích thương mại. Hội chỉ chia sẻ dữ liệu trong các trường hợp:</p>
<ul>
  <li>Đối tác kỹ thuật phục vụ vận hành (máy chủ, email, lưu trữ ảnh) — đã ký cam kết bảo mật.</li>
  <li>Cơ quan nhà nước có thẩm quyền yêu cầu bằng văn bản hợp pháp.</li>
  <li>Khi người dùng tự nguyện công khai (ví dụ đăng bài viết, sản phẩm trên feed công cộng).</li>
</ul>

<h2>5. Bảo mật và lưu trữ</h2>
<p>Dữ liệu được lưu trữ trên hạ tầng đám mây, mã hoá khi truyền (TLS/HTTPS) và mã hoá mật khẩu một chiều (bcrypt). Hội thực hiện sao lưu định kỳ và rà soát quyền truy cập nội bộ. Tuy nhiên không hệ thống nào tuyệt đối an toàn — người dùng có trách nhiệm bảo vệ mật khẩu của mình.</p>

<h2>6. Quyền của người dùng</h2>
<ul>
  <li>Yêu cầu truy cập, chỉnh sửa, xoá thông tin cá nhân của mình.</li>
  <li>Rút lại sự đồng ý xử lý dữ liệu (đồng nghĩa chấm dứt tư cách hội viên).</li>
  <li>Khiếu nại với Hội hoặc cơ quan nhà nước có thẩm quyền nếu phát hiện vi phạm.</li>
</ul>
<p>Liên hệ thực hiện quyền: gửi email về địa chỉ chính thức của Hội (xem khối "Kênh truyền thông chính thức" cuối trang).</p>

<h2>7. Thay đổi chính sách</h2>
<p>Hội có thể cập nhật chính sách này theo quy định pháp luật hoặc nhu cầu vận hành. Phiên bản mới sẽ được đăng tại trang này, có ghi rõ ngày cập nhật. Việc tiếp tục sử dụng website sau khi chính sách thay đổi đồng nghĩa với việc chấp nhận chính sách mới.</p>
`

const TERMS_HTML = /* html */ `
<h2>1. Chấp nhận điều khoản</h2>
<p>Bằng việc truy cập và sử dụng website chính thức của <strong>Hội Trầm Hương Việt Nam</strong> (gọi tắt là "Hội", "VAWA"), người dùng đồng ý tuân thủ Điều khoản này và các văn bản pháp lý kèm theo (Chính sách bảo mật, Điều lệ Hội, Quy chế nội bộ).</p>
<p>Hội Trầm Hương Việt Nam được thành lập theo Quyết định số <strong>23/QĐ-BNV ngày 11/01/2010</strong> của Bộ Nội Vụ. Mọi hoạt động trên website đều được điều chỉnh bởi pháp luật Việt Nam.</p>

<h2>2. Tài khoản người dùng</h2>
<ul>
  <li>Người dùng tự chịu trách nhiệm bảo mật mật khẩu, không chia sẻ tài khoản cho người khác.</li>
  <li>Cung cấp thông tin trung thực, chính xác, cập nhật khi có thay đổi.</li>
  <li>Hội có quyền tạm khoá hoặc xoá tài khoản nếu phát hiện thông tin sai sự thật, mạo danh, hoặc vi phạm các điều khoản.</li>
</ul>

<h2>3. Nội dung do người dùng đăng tải</h2>
<ul>
  <li>Người dùng giữ bản quyền nội dung mình đăng nhưng cấp cho Hội quyền sử dụng phi độc quyền để hiển thị, lưu trữ, sao lưu trên website.</li>
  <li>Nghiêm cấm đăng nội dung vi phạm pháp luật Việt Nam, xúc phạm tổ chức/cá nhân, quảng cáo sai sự thật, hàng giả, hàng nhái.</li>
  <li>Hội có quyền gỡ bỏ, khoá bài viết vi phạm mà không cần báo trước. Trường hợp nghiêm trọng sẽ chuyển hồ sơ tới cơ quan chức năng.</li>
  <li>Bài viết phải tuân thủ hạn mức (quota) theo cấp bậc hội viên.</li>
</ul>

<h2>4. Giao dịch trên website</h2>
<ul>
  <li>Phí hội viên, phí chứng nhận, phí banner quảng cáo được thực hiện qua tài khoản ngân hàng <strong>chính thức</strong> của Hội (công bố trong khu vực thanh toán đã đăng nhập).</li>
  <li>Mọi giao dịch nằm ngoài kênh chính thức được liệt kê dưới đây <strong>không được Hội công nhận</strong> và Hội không chịu trách nhiệm.</li>
  <li>Sản phẩm trên marketplace do hội viên tự đăng tải; Hội không bảo lãnh chất lượng — riêng sản phẩm có dấu chứng nhận VAWA đã qua thẩm định.</li>
</ul>

<h2>5. Tuyên bố từ chối trách nhiệm về kênh giả mạo</h2>
<p><strong>Hội Trầm Hương Việt Nam</strong> chỉ truyền thông qua các kênh chính thức được liệt kê tại phần "Kênh truyền thông chính thức" cuối trang này.</p>
<p>Mọi <strong>trang Facebook, Fanpage, Group, tài khoản Zalo, Zalo OA, website, kênh TikTok, YouTube</strong> hoặc bất kỳ tài khoản mạng xã hội nào <strong>không nằm trong danh sách kênh chính thức</strong> đều <strong>không trực thuộc</strong> và không đại diện cho Hội.</p>
<p>Hội <strong>không chịu trách nhiệm</strong> đối với mọi thông tin, giao dịch, khoản chuyển tiền, hoạt động quyên góp, dịch vụ tư vấn… được thực hiện qua các kênh không chính thức nêu trên. Người dùng cần thận trọng và đối chiếu danh sách kênh chính thức trước khi tương tác.</p>

<h2>6. Quyền sở hữu trí tuệ</h2>
<p>Logo, tên thương hiệu "VAWA", "Hội Trầm Hương Việt Nam", nội dung bài viết chính thức, tài liệu nội bộ, mẫu chứng nhận thuộc quyền sở hữu của Hội. Mọi hành vi sao chép, sử dụng nhằm mục đích thương mại, mạo danh đều là vi phạm pháp luật và sẽ bị xử lý theo quy định.</p>

<h2>7. Giới hạn trách nhiệm</h2>
<p>Hội cố gắng duy trì website hoạt động ổn định, tuy nhiên không cam kết truy cập liên tục 100% và không chịu trách nhiệm về các thiệt hại gián tiếp phát sinh từ việc gián đoạn dịch vụ, mất dữ liệu do nguyên nhân bất khả kháng.</p>

<h2>8. Sửa đổi điều khoản</h2>
<p>Hội có quyền cập nhật Điều khoản này. Phiên bản mới có hiệu lực kể từ ngày đăng tại website. Việc tiếp tục sử dụng sau ngày cập nhật được coi là chấp nhận điều khoản mới.</p>

<h2>9. Luật áp dụng và giải quyết tranh chấp</h2>
<p>Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết bằng thương lượng; trường hợp không thoả thuận được, tranh chấp sẽ được đưa ra Toà án có thẩm quyền tại TP. Hồ Chí Minh.</p>
`

const PAGES = [
  {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật",
    excerpt:
      "Cách Hội Trầm Hương Việt Nam thu thập, sử dụng và bảo vệ thông tin cá nhân của hội viên và người dùng website.",
    content: PRIVACY_HTML,
  },
  {
    slug: "dieu-khoan-su-dung",
    title: "Điều khoản sử dụng",
    excerpt:
      "Quy định sử dụng website Hội Trầm Hương Việt Nam — quyền và nghĩa vụ người dùng, quy định về nội dung và giao dịch.",
    content: TERMS_HTML,
  },
] as const

async function main() {
  const target = process.env.MIGRATE_TARGET === "supabase" ? "Supabase" : "local"
  console.log(`📄 Seed trang pháp lý LEGAL (${target})`)

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  })
  if (!admin) throw new Error("Không tìm thấy user ADMIN — chạy `prisma db seed` trước.")
  console.log(`   Author: ${admin.email}`)

  for (const p of PAGES) {
    const existed = await prisma.news.findUnique({ where: { slug: p.slug } })
    const news = await prisma.news.upsert({
      where: { slug: p.slug },
      // Nếu đã có bản LEGAL → KHÔNG ghi đè content (admin có thể đã sửa).
      // Chỉ đồng bộ category + isPublished để chắc chắn page render được.
      update: existed
        ? { category: "LEGAL", isPublished: true }
        : {
            title: p.title,
            excerpt: p.excerpt,
            content: p.content,
            category: "LEGAL",
            isPublished: true,
          },
      create: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        category: "LEGAL",
        isPublished: true,
        publishedAt: new Date(),
        authorId: admin.id,
      },
    })
    console.log(`   ✓ ${p.slug} — ${existed ? "đã có (giữ nguyên content)" : "tạo mới"}`)
  }

  console.log(`✅ Hoàn tất — admin sửa qua /admin/tin-tuc/[id] (chọn category=LEGAL)`)
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
