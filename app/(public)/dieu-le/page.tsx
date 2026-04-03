import Link from "next/link"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Điều lệ Hội — Hội Trầm Hương Việt Nam",
  description:
    "Điều lệ Hội Trầm Hương Việt Nam — các quy định, quyền lợi, nghĩa vụ và cơ cấu tổ chức của Hội.",
}

const chapters = [
  {
    id: "chuong-1",
    number: "I",
    title: "Tên gọi, địa vị pháp lý và trụ sở",
    content: [
      "Hội Trầm Hương Việt Nam (tên viết tắt: HTHVN; tên tiếng Anh: Vietnam Agarwood Association — VAA) là tổ chức xã hội nghề nghiệp tự nguyện của các tổ chức, cá nhân Việt Nam hoạt động trong lĩnh vực sản xuất, kinh doanh, nghiên cứu và phát triển sản phẩm từ trầm hương trên toàn quốc.",
      "Hội được thành lập và hoạt động theo quy định của pháp luật Việt Nam, chịu sự quản lý nhà nước của Bộ Nội vụ và các cơ quan nhà nước có thẩm quyền. Hội có tư cách pháp nhân, có con dấu, tài khoản riêng và được hoạt động theo Điều lệ này.",
      "Trụ sở chính của Hội đặt tại: 123 Đường Trầm Hương, Quận 1, Thành phố Hồ Chí Minh, Việt Nam. Hội có thể thành lập các chi hội, văn phòng đại diện tại các tỉnh, thành phố khác theo quy định của pháp luật và nhu cầu phát triển của Hội.",
    ],
  },
  {
    id: "chuong-2",
    number: "II",
    title: "Tôn chỉ và mục đích",
    content: [
      "Hội Trầm Hương Việt Nam hoạt động với tôn chỉ: tập hợp, đoàn kết các tổ chức, cá nhân hoạt động trong ngành trầm hương; bảo vệ quyền và lợi ích hợp pháp của hội viên; góp phần phát triển ngành trầm hương Việt Nam bền vững và hội nhập quốc tế.",
      "Mục đích của Hội là xây dựng một cộng đồng doanh nghiệp trầm hương lành mạnh, minh bạch và phát triển. Hội thúc đẩy việc áp dụng các tiêu chuẩn chất lượng quốc tế vào sản xuất và kinh doanh trầm hương, đồng thời nâng cao uy tín của trầm hương Việt Nam trên thị trường toàn cầu.",
      "Hội hoạt động không vì mục đích lợi nhuận. Mọi nguồn thu của Hội đều được sử dụng để phục vụ hoạt động của Hội và lợi ích của hội viên theo đúng quy định tài chính hiện hành.",
    ],
  },
  {
    id: "chuong-3",
    number: "III",
    title: "Chức năng và nhiệm vụ",
    content: [
      "Hội có chức năng tập hợp, đoàn kết các hội viên; đại diện và bảo vệ quyền, lợi ích hợp pháp của hội viên trước các cơ quan nhà nước và tổ chức khác; tổ chức các hoạt động phù hợp với tôn chỉ, mục đích của Hội theo quy định của pháp luật.",
      "Nhiệm vụ của Hội bao gồm: xây dựng và ban hành tiêu chuẩn chứng nhận chất lượng sản phẩm trầm hương; tổ chức đào tạo, bồi dưỡng nghiệp vụ cho hội viên; thúc đẩy hợp tác, liên kết giữa các hội viên; tổ chức hội chợ, triển lãm và các sự kiện quảng bá ngành.",
      "Hội có nhiệm vụ tư vấn, phản biện và tham gia vào quá trình xây dựng chính sách, pháp luật liên quan đến ngành trầm hương; kiến nghị với các cơ quan nhà nước các vấn đề liên quan đến tổ chức, hoạt động của Hội và lĩnh vực Hội hoạt động.",
    ],
  },
  {
    id: "chuong-4",
    number: "IV",
    title: "Hội viên",
    content: [
      "Hội viên của Hội Trầm Hương Việt Nam bao gồm hội viên tổ chức và hội viên cá nhân. Hội viên tổ chức là các doanh nghiệp, cơ sở sản xuất, đơn vị nghiên cứu và các tổ chức khác hoạt động trong lĩnh vực trầm hương. Hội viên cá nhân là các chuyên gia, nhà nghiên cứu và người hoạt động trong ngành.",
      "Điều kiện gia nhập: Tổ chức, cá nhân tự nguyện xin gia nhập Hội, tán thành Điều lệ Hội, có đơn xin gia nhập và được Ban chấp hành Hội xét duyệt, chấp thuận. Hội viên được cấp thẻ hội viên và được hưởng đầy đủ quyền lợi ghi trong Điều lệ.",
      "Thủ tục gia nhập: Nộp đơn xin gia nhập Hội theo mẫu; kèm theo các tài liệu chứng minh tư cách pháp lý (đối với hội viên tổ chức) hoặc giấy tờ cá nhân; đóng phí gia nhập theo quy định. Sau khi được Ban chấp hành phê duyệt, hội viên mới được công nhận chính thức.",
    ],
  },
  {
    id: "chuong-5",
    number: "V",
    title: "Quyền lợi và nghĩa vụ hội viên",
    content: [
      "Hội viên có các quyền: tham gia và biểu quyết tại Đại hội hội viên; được Hội bảo vệ quyền và lợi ích hợp pháp; được hưởng các dịch vụ do Hội cung cấp; được thông tin về hoạt động của Hội; kiến nghị, đề xuất với Ban chấp hành Hội; được xem xét cấp chứng nhận sản phẩm và các hỗ trợ khác.",
      "Hội viên có nghĩa vụ: thực hiện Điều lệ, Quy chế của Hội và các nghị quyết của Đại hội hội viên, Ban chấp hành Hội; đóng hội phí đúng hạn theo quy định; tích cực tham gia các hoạt động của Hội; thực hiện đúng các cam kết về tiêu chuẩn chất lượng; bảo vệ uy tín của Hội.",
      "Hội viên có thể tự nguyện xin ra khỏi Hội bằng văn bản. Hội viên vi phạm Điều lệ, làm tổn hại đến uy tín của Hội có thể bị khai trừ theo quyết định của Ban chấp hành sau khi đã được nhắc nhở và có cơ hội giải trình.",
    ],
  },
  {
    id: "chuong-6",
    number: "VI",
    title: "Cơ cấu tổ chức",
    content: [
      "Cơ quan lãnh đạo cao nhất của Hội là Đại hội hội viên, được tổ chức định kỳ 5 năm một lần (Đại hội nhiệm kỳ) hoặc bất thường khi có yêu cầu. Đại hội thảo luận và thông qua Báo cáo tổng kết, phương hướng hoạt động, bầu Ban chấp hành và sửa đổi Điều lệ (nếu cần).",
      "Ban chấp hành Hội là cơ quan lãnh đạo của Hội giữa hai kỳ Đại hội, gồm Chủ tịch, các Phó Chủ tịch, Tổng Thư ký và các Ủy viên. Ban chấp hành họp định kỳ 6 tháng một lần hoặc khi cần thiết để quyết định các vấn đề quan trọng của Hội.",
      "Hội đồng Chủ tịch là cơ quan thường trực của Ban chấp hành, điều hành công việc của Hội giữa các kỳ họp Ban chấp hành. Ban Kiểm tra thực hiện chức năng kiểm tra, giám sát việc thực hiện Điều lệ và các quyết định của Ban chấp hành.",
    ],
  },
  {
    id: "chuong-7",
    number: "VII",
    title: "Tài chính",
    content: [
      "Nguồn tài chính của Hội bao gồm: hội phí của hội viên theo quy định; phí cấp chứng nhận sản phẩm và các dịch vụ Hội cung cấp; tài trợ, đóng góp tự nguyện từ các tổ chức, cá nhân trong và ngoài nước; thu nhập từ các hoạt động sự nghiệp, kinh doanh hợp pháp của Hội theo quy định của pháp luật.",
      "Tài chính của Hội được quản lý và sử dụng theo nguyên tắc công khai, minh bạch, đúng mục đích và theo quy định của pháp luật. Hội lập dự toán ngân sách hàng năm, báo cáo tài chính được kiểm toán và công bố cho hội viên tại mỗi kỳ Đại hội.",
      "Hội phí được quy định cụ thể trong Quy chế tài chính của Hội và có thể được điều chỉnh theo quyết định của Ban chấp hành để phù hợp với tình hình thực tế. Hội viên có khó khăn đặc biệt có thể xin miễn, giảm hội phí theo quy trình quy định.",
    ],
  },
  {
    id: "chuong-8",
    number: "VIII",
    title: "Điều khoản thi hành",
    content: [
      "Điều lệ này gồm 8 chương, có hiệu lực kể từ ngày được Đại hội hội viên thông qua và được cơ quan nhà nước có thẩm quyền phê duyệt. Mọi quy định trước đây trái với Điều lệ này đều bãi bỏ.",
      "Việc sửa đổi, bổ sung Điều lệ chỉ được thực hiện tại Đại hội hội viên và phải được ít nhất 2/3 số đại biểu có mặt tán thành. Sau khi được Đại hội thông qua, việc sửa đổi Điều lệ phải được đăng ký với cơ quan nhà nước có thẩm quyền theo quy định.",
      "Ban chấp hành Hội có trách nhiệm phổ biến Điều lệ đến toàn thể hội viên và tổ chức thực hiện nghiêm túc các quy định của Điều lệ. Trong quá trình thực hiện, nếu phát sinh vướng mắc, Ban chấp hành có quyền giải thích và hướng dẫn thực hiện theo đúng tinh thần của Điều lệ.",
    ],
  },
]

export default function DieuLePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-brand-800 text-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="mb-4 text-sm text-brand-300" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Điều lệ Hội</span>
          </nav>
          <h1 className="text-3xl font-bold sm:text-4xl">Điều lệ Hội Trầm Hương Việt Nam</h1>
          <p className="mt-3 text-brand-200 max-w-xl">
            Văn bản quy định về tổ chức, hoạt động, quyền lợi và nghĩa vụ của
            các hội viên Hội Trầm Hương Việt Nam.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* ── PDF Download ── */}
        <div className="mb-12 flex flex-col items-center gap-3 rounded-xl border-2 border-brand-300 bg-brand-50 p-8 text-center">
          <div className="text-4xl">📄</div>
          <h2 className="text-lg font-bold text-brand-900">
            Tải xuống Điều lệ Hội
          </h2>
          <p className="text-sm text-brand-600">
            Bản PDF chính thức của Điều lệ Hội Trầm Hương Việt Nam
          </p>
          <a
            href="/files/dieu-le-hoi-tram-huong.pdf"
            download
            className={cn(
              "mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-6 py-3",
              "text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            )}
          >
            <span>⬇</span>
            Tải xuống PDF
          </a>
        </div>

        {/* ── Table of Contents ── */}
        <div className="mb-12 rounded-xl border border-brand-200 bg-white p-8 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-brand-900">Mục lục</h2>
          <ol className="space-y-2">
            {chapters.map((ch) => (
              <li key={ch.id}>
                <a
                  href={`#${ch.id}`}
                  className="flex items-baseline gap-3 text-sm text-brand-700 hover:text-brand-900 hover:underline underline-offset-2 transition-colors"
                >
                  <span className="flex-shrink-0 font-semibold text-brand-500">
                    Chương {ch.number}.
                  </span>
                  <span>{ch.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Chapter Content ── */}
        <div className="space-y-12">
          {chapters.map((ch) => (
            <section
              key={ch.id}
              id={ch.id}
              className="scroll-mt-24 rounded-xl border border-brand-100 bg-white p-8 shadow-sm"
            >
              <h2 className="text-xl font-bold text-brand-900 mb-1">
                Chương {ch.number}
              </h2>
              <h3 className="text-base font-semibold text-brand-700 mb-5 pb-4 border-b border-brand-100">
                {ch.title}
              </h3>
              <div className="space-y-4">
                {ch.content.map((para, idx) => (
                  <p key={idx} className="text-brand-700 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Back to top ── */}
        <div className="mt-12 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-2"
          >
            ↑ Lên đầu trang
          </a>
        </div>
      </div>
    </>
  )
}
