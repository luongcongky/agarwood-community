import Link from "next/link"
import { cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: "Điều lệ Hội — Hội Trầm Hương Việt Nam",
  description:
    "Điều lệ (sửa đổi, bổ sung) Hội Trầm Hương Việt Nam — phê duyệt theo Quyết định số 1086/QĐ-BNV ngày 29/12/2023 của Bộ trưởng Bộ Nội vụ.",
}

// Fetch file PDF metadata từ SiteConfig (admin upload qua /admin/cai-dat)
async function getDieuLePdfInfo() {
  const rows = await prisma.siteConfig.findMany({
    where: {
      key: {
        in: ["dieu_le_drive_file_id", "dieu_le_file_name", "dieu_le_file_size"],
      },
    },
  })
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const fileId = map.dieu_le_drive_file_id
  if (!fileId) return null
  return {
    fileId,
    fileName: map.dieu_le_file_name ?? "dieu-le-hoi-tram-huong.pdf",
    fileSize: map.dieu_le_file_size ? Number(map.dieu_le_file_size) : 0,
    // Direct download link từ Google Drive
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Cấu trúc Điều lệ (sửa đổi, bổ sung) 2023:
 *  - 8 chương, 27 điều
 *  - Thông qua tại Đại hội đại biểu lần thứ III, nhiệm kỳ 2023–2028 (13/5/2023)
 *  - Phê duyệt: Quyết định 1086/QĐ-BNV ngày 29/12/2023
 *  - Thay thế Điều lệ cũ (QĐ 688/QĐ-BNV ngày 23/6/2010)
 */
type Article = {
  num: string      // "1", "2", ...
  title: string    // "Tên gọi, biểu tượng"
  paragraphs: (string | string[])[]  // chuỗi đoạn, mảng = list items
}

type Chapter = {
  id: string
  number: string   // "I"
  title: string
  articles: Article[]
}

const chapters: Chapter[] = [
  {
    id: "chuong-1",
    number: "I",
    title: "Quy định chung",
    articles: [
      {
        num: "1",
        title: "Tên gọi, biểu tượng",
        paragraphs: [
          "Tên tiếng Việt: Hội Trầm hương Việt Nam.",
          "Tên tiếng Anh: Vietnam Agarwood Association.",
          "Tên viết tắt tiếng Anh: VAWA.",
          "Biểu tượng: Hội Trầm hương Việt Nam có biểu tượng riêng, được đăng ký bản quyền theo quy định của pháp luật.",
        ],
      },
      {
        num: "2",
        title: "Tôn chỉ, mục đích",
        paragraphs: [
          "Hội Trầm hương Việt Nam (sau đây viết tắt là Hội) là tổ chức xã hội – nghề nghiệp của các doanh nghiệp, tổ chức và công dân Việt Nam hoạt động trong lĩnh vực trầm hương theo quy định của pháp luật, tự nguyện thành lập nhằm mục đích tập hợp, đoàn kết hội viên, bảo vệ quyền, lợi ích hợp pháp của hội viên, hỗ trợ nhau hoạt động có hiệu quả, góp phần vào sự phát triển kinh tế – xã hội của đất nước.",
        ],
      },
      {
        num: "3",
        title: "Địa vị pháp lý, trụ sở",
        paragraphs: [
          "Hội Trầm hương Việt Nam có tư cách pháp nhân, có con dấu và tài khoản riêng; hoạt động theo quy định pháp luật Việt Nam và Điều lệ Hội được Bộ trưởng Bộ Nội vụ phê duyệt theo quy định của pháp luật.",
          "Trụ sở chính của Hội đặt tại: Số 150, Đường Lý Chính Thắng, Phường Xuân Hòa, Thành phố Hồ Chí Minh. Hội được lập văn phòng đại diện ở các tỉnh, thành phố trực thuộc Trung ương theo quy định của pháp luật.",
        ],
      },
      {
        num: "4",
        title: "Phạm vi, lĩnh vực hoạt động",
        paragraphs: [
          "Hội Trầm hương Việt Nam hoạt động trên phạm vi cả nước, trong lĩnh vực trầm hương theo quy định của pháp luật.",
          "Hội Trầm hương Việt Nam chịu sự quản lý nhà nước của Bộ Nội vụ; sự quản lý chuyên ngành của Bộ Nông nghiệp và Phát triển nông thôn về lĩnh vực chính của Hội và các Bộ ngành có liên quan đến lĩnh vực Hội hoạt động theo quy định của pháp luật.",
        ],
      },
      {
        num: "5",
        title: "Nguyên tắc tổ chức, hoạt động",
        paragraphs: [
          [
            "Tự nguyện, tự quản.",
            "Dân chủ, bình đẳng, công khai, minh bạch.",
            "Tự đảm bảo kinh phí hoạt động.",
            "Không vì mục đích lợi nhuận.",
            "Tuân thủ Hiến pháp, pháp luật và Điều lệ Hội.",
          ],
        ],
      },
    ],
  },
  {
    id: "chuong-2",
    number: "II",
    title: "Quyền hạn và nhiệm vụ",
    articles: [
      {
        num: "6",
        title: "Quyền hạn",
        paragraphs: [
          "1. Tuyên truyền tôn chỉ, mục đích hoạt động của Hội theo quy định của pháp luật.",
          "2. Đại diện cho hội viên và tổ chức của Hội trong các quan hệ có liên quan đến mục đích, chức năng, nhiệm vụ của Hội theo quy định của pháp luật.",
          "3. Bảo vệ quyền, lợi ích hợp pháp của Hội và hội viên phù hợp với tôn chỉ, mục đích của Hội; hoạt động trong lĩnh vực trồng trọt, sản xuất, chế biến, kinh doanh dịch vụ, nghiên cứu khoa học, công nghệ cấy tạo trầm hương và các sản phẩm, dịch vụ khác có liên quan đến lĩnh vực trầm hương theo quy định của pháp luật.",
          "4. Tham gia chương trình, dự án, đề tài nghiên cứu, tư vấn, phản biện và giám định xã hội theo đề nghị của cơ quan nhà nước; cung cấp dịch vụ công về các vấn đề thuộc lĩnh vực hoạt động của Hội theo quy định của pháp luật.",
          "5. Tham gia ý kiến vào các văn bản quy phạm pháp luật có liên quan đến nội dung hoạt động của Hội; kiến nghị với cơ quan nhà nước có thẩm quyền đối với các vấn đề liên quan tới sự phát triển bền vững của Hội và lĩnh vực Hội hoạt động. Được tổ chức tập huấn chuyên môn, bồi dưỡng kiến thức, tổ chức các hoạt động dịch vụ khác về trầm hương theo quy định của pháp luật.",
          "6. Phối hợp với cơ quan, tổ chức có liên quan để thực hiện nhiệm vụ của Hội theo quy định của Điều lệ Hội và quy định của pháp luật.",
          "7. Thành lập và chịu trách nhiệm toàn diện về tổ chức, hoạt động, quản lý các tổ chức có tư cách pháp nhân trực thuộc Hội theo quy định của pháp luật, phù hợp với Điều lệ Hội và lĩnh vực hoạt động của Hội, báo cáo Bộ Nội vụ và Bộ Nông nghiệp và Phát triển nông thôn về việc thành lập pháp nhân và hoạt động của các pháp nhân.",
          "8. Được gây quỹ Hội trên cơ sở hội phí của hội viên và các nguồn thu từ hoạt động kinh doanh, dịch vụ theo quy định của pháp luật để tự trang trải về kinh phí hoạt động.",
          "9. Được nhận các nguồn tài trợ hợp pháp của các tổ chức, cá nhân trong và ngoài nước theo quy định của pháp luật. Được Nhà nước hỗ trợ kinh phí để thực hiện các nhiệm vụ do Nhà nước giao (nếu có) theo quy định của pháp luật.",
          "10. Được gia nhập các tổ chức quốc tế tương ứng cùng lĩnh vực Hội hoạt động theo quy định của pháp luật. Được ký kết, thực hiện các thỏa thuận quốc tế theo quy định của pháp luật sau khi có ý kiến của các cơ quan có thẩm quyền. Hội có trách nhiệm báo cáo Bộ Nội vụ, Bộ Nông nghiệp và Phát triển nông thôn và các cơ quan có thẩm quyền liên quan về việc gia nhập tổ chức quốc tế tương ứng, ký kết, thực hiện thỏa thuận quốc tế.",
          "11. Thực hiện các quyền hạn khác theo quy định của pháp luật.",
        ],
      },
      {
        num: "7",
        title: "Nhiệm vụ",
        paragraphs: [
          "1. Chấp hành các quy định của pháp luật có liên quan đến tổ chức, hoạt động của Hội. Tổ chức, hoạt động theo Điều lệ Hội đã được Bộ trưởng Bộ Nội vụ phê duyệt. Không được lợi dụng hoạt động của Hội để làm phương hại đến an ninh quốc gia, trật tự xã hội, đạo đức, thuần phong mỹ tục, truyền thống của dân tộc, quyền và lợi ích hợp pháp của cá nhân, tổ chức.",
          "2. Tập hợp, đoàn kết hội viên; tổ chức, phối hợp hoạt động giữa các hội viên vì lợi ích chung của Hội; thực hiện đúng tôn chỉ, mục đích của Hội nhằm tham gia phát triển lĩnh vực hoạt động của Hội, góp phần xây dựng và phát triển đất nước.",
          "3. Phổ biến, bồi dưỡng kiến thức cho hội viên, hướng dẫn hội viên tuân thủ pháp luật, chế độ, chính sách của Nhà nước và Điều lệ, quy chế, quy định của Hội.",
          "4. Tham gia nghiên cứu khoa học công nghệ về lĩnh vực trầm hương; tập huấn, chuyển giao tiến bộ khoa học kỹ thuật vào trồng trọt, cấy tạo trầm, sản xuất, chế biến các sản phẩm trầm hương; tham gia xúc tiến đầu tư thương mại và các hoạt động liên quan đến lĩnh vực trầm hương theo quy định của pháp luật.",
          "5. Hợp tác với các tổ chức, cá nhân trong và ngoài nước có liên quan nhằm trao đổi kinh nghiệm, hỗ trợ phát triển ngành trầm hương theo quy định pháp luật.",
          "6. Đại diện hội viên tham gia, kiến nghị, đề xuất ý kiến với các cơ quan có thẩm quyền về các chủ trương của Đảng, chính sách pháp luật của Nhà nước liên quan đến lĩnh vực hoạt động của Hội theo quy định của pháp luật.",
          "7. Chịu trách nhiệm hòa giải các tranh chấp, giải quyết đơn, thư kiến nghị, khiếu nại, tố cáo trong nội bộ Hội và liên quan đến Hội, tổ chức pháp nhân trực thuộc Hội, hội viên theo quy định của pháp luật, Điều lệ Hội và báo cáo kết quả xác minh, giải quyết với cơ quan nhà nước có thẩm quyền theo quy định.",
          "8. Hàng năm Hội báo cáo tình hình tổ chức, hoạt động của Hội với cơ quan nhà nước có thẩm quyền cho phép thành lập Hội và cơ quan quản lý lĩnh vực mà Hội hoạt động theo quy định của pháp luật. Chấp hành sự hướng dẫn, kiểm tra, thanh tra của cơ quan nhà nước có thẩm quyền theo quy định của pháp luật.",
          "9. Xây dựng và ban hành quy tắc đạo đức nghề nghiệp trong hoạt động của Hội theo Điều lệ Hội và phù hợp với quy định của pháp luật.",
          "10. Quản lý và sử dụng tài sản, các nguồn tài chính của Hội hiệu quả theo đúng quy định của pháp luật.",
          "11. Thực hiện các nhiệm vụ khác khi cơ quan nhà nước có thẩm quyền yêu cầu.",
        ],
      },
    ],
  },
  {
    id: "chuong-3",
    number: "III",
    title: "Hội viên",
    articles: [
      {
        num: "8",
        title: "Hội viên, tiêu chuẩn hội viên",
        paragraphs: [
          "1. Hội viên của Hội gồm hội viên chính thức, hội viên liên kết và hội viên danh dự:",
          "a) Hội viên chính thức của Hội gồm có: Hội viên tổ chức và hội viên cá nhân.",
          "— Hội viên tổ chức: Là tổ chức có tư cách pháp nhân của Việt Nam hoạt động trong lĩnh vực trầm hương theo quy định của pháp luật Việt Nam, cam kết thực hiện tôn chỉ, mục đích của Hội, có đủ các tiêu chuẩn theo quy định tại Khoản 2 Điều này, tán thành Điều lệ Hội, tự nguyện có đơn xin gia nhập Hội, được Ban Chấp hành Hội xem xét, công nhận là hội viên chính thức.",
          "— Hội viên cá nhân: Là công dân Việt Nam hoạt động trong lĩnh vực trầm hương theo quy định của pháp luật Việt Nam, cam kết thực hiện tôn chỉ, mục đích của Hội, có đủ các tiêu chuẩn theo quy định tại Khoản 2 Điều này, tán thành Điều lệ Hội, tự nguyện có đơn xin gia nhập Hội, được Ban Chấp hành Hội xem xét, công nhận là hội viên chính thức.",
          "b) Hội viên liên kết của Hội: Các doanh nghiệp, tổ chức của Việt Nam không có điều kiện hoặc không đủ tiêu chuẩn trở thành hội viên chính thức của Hội, nhưng có nguyện vọng tham gia đóng góp vào hoạt động của Hội trong lĩnh vực trầm hương theo quy định của pháp luật, tán thành Điều lệ Hội, tự nguyện có đơn xin gia nhập Hội, được Ban Chấp hành Hội xem xét, công nhận là hội viên liên kết. Các doanh nghiệp liên doanh và doanh nghiệp có 100% vốn đầu tư nước ngoài (sau đây gọi chung là doanh nghiệp có yếu tố nước ngoài) hoạt động hợp pháp tại Việt Nam có liên quan đến lĩnh vực hoạt động của Hội, có đóng góp cho sự phát triển của Hội, tán thành Điều lệ Hội, tự nguyện có đơn xin gia nhập Hội, được Ban Chấp hành Hội xem xét, công nhận là hội viên liên kết.",
          "c) Hội viên danh dự của Hội: Công dân Việt Nam và tổ chức pháp nhân của Việt Nam không đủ điều kiện hoặc không có đủ tiêu chuẩn để trở thành hội viên chính thức của Hội, nhưng có uy tín và ảnh hưởng lớn trong xã hội, có đóng góp cho Hội, tán thành Điều lệ Hội, tự nguyện có đơn xin gia nhập Hội, được Ban Chấp hành Hội xem xét, công nhận là hội viên danh dự của Hội.",
          "2. Tiêu chuẩn hội viên chính thức:",
          "a) Hội viên cá nhân: Công dân Việt Nam từ đủ 18 tuổi trở lên, có đầy đủ năng lực hành vi dân sự, hoạt động trong lĩnh vực liên quan đến hoạt động của Hội, có điều kiện tham gia các hoạt động thường xuyên của Hội; tự nguyện viết Đơn xin gia nhập Hội (theo mẫu Đơn do Hội quy định).",
          "b) Hội viên tổ chức: Các doanh nghiệp và các tổ chức kinh tế, xã hội Việt Nam được thành lập theo Luật Doanh nghiệp, có tư cách pháp nhân hoạt động hợp pháp trong lĩnh vực liên quan đến trồng trọt, sản xuất, chế biến, kinh doanh dịch vụ, cung ứng xuất khẩu, nghiên cứu khoa học công nghệ và các sản phẩm, dịch vụ khác liên quan đến trầm hương trên lãnh thổ Việt Nam theo quy định của pháp luật Việt Nam, có điều kiện tham gia thường xuyên, đầy đủ các hoạt động của Hội, tự nguyện viết Đơn xin gia nhập Hội (theo mẫu Đơn do Hội quy định) kèm theo bản sao giấy phép thành lập, quyết định thành lập hoặc giấy chứng nhận đăng ký kinh doanh.",
          "c) Mỗi tổ chức là hội viên chính thức cử 01 (một) người đại diện làm đầu mối tham gia các hoạt động của Hội. Người đại diện phải làm việc chính thức tại tổ chức có tư cách pháp nhân đó. Người đại diện phải có đủ thẩm quyền quyết định, được ghi rõ họ tên, chức vụ trong đơn xin gia nhập Hội; trường hợp ủy nhiệm, người được ủy nhiệm làm đại diện phải đủ thẩm quyền quyết định và người ủy nhiệm phải chịu trách nhiệm về sự ủy nhiệm đó. Trường hợp thay đổi người đại diện, hội viên phải thông báo bằng văn bản ngay sau khi thay đổi người đại diện gửi cho Ban Chấp hành Hội biết (chậm nhất 05 (năm) ngày kể từ ngày có sự thay đổi người đại diện).",
        ],
      },
      {
        num: "9",
        title: "Quyền của hội viên",
        paragraphs: [
          "1. Được Hội bảo vệ quyền và lợi ích hợp pháp theo quy định của pháp luật, trong hoạt động nghề nghiệp, sản xuất, kinh doanh trong phạm vi của Hội.",
          "2. Được Hội cung cấp các thông tin cần thiết có liên quan đến lĩnh vực hoạt động sản xuất, kinh doanh, khoa học kỹ thuật, đưa tiến bộ khoa học kỹ thuật vào sản xuất, chế biến và liên quan đến phát triển cây Dó bầu (trầm hương); được tham gia các hoạt động do Hội tổ chức theo quy định Điều lệ Hội.",
          "3. Được quyền tham dự Đại hội. Hội viên có quyền thảo luận biểu quyết các vấn đề của Đại hội, quyền ứng cử, đề cử và quyền được bầu vào các chức danh lãnh đạo, Ban Chấp hành và Ban Kiểm tra của Hội theo quy định của Hội.",
          "4. Được tham gia góp ý kiến, kiến nghị với các cơ quan chức năng nhà nước những vấn đề về cơ chế, chính sách của Nhà nước có liên quan đến hoạt động nghề nghiệp thông qua tổ chức của Hội, trong việc sản xuất, chế biến, kinh doanh, nghiên cứu khoa học công nghệ, tập huấn chuyên môn về lĩnh vực trầm hương và các vấn đề cần thiết khác nhằm tạo sự ổn định và phát triển Hội góp phần thúc đẩy phát triển lĩnh vực trầm hương.",
          "5. Được chủ động trong quan hệ kinh tế, hoạt động đối ngoại, khi cần thiết được Hội ủy quyền thay mặt Hội trong quan hệ nghề nghiệp với các tổ chức khác ngoài Hội theo Điều lệ Hội và phù hợp với quy định của pháp luật.",
          "6. Được giới thiệu các tổ chức, công dân để trở thành hội viên của Hội theo Điều lệ Hội và quy định của pháp luật.",
          "7. Được khen thưởng về những kết quả hoạt động đóng góp chung cho Hội theo quy định Điều lệ Hội và quy định của pháp luật.",
          "8. Được cấp thẻ hội viên.",
          "9. Được ra khỏi Hội khi xét thấy không thể tiếp tục là hội viên.",
          "10. Hội viên liên kết, hội viên danh dự được hưởng quyền và nghĩa vụ như hội viên chính thức, trừ quyền biểu quyết các vấn đề của Hội và quyền tham gia ứng cử, bầu cử vào Ban lãnh đạo, Ban Kiểm tra Hội.",
        ],
      },
      {
        num: "10",
        title: "Nghĩa vụ của hội viên",
        paragraphs: [
          [
            "Nghiêm chỉnh chấp hành chủ trương, đường lối của Đảng, chính sách, pháp luật của Nhà nước; chấp hành Điều lệ, quy định của Hội.",
            "Tham gia các hoạt động và sinh hoạt của Hội; đoàn kết, hợp tác với các hội viên khác để xây dựng Hội phát triển vững mạnh.",
            "Bảo vệ uy tín của Hội, không được nhân danh Hội trong các quan hệ giao dịch, trừ khi được Lãnh đạo Hội phân công bằng văn bản.",
            "Thực hiện chế độ thông tin, báo cáo theo quy định của Hội.",
            "Đóng hội phí đầy đủ và đúng hạn theo quy định của Hội.",
          ],
        ],
      },
      {
        num: "11",
        title: "Thủ tục, thẩm quyền kết nạp hội viên; thủ tục ra khỏi Hội",
        paragraphs: [
          "1. Thủ tục gia nhập Hội:",
          "a) Các tổ chức, cá nhân có đủ tiêu chuẩn theo quy định tại Điều 8 có nguyện vọng tự nguyện gia nhập Hội, nộp hồ sơ gửi Ban Chấp hành Hội.",
          "b) Hồ sơ, thủ tục xin gia nhập Hội gồm: Đơn tự nguyện gia nhập Hội theo mẫu của Hội quy định; Bản sao Giấy chứng nhận đăng ký kinh doanh đối với doanh nghiệp, Quyết định thành lập đối với pháp nhân (đối với tổ chức); Căn cước công dân/Hộ chiếu (đối với cá nhân); Danh sách lãnh đạo chủ chốt đại diện cho tổ chức (đối với tổ chức); Văn bản giới thiệu người đại diện của tổ chức, doanh nghiệp (đối với tổ chức).",
          "2. Thẩm quyền kết nạp hội viên: Văn phòng Hội xem xét hồ sơ xin gia nhập Hội sau khi tổ chức, cá nhân nộp hồ sơ đầy đủ, hợp lệ xin gia nhập Hội theo Điều lệ Hội. Ban Chấp hành Hội xem xét, kết nạp hội viên tại kỳ họp gần nhất theo Quy chế làm việc, đề nghị Chủ tịch Hội ra quyết định công nhận hội viên theo Điều lệ Hội. Hội viên mới phải nộp hội phí trong vòng 15 (mười lăm) ngày kể từ ngày được kết nạp là hội viên chính thức.",
          "3. Thủ tục ra khỏi Hội, khai trừ và xóa tên hội viên: Trường hợp tự nguyện, cá nhân mất năng lực hành vi, tổ chức giải thể/phá sản, bị đình chỉ hoạt động, hoặc vi phạm nghiêm trọng Điều lệ Hội — Ban Chấp hành xem xét quyết định theo quy trình nêu trong Điều lệ. Hội viên bị khai trừ có quyền khiếu nại lên Đại hội; quyết định của Đại hội là quyết định cuối cùng.",
          "4. Đối với ủy viên Ban Chấp hành muốn xin ra khỏi Hội phải có đơn gửi Ban Chấp hành và báo cáo tại cuộc họp Ban Chấp hành gần nhất, Ban Chấp hành sẽ xem xét quyết định và phải tiến hành bàn giao công việc cơ sở vật chất tài chính mà mình phụ trách (nếu có) cho tổ chức cá nhân được Ban Chấp hành giao tiếp nhận.",
          "5. Ủy viên Ban Chấp hành không tham dự liên tục 03 (ba) kỳ họp Ban Chấp hành mà không có lý do chính đáng thì bị xóa tên trong danh sách Ban Chấp hành, đồng thời phải có trách nhiệm bàn giao công việc cơ sở vật chất, tài chính mà mình phụ trách cho Hội.",
        ],
      },
    ],
  },
  {
    id: "chuong-4",
    number: "IV",
    title: "Tổ chức, hoạt động",
    articles: [
      {
        num: "12",
        title: "Cơ cấu tổ chức của Hội",
        paragraphs: [
          [
            "Đại hội.",
            "Ban Chấp hành.",
            "Ban Thường vụ.",
            "Ban Kiểm tra.",
            "Văn phòng và các ban chuyên môn.",
            "Các tổ chức trực thuộc Hội được thành lập theo quy định của pháp luật.",
          ],
        ],
      },
      {
        num: "13",
        title: "Đại hội",
        paragraphs: [
          "1. Cơ quan lãnh đạo cao nhất của Hội là Đại hội nhiệm kỳ hoặc Đại hội bất thường. Đại hội nhiệm kỳ được tổ chức 05 (năm) năm một lần, do Ban Chấp hành triệu tập. Đại hội bất thường được triệu tập khi có ít nhất 2/3 (hai phần ba) tổng số ủy viên Ban Chấp hành hoặc có ít nhất 1/2 (một phần hai) tổng số hội viên chính thức đề nghị.",
          "2. Đại hội nhiệm kỳ hoặc Đại hội bất thường được tổ chức dưới hình thức Đại hội toàn thể hoặc Đại hội đại biểu, số lượng, thành phần đại biểu do Ban Chấp hành quyết định. Đại hội toàn thể hoặc Đại hội đại biểu được tổ chức khi có trên 1/2 số hội viên chính thức hoặc có trên 1/2 số đại biểu chính thức có mặt.",
          "3. Nhiệm vụ của Đại hội: Thảo luận và thông qua báo cáo tổng kết nhiệm kỳ; phương hướng, nhiệm vụ nhiệm kỳ mới của Hội; Thảo luận và thông qua Điều lệ, Điều lệ (sửa đổi, bổ sung); đổi tên, chia, tách, sáp nhập, hợp nhất, giải thể Hội (nếu có); Thảo luận, góp ý kiến vào Báo cáo kiểm điểm của Ban Chấp hành, Ban Thường vụ, Ban Kiểm tra và Báo cáo tài chính của Hội; Bầu Ban Chấp hành và Ban Kiểm tra Hội; Quyết định các nội dung khác vượt quá thẩm quyền của Ban Chấp hành theo quy định của Hội (nếu có); Thông qua Nghị quyết Đại hội.",
          "4. Nguyên tắc biểu quyết tại Đại hội: Đại hội có thể biểu quyết bằng hình thức giơ tay hoặc bỏ phiếu kín. Việc quy định hình thức biểu quyết do Đại hội quyết định. Các quyết định của Đại hội phải được trên 1/2 đại biểu chính thức có mặt tại Đại hội biểu quyết tán thành.",
        ],
      },
      {
        num: "14",
        title: "Ban Chấp hành Hội",
        paragraphs: [
          "1. Ban Chấp hành Hội do Đại hội bầu trong số các hội viên chính thức của Hội. Số lượng, cơ cấu, tiêu chuẩn ủy viên Ban Chấp hành do Đại hội quyết định. Nhiệm kỳ của Ban Chấp hành cùng với nhiệm kỳ của Đại hội.",
          "2. Nhiệm vụ và quyền hạn của Ban Chấp hành: Tổ chức triển khai thực hiện Nghị quyết Đại hội, Điều lệ Hội, chỉ đạo mọi hoạt động của Hội giữa hai kỳ Đại hội; Chuẩn bị nội dung và quyết định triệu tập Đại hội; Quyết định chương trình, kế hoạch công tác hàng năm của Hội; Quyết định cơ cấu tổ chức bộ máy của Hội, ban hành Quy chế tổ chức và hoạt động của Hội; Quy chế quản lý, sử dụng tài chính, tài sản của Hội; Quy chế quản lý, sử dụng con dấu của Hội phù hợp quy định của pháp luật; Quy chế khen thưởng, kỷ luật; các quy chế khác trong nội bộ Hội phù hợp với quy định của pháp luật và Điều lệ Hội; Bầu, miễn nhiệm Chủ tịch, các Phó Chủ tịch, Tổng thư ký, ủy viên Ban Thường vụ, bầu bổ sung ủy viên Ban Chấp hành, Ban Kiểm tra. Số lượng ủy viên Ban Chấp hành bầu bổ sung không được quá số lượng ủy viên Ban Chấp hành đã được Đại hội quyết định; Xem xét, quyết định kết nạp hội viên, cho hội viên ra khỏi Hội; khai trừ và xóa tên hội viên; khen thưởng và kỷ luật hội viên theo Điều lệ Hội và quy định của pháp luật.",
          "3. Nguyên tắc hoạt động của Ban Chấp hành: Ban Chấp hành hoạt động theo Quy chế tổ chức và hoạt động của Hội, tuân thủ quy định của pháp luật và Điều lệ Hội. Ban Chấp hành họp thường kỳ mỗi năm 02 (hai) lần, có thể họp bất thường khi có yêu cầu của trên 1/2 tổng số ủy viên Ban Thường vụ hoặc có ít nhất 2/3 tổng số ủy viên Ban Chấp hành; hoặc khi có yêu cầu của Chủ tịch Hội tùy theo tình hình thực tế. Các cuộc họp Ban Chấp hành là hợp lệ khi có 2/3 số ủy viên Ban Chấp hành tham. Ban Chấp hành có thể biểu quyết bằng hình thức giơ tay hoặc bỏ phiếu kín. Các Nghị quyết, Quyết định của Ban Chấp hành được thông qua khi có 2/3 tổng số ủy viên Ban Chấp hành dự họp biểu quyết tán thành.",
        ],
      },
      {
        num: "15",
        title: "Ban Thường vụ Hội",
        paragraphs: [
          "1. Ban Thường vụ Hội do Ban Chấp hành bầu trong số các ủy viên Ban Chấp hành. Ban Thường vụ Hội gồm: Chủ tịch, các Phó Chủ tịch và các ủy viên. Số lượng, cơ cấu, tiêu chuẩn ủy viên Ban Thường vụ do Ban Chấp hành quyết định. Nhiệm kỳ của Ban Thường vụ cùng với nhiệm kỳ Đại hội.",
          "2. Nhiệm vụ và quyền hạn của Ban Thường vụ: Thay mặt Ban Chấp hành triển khai thực hiện Nghị quyết Đại hội, Điều lệ Hội; tổ chức thực hiện Nghị quyết, Quyết định của Ban Chấp hành; lãnh đạo hoạt động của Hội giữa hai kỳ họp Ban Chấp hành; Chuẩn bị nội dung và quyết định triệu tập họp Ban Chấp hành; Quyết định thành lập các tổ chức, đơn vị trực thuộc Hội theo nghị quyết của Ban Chấp hành; quy định chức năng, nhiệm vụ, quyền hạn cơ cấu tổ chức; quyết định bổ nhiệm, miễn nhiệm lãnh đạo các tổ chức, đơn vị thuộc Hội theo đúng quy định của pháp luật và Điều lệ Hội.",
          "3. Nguyên tắc hoạt động của Ban Thường vụ: Ban Thường vụ hoạt động theo Quy chế tổ chức và hoạt động của Hội, tuân thủ quy định của pháp luật và Điều lệ Hội. Ban Thường vụ mỗi năm họp 04 (bốn) lần, có thể họp bất thường khi có yêu cầu của Chủ tịch Hội hoặc có ít nhất 2/3 (hai phần ba) tổng số ủy viên Ban Thường vụ có ý kiến bằng văn bản. Các cuộc họp của Ban Thường vụ là hợp lệ khi có 2/3 (hai phần ba) số ủy viên Ban Thường vụ tham gia dự họp. Ban Thường vụ có thể biểu quyết bằng hình thức giơ tay hoặc bỏ phiếu kín. Các Nghị quyết, Quyết định của Ban Thường vụ được thông qua khi có 2/3 (hai phần ba) tổng số ủy viên Ban Thường vụ dự họp biểu quyết tán thành.",
        ],
      },
      {
        num: "16",
        title: "Ban Kiểm tra Hội",
        paragraphs: [
          "1. Ban Kiểm tra Hội do Đại hội bầu trong số các hội viên chính thức của Hội. Ban Kiểm tra gồm Trưởng ban, Phó Trưởng ban và một số ủy viên. Trưởng ban Kiểm tra được Ban Kiểm tra bầu, trúng cử theo nguyên tắc quá bán. Số lượng, cơ cấu, tiêu chuẩn ủy viên Ban Kiểm tra do Đại hội quyết định. Nhiệm kỳ của Ban Kiểm tra cùng với nhiệm kỳ của Đại hội.",
          "2. Nhiệm vụ và quyền hạn của Ban Kiểm tra: Bầu, miễn nhiệm Trưởng ban, Phó Trưởng ban; bổ sung, miễn nhiệm ủy viên Ban Kiểm tra; Kiểm tra, giám sát việc thực hiện Điều lệ Hội, Nghị quyết Đại hội; Nghị quyết, Quyết định của Ban Chấp hành, Ban Thường vụ Hội, các quy chế của Hội trong hoạt động của các tổ chức, đơn vị trực thuộc Hội, hội viên; Xem xét, giải quyết đơn, thư phản ánh kiến nghị, khiếu nại, tố cáo có liên quan đến Hội của các tổ chức, hội viên và công dân gửi đến Hội theo Điều lệ Hội.",
          "3. Nguyên tắc hoạt động của Ban Kiểm tra: Ban Kiểm tra hoạt động độc lập với Ban Chấp hành, theo quy chế của Ban Kiểm tra do Ban Chấp hành Hội ban hành, tuân thủ Điều lệ Hội và quy định của pháp luật.",
        ],
      },
      {
        num: "17",
        title: "Chủ tịch, Phó Chủ tịch Hội",
        paragraphs: [
          "1. Chủ tịch Hội là người đại diện pháp luật của Hội, chịu trách nhiệm trước Hội và trước pháp luật về mọi hoạt động của Hội. Chủ tịch Hội là ủy viên Ban Thường vụ do Ban Chấp hành bầu trong số các ủy viên Ban Thường vụ. Tiêu chuẩn Chủ tịch Hội do Ban Chấp hành Hội quy định theo Điều lệ Hội và phù hợp với quy định của pháp luật.",
          "2. Nhiệm vụ, quyền hạn của Chủ tịch Hội: Thực hiện nhiệm vụ, quyền hạn theo Quy chế hoạt động của Ban Chấp hành, Ban Thường vụ Hội; Chịu trách nhiệm toàn diện trước cơ quan có thẩm quyền cho phép thành lập Hội, cơ quan quản lý nhà nước về lĩnh vực hoạt động chính của Hội, trước Ban Chấp hành, Ban Thường vụ Hội về mọi hoạt động của Hội. Chỉ đạo, điều hành mọi hoạt động của Hội theo quy định Điều lệ Hội; Nghị quyết Đại hội; Nghị quyết, Quyết định của Ban Chấp hành, Ban Thường vụ; Chỉ đạo chuẩn bị, triệu tập và chủ trì các cuộc họp của Ban Chấp hành, Ban Thường vụ Hội; Thay mặt Ban Chấp hành, Ban Thường vụ ký các văn bản của Hội; Khi Chủ tịch Hội vắng mặt, việc chỉ đạo, điều hành giải quyết công việc của Hội được Ban Thường vụ thông qua việc ủy quyền bằng văn bản cho một Phó Chủ tịch Hội theo Quy chế làm việc do Ban Chấp hành quy định cụ thể.",
          "3. Các Phó Chủ tịch Hội: Phó Chủ tịch là ủy viên Ban Thường vụ Hội do Ban Chấp hành bầu trong số các ủy viên Ban Thường vụ Hội. Số lượng, cơ cấu, tiêu chuẩn Phó Chủ tịch Hội do Ban Chấp hành Hội quy định. Các Phó Chủ tịch giúp Chủ tịch Hội chỉ đạo, điều hành công tác của Hội theo sự phân công của Chủ tịch Hội; chịu trách nhiệm trước Chủ tịch Hội và trước pháp luật về lĩnh vực công việc được Chủ tịch Hội phân công hoặc ủy quyền. Phó Chủ tịch Hội thực hiện nhiệm vụ, quyền hạn theo Quy chế hoạt động của Ban Chấp hành, Ban Thường vụ Hội theo Điều lệ Hội và quy định của pháp luật.",
          "4. Tùy theo tình hình thực tế, một Phó Chủ tịch có thể kiêm Tổng thư ký (chức danh này đều phải được bầu) và thực hiện các nhiệm vụ quy định đối với Phó Chủ tịch và Tổng thư ký theo Điều lệ Hội.",
        ],
      },
      {
        num: "18",
        title: "Tổng thư ký Hội",
        paragraphs: [
          "1. Tổng thư ký Hội do Ban Chấp hành bầu trong số các ủy viên Ban Chấp hành Hội. Tiêu chuẩn, nhiệm vụ, quyền hạn của Tổng thư ký do Ban Chấp hành Hội quyết định theo Điều lệ Hội và quy định của pháp luật.",
          "2. Nhiệm vụ, quyền hạn của Tổng thư ký: Là người quản lý, điều hành trực tiếp các hoạt động của Văn phòng Hội; Xây dựng quy chế hoạt động của Văn phòng Hội trình Ban Chấp hành Hội phê duyệt; Chuẩn bị nội dung các kỳ họp của Ban Chấp hành và Ban Thường vụ; định kỳ báo cáo cho Ban Chấp hành và Ban Thường vụ về các hoạt động của Hội; lập báo cáo hàng năm, báo cáo nhiệm kỳ của Ban Chấp hành Hội; Quản lý và sử dụng tài sản, tài chính của Hội theo quy chế quản lý, sử dụng tài chính, tài sản của Hội do Ban Chấp hành Hội ban hành theo Điều lệ Hội và phù hợp với quy định của pháp luật; Chịu trách nhiệm trước Ban Chấp hành, Ban Thường vụ và trước pháp luật về các hoạt động của Văn phòng Hội.",
        ],
      },
      {
        num: "19",
        title: "Văn phòng Hội và các ban chuyên môn thuộc Hội",
        paragraphs: [
          "1. Văn phòng Hội và các ban chuyên môn của Hội do Ban Thường vụ xem xét thông qua đề nghị, Chủ tịch Hội quyết định.",
          "2. Nhân sự, tài chính của Văn phòng Hội do Ban Chấp hành thông qua, trước khi Chủ tịch Hội quyết định. Chánh văn phòng do Tổng thư ký đề nghị Chủ tịch xem xét, quyết định bổ nhiệm. Văn phòng Hội do Tổng thư ký phụ trách, điều hành theo Điều lệ Hội (trừ trường hợp quy định tại Khoản 4 Điều 17). Văn phòng Hội hoạt động theo quy chế do Ban Chấp hành ban hành theo Điều lệ Hội và phù hợp với quy định pháp luật.",
          "3. Văn phòng Hội và các ban chuyên môn là bộ phận giúp việc của Hội, Chủ tịch, Ban Thường vụ, Ban Chấp hành; hoạt động theo quy chế của Ban Chấp hành ban hành phù hợp với Điều lệ Hội.",
          "4. Văn phòng Hội thực hiện các nhiệm vụ, quyền hạn sau: Thực hiện các nghiệp vụ tổ chức, tổng hợp, kế toán, thông tin, báo cáo Ban Chấp hành, Ban Thường vụ, Chủ tịch Hội, Tổng thư ký và toàn thể các thành viên của Hội; Giúp Tổng thư ký phối hợp hoạt động với các văn phòng đại diện của Hội, tổ chức các kỳ Đại hội, Hội nghị thường niên, các hội thảo chuyên đề hay các hội thảo tập huấn khác; Theo dõi, cập nhật tình hình hoạt động, tư vấn, cung cấp thông tin cho hội viên; Thực hiện việc quản lý hồ sơ hội viên bao gồm việc gia nhập, điều chỉnh, bổ sung, xin rút, khai trừ; thu phí gia nhập và hội phí; Quản lý tài sản và tài chính của Hội theo Điều lệ Hội.",
        ],
      },
      {
        num: "20",
        title: "Các tổ chức trực thuộc Hội",
        paragraphs: [
          "Việc thành lập các đơn vị trực thuộc Hội phải tuân thủ theo quy định của pháp luật và Điều lệ Hội. Các tổ chức trực thuộc Hội hoạt động theo Quy chế hoạt động riêng biệt phù hợp với từng tổ chức trực thuộc Hội do Ban Thường vụ Hội ban hành phù hợp với Điều lệ Hội và quy định của pháp luật.",
        ],
      },
    ],
  },
  {
    id: "chuong-5",
    number: "V",
    title: "Chia, tách; sáp nhập; hợp nhất; đổi tên và giải thể",
    articles: [
      {
        num: "21",
        title: "Chia, tách; sáp nhập; hợp nhất; đổi tên và giải thể Hội",
        paragraphs: [
          "1. Việc chia, tách; sáp nhập; hợp nhất; đổi tên và giải thể Hội thực hiện theo quy định của Bộ luật Dân sự, quy định của pháp luật về hội, Điều lệ Hội, nghị quyết Đại hội và các quy định pháp luật có liên quan.",
          "2. Khi chia, tách; sáp nhập; hợp nhất; đổi tên và giải thể phải tiến hành kiểm kê tài chính, tài sản của Hội chính xác, đầy đủ, kịp thời và thực hiện các thủ tục theo quy định của pháp luật.",
        ],
      },
    ],
  },
  {
    id: "chuong-6",
    number: "VI",
    title: "Tài chính và tài sản",
    articles: [
      {
        num: "22",
        title: "Tài chính và tài sản của Hội",
        paragraphs: [
          "1. Tài chính của Hội:",
          "a) Nguồn thu của Hội: Phí gia nhập Hội; hội phí hàng năm của hội viên theo quy định của Hội. Căn cứ theo các quy định của pháp luật hiện hành và tình hình thực tế, Hội xem xét, thông qua mức đóng phí gia nhập và hội phí hàng năm của hội viên; Thu từ các hoạt động của Hội theo quy định của pháp luật; Tiền tài trợ, ủng hộ của tổ chức, cá nhân trong và ngoài nước theo quy định của pháp luật; Ngân sách nhà nước hỗ trợ (nếu có) cho các nhiệm vụ Nhà nước giao theo quy định của pháp luật; Các khoản thu hợp pháp khác.",
          "b) Các khoản chi của Hội: Chi hoạt động thực hiện nhiệm vụ của Hội; Chi thuê trụ sở làm việc, mua sắm phương tiện, tài sản làm việc; Chi thực hiện chế độ, chính sách đối với những người làm việc tại Hội theo quy định của Ban Chấp hành Hội phù hợp với quy định của pháp luật; Chi khen thưởng và các khoản chi khác theo quy định của Ban Chấp hành; Chi thực hiện nhiệm vụ Nhà nước giao (nếu có).",
          "2. Tài sản của Hội bao gồm: Trụ sở, trang thiết bị, phương tiện phục vụ hoạt động của Hội; tài sản của Hội được hình thành từ nguồn kinh phí của Hội, do các tổ chức, cá nhân trong và ngoài nước hiến, tặng theo quy định của pháp luật; được Nhà nước hỗ trợ (nếu có).",
        ],
      },
      {
        num: "23",
        title: "Quản lý, sử dụng tài chính, tài sản của Hội",
        paragraphs: [
          "1. Tài chính, tài sản của Hội chỉ được sử dụng cho các hoạt động của Hội.",
          "2. Tài chính, tài sản của Hội khi chia, tách, sáp nhập, hợp nhất và giải thể Hội được giải quyết theo quy định của pháp luật.",
          "3. Ban Chấp hành Hội ban hành quy chế quản lý, sử dụng tài chính, tài sản của Hội đảm bảo nguyên tắc công khai, minh bạch, tiết kiệm phù hợp với quy định của pháp luật và tôn chỉ, mục đích hoạt động của Hội.",
          "4. Việc quản lý, sử dụng tài sản của Hội thực hiện theo quy định của pháp luật dân sự, pháp luật có liên quan và Điều lệ của Hội. Đối với tài sản công thực hiện theo quy định của pháp luật về quản lý, sử dụng tài sản công.",
        ],
      },
    ],
  },
  {
    id: "chuong-7",
    number: "VII",
    title: "Khen thưởng, kỷ luật",
    articles: [
      {
        num: "24",
        title: "Khen thưởng",
        paragraphs: [
          "1. Tổ chức, đơn vị thuộc Hội, hội viên có thành tích xuất sắc được Hội khen thưởng hoặc được Hội đề nghị cơ quan, tổ chức có thẩm quyền khen thưởng theo quy định của pháp luật.",
          "2. Ban Chấp hành Hội quy định cụ thể hình thức, thẩm quyền, thủ tục khen thưởng trong nội bộ Hội theo Điều lệ Hội và theo quy định của pháp luật.",
        ],
      },
      {
        num: "25",
        title: "Kỷ luật",
        paragraphs: [
          "1. Tổ chức, đơn vị thuộc Hội, hội viên vi phạm pháp luật, vi phạm Điều lệ Hội, quy định, quy chế hoạt động của Hội thì bị xem xét, thi hành kỷ luật bằng các hình thức: phê bình, khiển trách, cảnh cáo, khai trừ, xóa tên ra khỏi Hội theo quy định của Điều lệ Hội hoặc đề nghị cơ quan nhà nước có thẩm quyền xử lý vi phạm theo quy định của pháp luật.",
          "2. Ban Chấp hành Hội quy định cụ thể thẩm quyền, quy trình xem xét kỷ luật trong nội bộ Hội theo Điều lệ Hội và quy định của pháp luật.",
        ],
      },
    ],
  },
  {
    id: "chuong-8",
    number: "VIII",
    title: "Điều khoản thi hành",
    articles: [
      {
        num: "26",
        title: "Sửa đổi, bổ sung",
        paragraphs: [
          "1. Việc sửa đổi, bổ sung Điều lệ được Đại hội đại biểu của Hội Trầm hương Việt Nam thông qua khi có trên 1/2 (một phần hai) tổng số đại biểu chính thức có mặt tại Đại hội biểu quyết tán thành.",
          "2. Điều lệ (sửa đổi, bổ sung) phải được Hội Trầm hương Việt Nam hoàn thiện đảm bảo phù hợp theo quy định của pháp luật và được Bộ trưởng Bộ Nội vụ phê duyệt mới có giá trị thực hiện.",
        ],
      },
      {
        num: "27",
        title: "Hiệu lực thi hành",
        paragraphs: [
          "1. Điều lệ (sửa đổi, bổ sung) của Hội Trầm hương Việt Nam gồm 08 (tám) Chương và 27 (hai mươi bảy) Điều đã được Đại hội đại biểu lần thứ III, nhiệm kỳ 2023 – 2028 của Hội Trầm hương Việt Nam nhất trí thông qua ngày 13 tháng 5 năm 2023 tại Thành phố Hồ Chí Minh và có hiệu lực thi hành theo Quyết định phê duyệt của Bộ trưởng Bộ Nội vụ.",
          "2. Điều lệ (sửa đổi, bổ sung) này thay thế Điều lệ Hội đã được phê duyệt kèm theo Quyết định số 688/QĐ-BNV ngày 23 tháng 6 năm 2010 của Bộ trưởng Bộ Nội vụ.",
          "3. Căn cứ các quy định pháp luật về hội và Điều lệ Hội, Ban Chấp hành Hội Trầm hương Việt Nam có trách nhiệm hướng dẫn và tổ chức thực hiện Điều lệ (sửa đổi, bổ sung) này.",
        ],
      },
    ],
  },
]

export default async function DieuLePage() {
  const pdfInfo = await getDieuLePdfInfo()

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
          <h1 className="text-3xl font-bold sm:text-4xl">
            Điều lệ (sửa đổi, bổ sung) Hội Trầm hương Việt Nam
          </h1>
          <p className="mt-3 text-brand-200 max-w-xl">
            Phê duyệt kèm theo Quyết định số <strong>1086/QĐ-BNV</strong> ngày{" "}
            <strong>29 tháng 12 năm 2023</strong> của Bộ trưởng Bộ Nội vụ.
          </p>
          <p className="mt-1 text-brand-300 text-sm">
            Gồm 8 chương, 27 điều — Thông qua tại Đại hội đại biểu lần thứ III,
            nhiệm kỳ 2023–2028 (ngày 13/5/2023).
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* ── PDF Download (dynamic from SiteConfig) ── */}
        {pdfInfo ? (
          <div className="mb-12 flex flex-col items-center gap-3 rounded-xl border-2 border-brand-300 bg-brand-50 p-8 text-center">
            <div className="text-4xl">📄</div>
            <h2 className="text-lg font-bold text-brand-900">
              Tải xuống Điều lệ Hội (bản PDF chính thức)
            </h2>
            <p className="text-sm text-brand-600">
              Điều lệ (sửa đổi, bổ sung) Hội Trầm Hương Việt Nam năm 2023
              {pdfInfo.fileSize > 0 && ` · ${formatBytes(pdfInfo.fileSize)}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 justify-center">
              <a
                href={pdfInfo.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg bg-brand-700 px-6 py-3",
                  "text-sm font-semibold text-white transition-colors hover:bg-brand-800",
                )}
              >
                <span>⬇</span>
                Tải xuống PDF
              </a>
              <a
                href={pdfInfo.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-white px-6 py-3",
                  "text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100",
                )}
              >
                <span>👁</span>
                Xem trực tuyến
              </a>
            </div>
          </div>
        ) : (
          <div className="mb-12 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-8 text-center">
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm text-brand-600">
              Bản PDF chính thức đang được cập nhật. Vui lòng xem nội dung bên dưới.
            </p>
          </div>
        )}

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
                  <span className="shrink-0 font-semibold text-brand-500">
                    Chương {ch.number}.
                  </span>
                  <span>
                    {ch.title}{" "}
                    <span className="text-brand-400">
                      ({ch.articles.length} điều — {ch.articles[0].num}
                      {ch.articles.length > 1
                        ? `–${ch.articles[ch.articles.length - 1].num}`
                        : ""}
                      )
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Chapters ── */}
        <div className="space-y-12">
          {chapters.map((ch) => (
            <section
              key={ch.id}
              id={ch.id}
              className="scroll-mt-24 rounded-xl border border-brand-200 bg-white p-8 shadow-sm"
            >
              <h2 className="text-xl font-bold text-brand-900 mb-1">
                Chương {ch.number}
              </h2>
              <h3 className="text-base font-semibold text-brand-700 mb-6 pb-4 border-b border-brand-200 uppercase">
                {ch.title}
              </h3>

              <div className="space-y-8">
                {ch.articles.map((article) => (
                  <div key={article.num} id={`dieu-${article.num}`} className="scroll-mt-24">
                    <h4 className="text-base font-bold text-brand-900 mb-3">
                      Điều {article.num}. {article.title}
                    </h4>
                    <div className="space-y-3 text-brand-700 leading-relaxed text-sm">
                      {article.paragraphs.map((para, idx) =>
                        Array.isArray(para) ? (
                          <ol key={idx} className="list-decimal pl-5 space-y-1">
                            {para.map((item, itemIdx) => (
                              <li key={itemIdx}>{item}</li>
                            ))}
                          </ol>
                        ) : (
                          <p key={idx}>{para}</p>
                        ),
                      )}
                    </div>
                  </div>
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
