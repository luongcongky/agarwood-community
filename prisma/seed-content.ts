// ============================================================
// Seed 100 Feed Posts + 100 Products
// Chạy: npx tsx prisma/seed-content.ts
// Yêu cầu: đã seed users/companies trước (npx prisma db seed)
// ============================================================

import path from "node:path"
import { config as loadEnv } from "dotenv"
loadEnv({ path: path.resolve(process.cwd(), ".env.local") })

import { PrismaClient, PostCategory } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function slugify(str: string): string {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function randomDate(daysBack: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack))
  d.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60))
  return d
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// ── Post data ──────────────────────────────────────────────────

const GENERAL_POSTS: { title: string; content: string }[] = [
  { title: "Kinh nghiệm nhận biết trầm hương thật và giả", content: "<p>Trầm hương thật khi đốt có mùi thơm nhẹ nhàng, thoang thoảng, không gắt. Khói bay lên thẳng, mảnh và mỏng. Trầm giả thường có mùi nồng, gắt, khói đen và bay tán loạn.</p><p>Một số cách kiểm tra đơn giản:</p><ul><li>Ngâm nước: trầm thật chìm chậm, trầm giả nổi hoặc chìm nhanh do tẩm hóa chất</li><li>Đốt thử: mùi thơm tự nhiên, không tanh, không gắt</li><li>Quan sát vân gỗ: trầm thật có vân dầu tự nhiên, không đều</li></ul>" },
  { title: "Chia sẻ về nghề trồng dó bầu ở Khánh Hòa", content: "<p>Gia đình tôi đã gắn bó với nghề trồng dó bầu hơn 20 năm tại Vạn Ninh, Khánh Hòa. Vùng đất này có khí hậu và thổ nhưỡng rất phù hợp với cây dó bầu — nắng nhiều, đất pha cát, thoát nước tốt.</p><p>Hiện tại vườn nhà có khoảng 500 cây, tuổi từ 5–15 năm. Những cây 10 năm trở lên đã bắt đầu cho trầm tốt sau khi tạo trầm bằng phương pháp vi sinh.</p>" },
  { title: "Thị trường trầm hương Trung Đông 2025", content: "<p>Thị trường Trung Đông tiếp tục là điểm đến xuất khẩu lớn nhất của trầm hương Việt Nam. Năm 2024, kim ngạch xuất khẩu sang UAE, Saudi Arabia và Kuwait đạt hơn 50 triệu USD.</p><p>Xu hướng năm 2025: người tiêu dùng Trung Đông ngày càng ưa chuộng tinh dầu trầm nguyên chất, đóng chai nhỏ 3–12ml. Dầu trầm Việt Nam được đánh giá cao về hương thơm sâu lắng, phù hợp với thị hiếu bản địa.</p>" },
  { title: "Hỏi về kỹ thuật tạo trầm sinh học", content: "<p>Các anh chị cho em hỏi: hiện tại em đang tìm hiểu về phương pháp tạo trầm bằng chế phẩm vi sinh. Em nghe nói có 2 loại chính:</p><ol><li>Phương pháp khoan và bơm chế phẩm</li><li>Phương pháp dẫn dược liệu qua thân cây</li></ol><p>Phương pháp nào cho chất lượng trầm tốt hơn? Thời gian thu hoạch sau khi tạo trầm thường là bao lâu?</p><p>Em đang có vườn dó bầu 7 năm tuổi ở Bình Phước, muốn bắt đầu tạo trầm đợt đầu tiên.</p>" },
  { title: "Nhang trầm thủ công — nghề gia truyền đang mai một", content: "<p>Gia đình tôi làm nhang trầm thủ công đã 3 đời ở Huế. Mỗi que nhang đều được se tay, phơi nắng tự nhiên, không dùng keo hóa chất. Nguyên liệu là bột trầm hương Khánh Hòa trộn với bột vỏ cây bời lời — chất kết dính hoàn toàn tự nhiên.</p><p>Nhưng thực tế, nhang thủ công đang bị cạnh tranh rất mạnh bởi nhang công nghiệp giá rẻ. Nhiều gia đình đã bỏ nghề. Chúng tôi vẫn cố gắng giữ lửa, nhưng cần được hỗ trợ quảng bá và kết nối thị tr��ờng.</p>" },
  { title: "Tham quan vườn trầm hương Quảng Nam — ấn tượng!", content: "<p>Cuối tuần vừa rồi tôi có dịp ghé thăm vườn trầm hương của một hội viên ở Tiên Phước, Quảng Nam. Thật sự ấn tượng với quy mô và chất lượng!</p><p>Vườn rộng khoảng 3 hecta, cây dó bầu 12–20 năm tuổi. Anh chủ vườn áp dụng phương pháp tạo trầm kết hợp: vi sinh + tổn thương cơ học. Kết quả là những khối trầm có vân đẹp, dầu dày, hương thơm sâu lắng.</p><p>Đặc biệt, anh còn phát triển mô hình du lịch trải nghiệm — khách tham quan vườn trầm, xem quy trình tạo trầm, và mua sản phẩm trực tiếp.</p>" },
  { title: "Công dụng của tinh dầu trầm hương trong y học cổ truyền", content: "<p>Theo Đông y, trầm hương có tính ôn, vị cay, vào kinh Tỳ, Vị, Thận. Công dụng chính:</p><ul><li><strong>An thần, giảm stress:</strong> xông tinh dầu trầm giúp thư giãn, cải thiện giấc ngủ</li><li><strong>Hỗ trợ tiêu hóa:</strong> trầm hương giúp ấm bụng, giảm đầy hơi, buồn nôn</li><li><strong>Kháng khuẩn:</strong> tinh dầu trầm có khả năng kháng khuẩn tự nhiên</li><li><strong>Thiền định:</strong> hương trầm giúp tập trung, tĩnh tâm</li></ul><p>Lưu ý: tinh dầu trầm nguyên chất rất đắt (2–5 triệu/ml). Hãy mua từ nguồn uy tín, tránh hàng pha trộn.</p>" },
  { title: "So sánh trầm hương Việt Nam và Indonesia", content: "<p>Trầm hương Việt Nam (đặc biệt vùng Khánh Hòa, Quảng Nam) và Indonesia (Kalimantan, Papua) là hai nguồn trầm lớn nhất thế giới. Sự khác biệt:</p><ul><li><strong>Hương thơm:</strong> Trầm VN thơm ngọt dịu, sâu lắng. Trầm Indo mạnh mẽ, nồng hơn.</li><li><strong>Màu sắc:</strong> Trầm VN thường sẫm màu hơn, dầu đặc. Trầm Indo nhạt hơn.</li><li><strong>Giá:</strong> Trầm VN chất lượng cao (Kỳ Nam) đắt nhất thế giới.</li><li><strong>Sản lượng:</strong> Indo sản lượng lớn hơn VN nhiều lần.</li></ul>" },
  { title: "Kỳ Nam — vua của trầm hương", content: "<p>Kỳ Nam (hay Kynam) là loại trầm hương quý hiếm nhất, chỉ có ở Việt Nam. Đặc điểm nhận dạng:</p><ul><li>Mềm hơn trầm thường, có thể dùng móng tay ấn lõm</li><li>Để ở nhiệt độ phòng đã tỏa hương nhẹ</li><li>Khi đốt, hương thơm biến đổi qua nhiều tầng: ngọt → hoa → gỗ → kem</li><li>Nếm có vị cay, tê nhẹ đầu lưỡi</li></ul><p>Giá Kỳ Nam loại tốt hiện dao động 100–500 triệu/kg, thậm chí hàng tỷ đồng cho loại siêu phẩm. Thị trường chủ yếu: Nhật Bản, Đài Loan, Trung Đông.</p>" },
  { title: "Góp ý về quy trình chứng nhận sản phẩm của Hội", content: "<p>Tôi vừa hoàn thành quy trình chứng nhận sản phẩm cho dòng tinh dầu trầm của công ty. Xin chia sẻ một số góp ý:</p><p><strong>Ưu điểm:</strong></p><ul><li>Quy trình minh bạch, tiêu chuẩn rõ ràng</li><li>Đội ngũ thẩm định chuyên nghi��p</li><li>Badge chứng nhận tạo uy tín lớn với khách hàng</li></ul><p><strong>Đề xuất cải tiến:</strong></p><ul><li>Thời gian xét duyệt hơi lâu (3–4 tuần), mong rút ngắn</li><li>Có thêm tùy chọn kiểm tra trực tuyến cho DN ở xa</li></ul>" },
  { title: "Câu chuyện đi tìm trầm ở rừng Quảng Ngãi", content: "<p>Hồi trẻ, cha tôi là thợ đi rừng tìm trầm ở vùng núi Trà Bồng, Quảng Ngãi. Ông kể rằng mỗi chuyến đi kéo dài 7–10 ngày, đi sâu vào rừng già, ngủ trên cây, uống nước suối.</p><p>Nghề tìm trầm dựa vào kinh nghiệm: nhìn dáng cây, đánh hơi, nghe tiếng gió. Những cây dó bầu bị sét đánh, mối đục, hoặc bị thương tích tự nhiên mới có khả năng tạo trầm.</p><p>Ngày nay, trầm tự nhiên gần như cạn kiệt. Thế hệ chúng tôi chuyển sang trồng và tạo trầm — vừa bảo tồn nguồn gen, vừa phát triển kinh tế bền vững.</p>" },
  { title: "Sự kiện: Hội chợ Trầm hương Quốc tế 2025", content: "<p>Thông báo: Hội chợ Trầm hương Quốc tế lần thứ 5 sẽ được tổ chức tại TP. Nha Trang, Khánh Hòa từ ngày 15–18/09/2025.</p><p>Quy mô dự kiến:</p><ul><li>200+ gian hàng từ 15 quốc gia</li><li>Khu trưng bày trầm hương quý hiếm</li><li>Hội thảo khoa học về kỹ thuật trồng và tạo trầm</li><li>Kết nối giao thương B2B</li></ul><p>Hội viên Hội Trầm Hương Việt Nam được miễn phí gian hàng (3x3m). Đăng ký trước 30/06/2025.</p>" },
  { title: "Trầm hương và phong thủy — hiểu đúng, dùng đúng", content: "<p>Nhiều người mua trầm hương để trưng bày phong thủy nhưng chưa hiểu rõ cách sử dụng. Chia sẻ một vài kiến thức cơ bản:</p><ul><li><strong>Trầm hương đặt phòng khách:</strong> tạo năng lượng tích cực, hóa giải khí xấu</li><li><strong>Vòng trầm đeo tay:</strong> mang theo người, hương trầm nhẹ nhàng giúp an tâm</li><li><strong>Đốt nhang trầm buổi sáng:</strong> thanh lọc không gian, bắt đầu ngày mới tỉnh táo</li></ul><p>Lưu ý: không nên đặt trầm ở nơi ẩm ướt, tránh ánh nắng trực tiếp. Bảo quản trong hộp kín khi không sử dụng.</p>" },
  { title: "Giới thiệu giống dó bầu mới — năng suất cao hơn 30%", content: "<p>Viện Nghiên cứu Lâm nghiệp vừa công bố giống dó bầu mới ĐB-2025, qua 10 năm lai tạo và thử nghiệm:</p><ul><li>Tốc độ sinh trưởng nhanh hơn 20% so với giống thường</li><li>Khả năng tạo trầm cao hơn 30% khi kích thích bằng vi sinh</li><li>Kháng sâu bệnh tốt, phù hợp nhiều vùng khí hậu</li></ul><p>Giống mới đang được phân phối qua hệ thống vườn ươm tại Khánh Hòa, Quảng Nam, Hà Tĩnh. Hội viên liên hệ Hội để được tư vấn.</p>" },
  { title: "Tôi đã bắt đầu bán trầm online như thế nào?", content: "<p>Năm ngoái, tôi quyết định đưa sản phẩm trầm hương lên bán online. Ban đầu gặp rất nhiều khó khăn:</p><ol><li>Khách hàng không tin tưởng mua trầm qua mạng (sợ giả)</li><li>Không biết chụp ảnh sản phẩm cho đẹp</li><li>Đóng gói trầm hương cần cẩn thận để giữ mùi</li></ol><p>Sau 1 năm, tôi rút ra kinh nghiệm: <strong>video quay thực tế</strong> + <strong>chứng nhận của Hội</strong> + <strong>chính sách đổi trả</strong> = tạo niềm tin. Doanh thu online hiện chiếm 40% tổng thu của cửa hàng.</p>" },
  { title: "Phân biệt các loại nhang trầm trên thị trường", content: "<p>Trên thị trường hiện có rất nhiều loại nhang trầm, từ vài chục nghìn đến vài triệu đồng/hộp. Cách phân biệt:</p><ul><li><strong>Nhang trầm nguyên chất:</strong> 100% bột trầm + keo tự nhiên. Khi đốt, khói mỏng, hương thanh, không cay mắt. Giá: 200k–1tr/hộp 50 que.</li><li><strong>Nhang trầm pha:</strong> 30–70% bột trầm, pha thêm bột gỗ. Hương nhẹ hơn, giá rẻ hơn.</li><li><strong>Nhang tẩm hương:</strong> bột gỗ tẩm tinh dầu tổng hợp. Mùi thơm ban đầu nhưng phai nhanh, khói đen.</li></ul>" },
  { title: "Thăm mô hình trồng dó bầu xen canh ở Hà Tĩnh", content: "<p>Vừa trở về từ chuyến khảo sát tại Hương Khê, Hà Tĩnh. Bà con ở đây áp dụng mô hình trồng dó bầu xen canh với keo lá tràm — cực kỳ hiệu quả:</p><ul><li>Keo cho thu nhập ngắn hạn (5–7 năm), dó bầu cho thu nhập dài hạn (10–15 năm)</li><li>Bóng keo che nắng cho cây dó bầu non</li><li>Giảm rủi ro khi giá gỗ keo biến động</li></ul><p>Thu nhập bình quân: 200–300 triệu/ha/năm khi cả hai loại cây cho thu hoạch. Đáng để học hỏi!</p>" },
  { title: "Hướng dẫn bảo quản trầm hương đúng cách", content: "<p>Trầm hương là sản phẩm tự nhiên, cần bảo quản đúng cách để giữ được hương thơm lâu dài:</p><ol><li><strong>Nhiệt độ:</strong> bảo quản ở nơi mát, tránh ánh nắng trực tiếp (20–25°C lý tưởng)</li><li><strong>Độ ẩm:</strong> tránh nơi quá ẩm (gây mốc) hoặc quá khô (mất dầu). Độ ẩm 50–60% là tốt nhất.</li><li><strong>Hộp bảo quản:</strong> dùng hộp gỗ hoặc sứ, có nắp đậy. KHÔNG dùng hộp nhựa (hấp thụ mùi).</li><li><strong>Tách riêng:</strong> mỗi loại trầm bảo quản riêng, tránh lẫn hương.</li></ol>" },
  { title: "Chia sẻ kinh nghiệm xuất khẩu trầm sang Nhật Bản", content: "<p>Thị trường Nhật Bản rất khắt khe nhưng giá trị cao. Một số kinh nghiệm sau 5 năm xuất khẩu:</p><ul><li><strong>Chất lượng là số 1:</strong> người Nhật kiểm tra rất kỹ, từ hàm lượng dầu đến mùi hương</li><li><strong>Đóng gói:</strong> phải sang trọng, tinh tế. Họ coi trầm hương là nghệ thuật.</li><li><strong>Giấy tờ:</strong> cần CO, phytosanitary certificate, CITES (nếu trầm tự nhiên)</li><li><strong>Kênh:</strong> tham gia hội chợ tại Tokyo, Osaka để kết nối trực tiếp</li></ul><p>Giá bán tại Nhật gấp 3–5 lần so với bán nội địa. Đáng để đầu tư!</p>" },
  { title: "Tuyển dụng: Cần thợ chế tác trầm hương có kinh nghiệm", content: "<p>Công ty chúng tôi cần tuyển thợ chế tác trầm hương tại xưởng TP.HCM:</p><ul><li>Số lượng: 3 người</li><li>Kinh nghiệm: tối thiểu 2 năm chế tác vòng, tượng, phụ kiện trầm</li><li>Mức lương: 15–25 triệu/tháng (theo tay nghề)</li><li>Ưu tiên: biết sử dụng máy CNC</li></ul><p>Liên hệ qua Hội hoặc comment bên dưới. Xin cảm ơn!</p>" },
  { title: "Trầm hương Việt Nam trên bản đồ thế giới", content: "<p>Việt Nam hiện đứng thứ 3 thế giới về sản lượng trầm hương (sau Indonesia và Malaysia), nhưng đứng thứ 1 về chất lượng trầm tự nhiên, đặc biệt là Kỳ Nam.</p><p>Các vùng trầm nổi tiếng:</p><ul><li><strong>Khánh Hòa:</strong> 'thủ phủ' trầm hương, nổi tiếng nhất</li><li><strong>Quảng Nam:</strong> vùng trầm cổ, chất lượng cao</li><li><strong>Hà Tĩnh:</strong> vùng trồng mới, phát triển mạnh</li><li><strong>Bình Phước:</strong> diện tích trồng lớn nhất miền Nam</li></ul>" },
  { title: "Câu hỏi: Có nên đầu tư trồng dó bầu không?", content: "<p>Em 28 tuổi, có 500 triệu muốn đầu tư. Đang cân nhắc giữa trồng dó bầu và trồng macadamia. Xin các anh chị tư vấn:</p><ol><li>Chi phí trồng 1 hecta dó bầu từ đầu đến khi thu hoạch?</li><li>Thời gian bao lâu mới có lãi?</li><li>Rủi ro chính là gì?</li><li>Có cần kinh nghiệm không hay thuê kỹ thuật viên được?</li></ol><p>Em ở Phú Yên, đất đồi, có nguồn nước gần. Mong được tư vấn!</p>" },
  { title: "Đánh giá máy chưng cất tinh d���u trầm mini", content: "<p>Vừa mua bộ chưng cất tinh dầu trầm hương loại mini (5 lít) về thử. Chia sẻ review nhanh:</p><ul><li><strong>Ưu điểm:</strong> nhỏ gọn, phù hợp quy mô gia đình. Dễ vận hành, làm nóng bằng điện.</li><li><strong>Nhược điểm:</strong> công suất thấp, 1kg nguyên liệu chưng 8–10 giờ mới được 1–2ml tinh dầu.</li><li><strong>Giá:</strong> khoảng 8 triệu (Trung Quốc), 15 triệu (Việt Nam sản xuất)</li></ul><p>Kết luận: phù hợp để thử nghiệm, học hỏi. Sản xuất thương mại cần loại 50–100 lít trở lên.</p>" },
  { title: "Tết này tặng trầm hương — xu hướng quà tặng cao cấp", content: "<p>Trầm hương đang trở thành lựa chọn quà tặng Tết phổ biến cho đối tác, người thân. Các set quà phổ biến:</p><ul><li><strong>Set nhang trầm:</strong> hộp gỗ sang trọng, 50 que nhang nguyên chất. Giá: 500k–1.5tr</li><li><strong>Vòng tay trầm:</strong> hạt tròn hoặc trụ, kèm hộp da. Giá: 1–10tr tùy chất lượng trầm</li><li><strong>Trầm miếng trưng bày:</strong> khối trầm tự nhiên, kèm đế gỗ. Giá: 2–50tr</li></ul><p>Tip: gắn thẻ chứng nhận của Hội Trầm Hương = tăng giá trị và uy tín quà tặng rất nhiều!</p>" },
  { title: "Cập nhật giá trầm hương tháng 3/2025", content: "<p>Giá tham khảo tại thị trường Khánh Hòa (tháng 3/2025):</p><ul><li>Trầm tốc loại 1: 15–25 triệu/kg</li><li>Trầm tốc loại 2: 5–10 triệu/kg</li><li>Trầm bột (nguyên chất): 3–8 triệu/kg</li><li>Tinh dầu trầm nguyên chất: 2–5 triệu/ml</li><li>Kỳ Nam (nếu có): 100–500 triệu/kg</li></ul><p>Giá biến động tùy nguồn gốc, chất lượng dầu, và mùa. Mùa hè giá thường nhích lên 10–15% do nhu cầu nhang trầm và xông hương tăng.</p>" },
  { title: "Dự án nghiên cứu: DNA trầm hương Việt Nam", content: "<p>Thông tin tốt cho ngành: Viện Công nghệ Sinh học đang triển khai dự án xây dựng cơ sở dữ liệu DNA trầm hương Việt Nam.</p><p>Mục tiêu:</p><ul><li>Xác định chính xác nguồn gốc xuất xứ trầm hương qua phân tích DNA</li><li>Phân biệt trầm tự nhiên và trầm nuôi cấy ở cấp độ phân tử</li><li>Hỗ trợ chống hàng giả, bảo vệ thương hiệu trầm Việt</li></ul><p>Hội viên có sản phẩm muốn đăng ký phân tích DNA miễn phí, liên hệ Ban Thường vụ.</p>" },
  { title: "Bí quyết làm vòng trầm hương đẹp", content: "<p>Với 10 năm kinh nghiệm chế tác vòng trầm, tôi chia sẻ một vài bí quyết:</p><ol><li><strong>Chọn nguyên liệu:</strong> trầm đều dầu, không có vết nứt. Tốt nhất là trầm 1–2 năm sau thu hoạch (đã ổn định).</li><li><strong>Tiện hạt:</strong> dùng máy tiện CNC cho hạt tròn đều. Tiện tay cho sản phẩm cao cấp.</li><li><strong>Đánh bóng:</strong> giấy nhám 800 → 1500 → 3000. Tuyệt đối KHÔNG dùng sáp hay dầu bóng.</li><li><strong>Xỏ dây:</strong> dây silicon co giãn tốt nhất. Dây vải mau đứt.</li></ol>" },
  { title: "Hội thảo: Phát triển bền vững ngành Trầm hương", content: "<p>Ban Thường vụ Hội Tr��m Hương Việt Nam kính mời hội viên tham dự hội thảo:</p><p><strong>Chủ đề:</strong> Phát triển bền vững ngành Trầm hương Việt Nam trong bối cảnh biến đổi khí hậu</p><ul><li><strong>Thời gian:</strong> 8h00 – 16h30, Thứ Bảy 20/04/2025</li><li><strong>Địa điểm:</strong> Khách sạn Yasaka Saigon, Quận 1, TP.HCM</li><li><strong>Diễn giả:</strong> PGS.TS Trần Hợp, TS. Nguyễn Văn Minh, đại diện Bộ NN&PTNT</li></ul><p>Đăng ký miễn phí qua email hoặc liên hệ Ban Thư ký.</p>" },
  { title: "Kinh doanh trầm hương online: nên dùng nền tảng nào?", content: "<p>Sau khi thử nhiều kênh bán hàng online, tôi xếp hạng các nền tảng cho ngành trầm hương:</p><ol><li><strong>Facebook (nhóm chuyên ngành):</strong> hiệu quả nhất, khách hàng am hiểu, tỷ lệ chốt cao</li><li><strong>Shopee/Lazada:</strong> đông khách nhưng cạnh tranh giá, khó bán hàng cao cấp</li><li><strong>Website riêng:</strong> uy tín, SEO tốt nhưng cần đầu tư dài hạn</li><li><strong>Chợ sản phẩm Hội Trầm Hương:</strong> mới nhưng đúng đối tượng, có badge chứng nhận</li></ol><p>Lời khuyên: kết hợp nhiều kênh, nhưng ưu tiên xây dựng thương hiệu trên website + Hội.</p>" },
  { title: "Ảnh hưởng của thời tiết đến chất lượng trầm", content: "<p>Một câu hỏi nhiều người trồng trầm quan tâm: thời tiết ảnh hưởng thế nào đến chất lượng trầm?</p><p>Kết quả nghiên cứu:</p><ul><li><strong>Mùa khô:</strong> cây stress nước → tăng tiết nhựa → trầm tạo nhiều hơn, dầu đặc hơn</li><li><strong>Mùa mưa:</strong> cây phát triển mạnh nhưng ít tạo trầm</li><li><strong>Gió bão:</strong> tổn thương cơ học tự nhiên → kích thích tạo trầm (giống phương pháp nhân tạo)</li></ul><p>Vì vậy, vùng Khánh Hòa (nắng nhiều, khô) cho trầm chất lượng cao hơn vùng mưa nhiều.</p>" },
  { title: "Câu chuyện: Từ thợ mộc thành chủ xưởng trầm hương", content: "<p>Tôi — Nguyễn Văn Toàn, 45 tuổi, khởi nghiệp với 50 triệu và một bàn tiện. 15 năm trước, tôi làm thợ mộc bình thường. Tình cờ nhận đơn tiện vòng trầm hương cho một khách quen.</p><p>Khi ngửi mùi trầm trên máy tiện, tôi 'phải lòng' ngay. Từ đó bắt đầu học hỏi về trầm hương — từ phân biệt chất lượng đến kỹ thuật chế tác.</p><p>Hiện tại xưởng tôi có 8 thợ, doanh thu 200–300 triệu/tháng. Bài học lớn nhất: đam mê + kiên nhẫn + chất lượng = thành công.</p>" },
  { title: "Trầm hương trong Phật giáo — ý nghĩa tâm linh", content: "<p>Trầm hương có vị trí đặc biệt trong Phật giáo, là một trong 'Ngũ phần hương' (5 loại hương cúng dường Phật):</p><ol><li>Giới hương (hương của giới luật)</li><li>Định hương (hương của thiền định)</li><li>Tuệ hương (hương của trí tuệ)</li><li>Giải thoát hương</li><li>Giải thoát tri kiến hương</li></ol><p>Trong thực hành, trầm hương được đốt trong các buổi tụng kinh, thiền định, và cúng dường. Hương trầm giúp tạo không gian thanh tịnh, hỗ trợ tập trung và tĩnh tâm.</p>" },
  { title: "Review: Tham quan nhà máy chế biến trầm hương hiện đại", content: "<p>Tuần trước tôi được mời tham quan nhà máy chế biến trầm hương của một công ty hội viên ở Khánh Hòa. Ấn tượng với dây chuyền hiện đại:</p><ul><li>Hệ thống chưng cất tinh dầu 500 lít, công suất 50kg/mẻ</li><li>Phòng kiểm tra chất lượng với máy GC-MS phân tích thành phần hóa học</li><li>Kho lạnh bảo quản nguyên liệu (15°C, ẩm 55%)</li><li>Xưởng chế tác thủ công kết hợp CNC</li></ul><p>Đây là hướng đi đúng: kết hợp truyền thống và công nghệ hiện đại.</p>" },
  { title: "Cảnh báo: Trầm giả tràn lan trên mạng xã hội", content: "<p>Gần đây có rất nhiều quảng cáo bán vòng trầm hương 'siêu rẻ' trên Facebook, TikTok. Giá chỉ 50–100k/chiếc — CHẮC CHẮN LÀ GIẢ!</p><p>Cách phân biệt nhanh:</p><ul><li>Giá dưới 500k cho vòng tay: gần như chắc chắn không phải trầm thật</li><li>Mùi thơm nồng, gắt: tẩm hóa chất</li><li>Hạt quá đều, bóng mượt: có thể là nhựa hoặc gỗ tẩm</li></ul><p><strong>Lời khuyên:</strong> mua từ doanh nghiệp có chứng nhận của Hội Trầm Hương VN. Badge chứng nhận là đảm bảo uy tín.</p>" },
  { title: "Trải nghiệm xông trầm hương tại gia", content: "<p>Mới bắt đầu thói quen xông trầm hương mỗi sáng. Chia sẻ kinh nghiệm cho người mới:</p><p><strong>Dụng cụ cần có:</strong></p><ul><li>Lư xông điện (an toàn, tiện lợi hơn lư than)</li><li>Trầm miếng hoặc trầm bột (chọn loại có nguồn gốc rõ ràng)</li></ul><p><strong>Cách dùng:</strong></p><ol><li>Cho miếng trầm nhỏ (bằng hạt đậu) lên lư</li><li>Bật lư ở nhiệt độ thấp (80–120°C) — KHÔNG đốt cháy</li><li>Hương sẽ tỏa nhẹ trong 30–60 phút</li></ol><p>Cảm nhận sau 1 tháng: ngủ ngon hơn, ít stress, phòng thơm dễ chịu suốt ngày.</p>" },
  { title: "Nghiên cứu mới: Trầm hương có tác dụng kháng ung thư?", content: "<p>Một nghiên cứu từ Đại học Chulalongkorn (Thái Lan) cho thấy chiết xuất từ trầm hương (Aquilaria crassna) có khả năng ức chế tế bào ung thư phổi in vitro.</p><p>Tuy nhiên, cần lưu ý:</p><ul><li>Đây mới là nghiên cứu trong phòng thí nghiệm, chưa thử nghiệm lâm sàng</li><li>Liều lượng và cách sử dụng chưa được xác định</li><li>KHÔNG nên tự ý dùng trầm hương thay thuốc chữa bệnh</li></ul><p>Dù sao, đây là tin tích cực cho ngành — thêm bằng chứng về giá trị dược liệu của trầm hương.</p>" },
  { title: "Hỏi: Phí gia nhập Hội Trầm Hương bao nhiêu?", content: "<p>Em mới mở cơ sở kinh doanh trầm hương ở Bình Dương, muốn gia nhập Hội. Cho em hỏi:</p><ol><li>Phí gia nhập một lần là bao nhiêu?</li><li>Niên liễn hàng năm?</li><li>Quyền lợi cụ thể khi là hội viên?</li><li>Thời gian xét duyệt bao lâu?</li></ol><p>Em nghe nói hội viên được hỗ trợ quảng bá sản phẩm trên website và có badge chứng nhận — rất quan tâm!</p>" },
]

const NEWS_POSTS: { title: string; content: string }[] = [
  { title: "Ra mắt bộ sưu tập Nhang Trầm Tết Ất Tỵ 2025", content: "<p>Công ty chúng tôi vui mừng gi��i thiệu bộ sưu tập nhang trầm đặc biệt cho Tết Ất Tỵ 2025. Gồm 3 dòng sản phẩm:</p><ul><li><strong>An Khang:</strong> nhang nụ, hương nhẹ nhàng, phù hợp cúng gia tiên</li><li><strong>Phúc Lộc:</strong> nhang vòng, đốt 4 giờ, hương thơm lan tỏa cả nhà</li><li><strong>Thịnh Vượng:</strong> nhang ống cao cấp, 100% trầm Khánh Hòa</li></ul><p>Ưu đãi đặt hàng sớm: giảm 15% cho đơn trước 15/01/2025.</p>" },
  { title: "Mở rộng nhà xưởng — nâng công suất gấp đôi", content: "<p>Sau 2 năm phát triển, công ty đã hoàn thành đầu tư mở rộng nhà xưởng sản xuất tại KCN Suối Dầu, Khánh Hòa.</p><p>Quy mô mới:</p><ul><li>Diện tích: 2,000m² (tăng từ 800m²)</li><li>Dây chuyền chưng cất: 3 bộ x 200 lít</li><li>Phòng sấy trầm: công suất 500kg/ngày</li><li>Kho nguyên liệu: sức chứa 10 tấn</li></ul>" },
  { title: "Đạt chứng nhận ISO 9001:2015 cho quy trình sản xuất", content: "<p>Công ty vừa chính thức nhận chứng chỉ ISO 9001:2015 từ Bureau Veritas cho toàn bộ quy trình sản xuất tinh dầu và sản phẩm trầm hương.</p><p>Đây là kết quả của 18 tháng cải tiến quy trình, từ khâu nhập nguyên liệu, kiểm tra chất lượng, sản xuất, đến đóng gói và giao hàng.</p>" },
  { title: "Tham gia Hội chợ Dubai — kết nối đối tác Trung Đông", content: "<p>Tuần vừa rồi, đoàn chúng tôi đã tham gia World of Fragrance Expo 2025 tại Dubai, UAE. Kết quả rất tích cực:</p><ul><li>Gặp gỡ 50+ đối tác tiềm năng từ UAE, Saudi, Qatar, Oman</li><li>Ký 3 hợp đồng xuất khẩu tinh dầu trầm, tổng giá trị 200,000 USD</li><li>Nhận được nhiều quan tâm từ khách hàng Trung Đông về dòng trầm miếng cao cấp</li></ul>" },
  { title: "Khai trương showroom trầm hương tại TP.HCM", content: "<p>Trân trọng thông báo khai trương showroom trầm hương tại địa chỉ: 150 Lý Chính Thắng, Quận 3, TP.HCM.</p><p>Showroom trưng bày đầy đủ các dòng sản phẩm: tinh dầu, nhang, vòng, tượng, trầm miếng. Khách hàng có thể trải nghiệm và mua sắm trực tiếp.</p><p>Ưu đãi khai trương: giảm 20% toàn bộ sản phẩm trong tuần đầu tiên!</p>" },
  { title: "Hợp tác với Đại học Nha Trang — nghiên cứu chiết xuất", content: "<p>Công ty vừa ký thỏa thuận hợp tác R&D với Khoa Công nghệ Sinh học, Đại học Nha Trang. Nội dung:</p><ul><li>Nghiên cứu tối ưu hóa quy trình chưng cất tinh dầu trầm (tăng hiệu suất 20%)</li><li>Phát triển sản phẩm mới từ phụ phẩm: nước trầm, serum trầm, trà trầm hương</li><li>Xây dựng tiêu chuẩn chất lượng tinh dầu trầm VN</li></ul>" },
  { title: "Chương trình đào tạo nghề chế tác trầm hương 2025", content: "<p>Xưởng chúng tôi mở lớp đào tạo nghề chế tác trầm hương, dành cho người muốn khởi nghiệp:</p><ul><li><strong>Thời gian:</strong> 3 tháng (T4–T6/2025)</li><li><strong>Nội dung:</strong> phân biệt nguyên liệu, kỹ thuật tiện vòng, chế tác tượng, đánh bóng</li><li><strong>Học phí:</strong> 5 triệu/khóa (hội viên Hội được giảm 50%)</li><li><strong>Địa điểm:</strong> Xưởng Vạn Ninh, Khánh Hòa</li></ul>" },
  { title: "Đơn hàng xuất khẩu 500kg tinh dầu sang Ấn Độ", content: "<p>Vui mừng thông báo: công ty vừa hoàn tất đơn hàng xuất khẩu 500kg tinh dầu trầm sang đối tác tại Mumbai, Ấn Độ. Đây là đơn hàng lớn nhất từ trước đến nay.</p><p>Tinh dầu được chưng cất từ trầm nuôi cấy 10–12 năm tuổi, đạt tiêu chuẩn IFRA cho ngành nước hoa.</p>" },
  { title: "Ra mắt dòng sản phẩm trầm hương hữu cơ", content: "<p>Sau 2 năm nghiên cứu và phát triển, công ty chính thức ra mắt dòng sản phẩm 'Trầm Hương Organic':</p><ul><li>Nguyên liệu từ vườn trầm hữu cơ đạt chứng nhận USDA Organic</li><li>Không sử dụng hóa chất trong quá trình tạo trầm và chế biến</li><li>Đóng gói thân thiện môi trường (tre, giấy tái chế)</li></ul><p>Dòng sản phẩm nhắm đến thị trường EU và Bắc Mỹ — nơi người tiêu dùng sẵn sàng trả giá cao cho organic.</p>" },
  { title: "Được vinh danh Top 10 DN xuất sắc ngành Lâm nghiệp", content: "<p>Công ty vinh dự được Hiệp hội Gỗ và Lâm sản Việt Nam vinh danh 'Top 10 Doanh nghiệp xuất sắc ngành Lâm nghiệp 2024'.</p><p>Giải thưởng ghi nhận nỗ lực trong:</p><ul><li>Phát triển bền vững nguồn nguyên liệu trầm hương</li><li>Ứng dụng công nghệ trong sản xuất</li><li>Tạo việc làm cho cộng đồng địa phương (50+ lao động)</li></ul>" },
]

const PRODUCT_POSTS: { title: string; content: string }[] = [
  { title: "Tinh dầu Trầm hương Khánh Hòa — Premium Grade", content: "<p>Giới thiệu dòng tinh dầu trầm hương cao cấp, chưng cất 100% từ trầm tự nhiên Khánh Hòa.</p><p>Đặc điểm: hương thơm sâu lắng, nốt gỗ ấm, kéo dài 6–8 giờ trên da. Phù hợp thiền định, xông phòng, hoặc sử dụng như nước hoa tự nhiên.</p><p>Dung tích: 3ml, 6ml, 12ml. Có chứng nhận chất lượng từ Hội Trầm Hương VN.</p>" },
  { title: "Bộ sưu tập vòng trầm Phúc Lộc Thọ — mới 2025", content: "<p>Ra mắt bộ sưu tập vòng tay trầm hương 'Phúc Lộc Thọ' cho năm Ất Tỵ 2025. Mỗi chiếc vòng được chế tác thủ công từ khối trầm nguyên, vân dầu tự nhiên.</p><p>3 mẫu: Phúc (14mm, hạt tròn), Lộc (12mm, hạt trụ), Thọ (108 hạt, 8mm). Kèm hộp quà tặng gỗ trắc.</p>" },
  { title: "Nhang nụ trầm hương — hộp 48 nụ", content: "<p>Nhang nụ 100% bột trầm hương nguyên chất, không keo hóa chất. Mỗi nụ đốt 25–30 phút, khói mỏng, hương thanh nhẹ.</p><p>Phù hợp: xông phòng, thiền định, cúng dường. Đóng hộp tre thủ công, 48 nụ/hộp.</p>" },
  { title: "Trầm miếng tự nhiên — sưu tầm & phong thủy", content: "<p>Bộ sưu tập trầm miếng tự nhiên, được chọn lọc kỹ từ nguồn trầm Quảng Nam. Mỗi miếng có hình dáng tự nhiên, vân dầu đặc trưng.</p><p>Phù hợp: trưng bày phong thủy, bàn làm việc, phòng khách. Kèm đế gỗ hương.</p>" },
  { title: "Combo tinh dầu xông phòng — 3 mùi hương", content: "<p>Set 3 chai tinh dầu trầm hương cho máy xông hơi:</p><ul><li>Forest Morning: hương trầm tươi, pha lá xanh</li><li>Deep Meditation: trầm đậm, gỗ ấm, hổ phách</li><li>Sweet Dreams: trầm nhẹ, hoa nhài, vanilla</li></ul><p>Mỗi chai 10ml. Sử dụng với máy khuếch tán siêu âm.</p>" },
  { title: "Tượng Phật Di Lặc bằng trầm hương", content: "<p>Tượng Phật Di Lặc chế tác từ khối trầm nguyên, cao 15cm. Vân dầu tự nhiên tuyệt đẹp, tỏa hương nhẹ nhàng ở nhiệt độ phòng.</p><p>Thích hợp: cúng dường, trưng bày, quà tặng cao cấp. Mỗi bức tượng là duy nhất — không có 2 bức giống nhau.</p>" },
  { title: "Trầm hương ngâm rượu — đặc sản mới", content: "<p>Sản phẩm mới: Rượu trầm hương — trầm miếng ngâm trong rượu gạo truyền thống 40 độ, ủ tối thiểu 6 tháng.</p><p>Theo Đông y, rượu trầm hương giúp ấm bụng, hỗ trợ tiêu hóa, an thần. Dung tích: 500ml/chai, kèm hộp quà.</p>" },
  { title: "Bột trầm hương mịn — nguyên liệu nhang thủ công", content: "<p>Cung cấp bột trầm hương mịn, độ mịn 80–100 mesh, nguyên liệu cho các cơ sở làm nhang thủ công.</p><p>Nguồn gốc: trầm nuôi cấy Khánh Hòa, 8–10 năm tuổi. Đóng gói: 100g, 500g, 1kg.</p>" },
  { title: "Bộ quà tặng doanh nghiệp — Trầm Hương Gift Set", content: "<p>Gift set cao cấp dành cho quà tặng doanh nghiệp, đối tác:</p><ul><li>1 chai tinh dầu trầm 3ml</li><li>1 hộp nhang nụ 20 nụ</li><li>1 miếng trầm nhỏ trưng bày</li></ul><p>Đóng hộp gỗ sơn mài, khắc logo theo yêu cầu. Tối thiểu 20 set/đơn hàng.</p>" },
  { title: "Trà trầm hương — thức uống wellness mới", content: "<p>Trà trầm hương (Agarwood Tea) — làm từ lá cây dó bầu sấy nhẹ. KHÔNG chứa caffeine.</p><p>Hương vị nhẹ nhàng, thanh mát, có dư vị ngọt. Hỗ trợ thư giãn, giảm stress, cải thiện giấc ngủ.</p><p>Đóng gói: hộp 20 túi lọc. Chứng nhận an toàn thực phẩm.</p>" },
]

// ── Product data (100 items) ──────────────────────────────────

const PRODUCT_CATEGORIES = [
  "Trầm tự nhiên", "Tinh dầu", "Nhang trầm", "Vòng trầm",
  "Phong thủy", "Mỹ nghệ", "Trầm nuôi cấy", "Thực phẩm",
]

interface ProductSeed {
  name: string
  category: string
  priceRange: string
  description: string
}

const PRODUCTS: ProductSeed[] = [
  // Trầm tự nhiên (15)
  { name: "Trầm tốc Khánh Hòa loại 1 — 100g", category: "Trầm tự nhiên", priceRange: "15-25 triệu/kg", description: "<p>Trầm tốc tự nhiên từ rừng Khánh Hòa, loại 1 — hàm lượng dầu cao >25%. Vân dầu đều, mùi thơm ngọt sâu lắng. Phù hợp đốt xông, sưu tầm, chế tác.</p>" },
  { name: "Trầm miếng Quảng Nam — phong thủy", category: "Trầm tự nhiên", priceRange: "5-15 triệu/miếng", description: "<p>Trầm miếng tự nhiên, hình dáng độc đáo, được chọn lọc kỹ từ nguồn Quảng Nam. Vân dầu đặc trưng, tỏa hương ở nhiệt độ phòng. Kèm đế gỗ hương chạm khắc.</p>" },
  { name: "Trầm tốc loại 2 — nguyên liệu chế biến", category: "Trầm tự nhiên", priceRange: "5-10 triệu/kg", description: "<p>Trầm tốc loại 2, hàm lượng dầu 10–20%. Phù hợp làm nguyên liệu sản xuất nhang, bột trầm, tinh dầu. Cung cấp số lượng lớn, có CO/CQ.</p>" },
  { name: "Trầm hương nguyên khối — sưu tầm", category: "Trầm tự nhiên", priceRange: "20-80 triệu/khối", description: "<p>Trầm hương nguyên khối, trọng lượng 200–500g, dầu dày, vân đẹp. Dành cho nhà sưu tầm và trưng bày cao cấp. Mỗi khối là duy nhất.</p>" },
  { name: "Trầm rễ tự nhiên — hiếm", category: "Trầm tự nhiên", priceRange: "Liên hệ", description: "<p>Trầm hình thành từ rễ cây dó bầu tự nhiên — cực hiếm. Hương thơm đặc biệt sâu lắng, khác biệt hoàn toàn với trầm thân. Dành cho collector.</p>" },
  { name: "Vụn trầm tự nhiên — xông hương", category: "Trầm tự nhiên", priceRange: "1-3 triệu/100g", description: "<p>Vụn trầm tự nhiên, vụn từ quá trình chế tác. Phù hợp đốt xông phòng hàng ngày. Mùi thơm dịu, khói nhẹ. Đóng gói: 50g, 100g.</p>" },
  { name: "Trầm tốc Hà Tĩnh — hương đậm", category: "Trầm tự nhiên", priceRange: "8-15 triệu/kg", description: "<p>Trầm tốc từ vùng núi Hà Tĩnh, đặc điểm hương thơm đậm, nồng hơn trầm Khánh Hòa. Dầu vàng sẫm, độ chìm nước tốt.</p>" },
  { name: "Trầm cảnh phong thủy — tự nhiên", category: "Trầm tự nhiên", priceRange: "3-20 triệu/cây", description: "<p>Gốc trầm tự nhiên, hình dáng giống núi, thác nước, hoặc bonsai. Phù hợp trưng bày bàn làm việc, phòng khách. Tỏa hương nhẹ nhàng.</p>" },
  { name: "Trầm mảnh xông lư — cao cấp", category: "Trầm tự nhiên", priceRange: "2-5 triệu/50g", description: "<p>Trầm mảnh mỏng, cắt sẵn kích thước phù hợp cho lư xông điện. Mỗi mảnh xông được 30–60 phút. Hương thanh, dịu, không khói.</p>" },
  { name: "Trầm nụ — đặc sản Phú Yên", category: "Trầm tự nhiên", priceRange: "10-20 triệu/kg", description: "<p>Trầm nụ (trầm hình nụ hoa) — đặc sản vùng Phú Yên. Hình dáng tự nhiên đẹp, dầu đặc, hương thơm ngọt dịu. Rất hiếm.</p>" },
  { name: "Trầm bột nguyên chất — Khánh Hòa", category: "Trầm tự nhiên", priceRange: "3-8 triệu/kg", description: "<p>Bột trầm xay từ trầm tốc loại 1+2, độ mịn 100 mesh. Nguyên liệu làm nhang thủ công, pha trà, hoặc xông trực tiếp trên lư.</p>" },
  { name: "Tr��m cây nguyên gốc — trưng bày", category: "Trầm tự nhiên", priceRange: "50-200 triệu", description: "<p>Cây dó bầu nguyên gốc có trầm tự nhiên, cao 1–2m. Tác phẩm trưng bày độc đáo cho sảnh công ty, biệt thự, showroom. Giao hàng tận nơi.</p>" },
  { name: "Trầm tốc Bình Phước — giá t��t", category: "Trầm tự nhiên", priceRange: "3-7 triệu/kg", description: "<p>Trầm tốc từ vùng trồng Bình Phước, cây 10–15 năm tuổi. Hương thơm nhẹ, phù hợp làm nguyên liệu hoặc xông hương hàng ngày. Số lượng lớn.</p>" },
  { name: "Trầm sợi — nguyên liệu mỹ ph��m", category: "Trầm tự nhiên", priceRange: "5-12 triệu/kg", description: "<p>Sợi trầm hương tách từ trầm tốc, dùng trong sản xuất mỹ phẩm, tinh dầu, xà phòng. Hàm lượng dầu ổn định, phù hợp chiết xuất công nghiệp.</p>" },
  { name: "Trầm chip — tiện dụng xông hương", category: "Trầm tự nhiên", priceRange: "1.5-4 triệu/100g", description: "<p>Trầm chip (miếng nhỏ 5–10mm) tiện dụng cho lư xông điện. Mỗi lần xông 2–3 chip, thơm phòng 1–2 giờ. Đóng hộp 50g, 100g.</p>" },

  // Tinh dầu (15)
  { name: "Tinh dầu trầm hương Premium — 3ml", category: "Tinh dầu", priceRange: "2-5 triệu/3ml", description: "<p>Tinh dầu trầm nguyên chất, chưng cất thủ công từ trầm tự nhiên Khánh Hòa. Hương thơm sâu lắng, kéo dài. Đóng chai thủy tinh tối màu, kèm que chấm.</p>" },
  { name: "Tinh d���u trầm xông phòng — 10ml", category: "Tinh dầu", priceRange: "800k-2 triệu/10ml", description: "<p>Tinh dầu trầm dùng cho máy khuếch tán siêu âm. Nồng độ phù hợp xông phòng 20–30m². Nhỏ 3–5 giọt/lần. Hương trầm nhẹ nhàng, thư giãn.</p>" },
  { name: "Tinh dầu trầm roll-on — tiện dụng", category: "Tinh dầu", priceRange: "500k-1.5 triệu", description: "<p>Tinh dầu trầm dạng roll-on, lăn trực tiếp lên cổ tay, sau tai. Tiện mang theo, dùng bất cứ lúc nào. Dung tích 3ml.</p>" },
  { name: "Dầu trầm massage — 30ml", category: "Tinh dầu", priceRange: "600k-1.5 triệu", description: "<p>Dầu massage pha tinh dầu trầm hương 5%, dầu nền jojoba. Thư giãn cơ, giảm căng thẳng, dưỡng da. Hương trầm nhẹ nhàng trên da.</p>" },
  { name: "Tinh dầu trầm nuôi cấy — giá tốt", category: "Tinh dầu", priceRange: "300k-800k/10ml", description: "<p>Tinh dầu chưng cất từ trầm nuôi cấy, chất lượng tốt, giá hợp lý hơn trầm tự nhiên. Phù hợp xông phòng, pha nước tắm.</p>" },
  { name: "Nước hoa trầm hương Eau de Parfum — 50ml", category: "Tinh dầu", priceRange: "1.5-3 triệu", description: "<p>Nước hoa nam/nữ unisex, nốt hương chính: trầm Khánh Hòa + hoa nhài + gỗ đàn hương. Lưu hương 8–10 giờ. Chai thủy tinh sang trọng.</p>" },
  { name: "Set tinh dầu thiền định — 3 chai x 5ml", category: "Tinh dầu", priceRange: "1-2 triệu/set", description: "<p>Bộ 3 chai tinh dầu cho thiền định: Trầm thuần (pure oud), Trầm + trầm hương (frankincense), Trầm + bạch đàn (eucalyptus). Cho máy xông.</p>" },
  { name: "Tinh dầu trầm hương Quảng Nam — đặc sản", category: "Tinh dầu", priceRange: "3-8 triệu/3ml", description: "<p>Tinh dầu trầm chưng cất từ nguyên liệu vùng Tiên Phước, Quảng Nam. Hương đặc trưng: ngọt, ấm, có nốt hoa nhẹ. Sản lượng hạn chế.</p>" },
  { name: "Serum dưỡng da chiết xuất trầm hương", category: "Tinh dầu", priceRange: "400k-900k/30ml", description: "<p>Serum dưỡng da cao cấp, thành phần chính: chiết xuất trầm hương + hyaluronic acid + vitamin E. Chống lão hóa, dưỡng ẩm, sáng da.</p>" },
  { name: "Tinh dầu trầm hương nguyên chất — 1ml", category: "Tinh d���u", priceRange: "1-3 triệu/1ml", description: "<p>Tinh dầu trầm 100% nguyên chất (pure oud oil), không pha loãng. Dành cho connoisseur. Chai mini 1ml kèm que gỗ chấm.</p>" },
  { name: "Xà phòng trầm hương handmade", category: "Tinh dầu", priceRange: "80k-150k/bánh", description: "<p>Xà phòng thủ công, thành phần: dầu olive, dầu dừa, tinh dầu trầm hương, bột trầm. Dưỡng da, tỏa hương nhẹ. Không chất tạo bọt hóa học.</p>" },
  { name: "Nến thơm trầm hương — 200g", category: "Tinh dầu", priceRange: "200k-500k", description: "<p>Nến thơm sáp đậu nành, pha tinh dầu trầm hương tự nhiên. Thời gian cháy: 40–50 giờ. Hương trầm ấm áp lan tỏa khắp phòng. Ly thủy tinh tái sử dụng.</p>" },
  { name: "Dầu gội trầm hương — dưỡng tóc", category: "Tinh dầu", priceRange: "150k-300k/300ml", description: "<p>Dầu gội thảo dược, chiết xuất trầm hương + bồ kết + hà thủ ô. Sạch gàu, chắc tóc, hương thơm tự nhiên. Không SLS, không paraben.</p>" },
  { name: "Tinh dầu trầm pha sẵn cho lư xông — 50ml", category: "Tinh d��u", priceRange: "300k-600k", description: "<p>Tinh dầu trầm pha sẵn nồng độ phù hợp cho lư xông điện. Chỉ cần nhỏ vào khay, bật lư. Tiện lợi, kinh tế hơn trầm mi��ng.</p>" },
  { name: "Túi thơm trầm hương — treo xe, tủ quần áo", category: "Tinh dầu", priceRange: "50k-150k/túi", description: "<p>Túi vải thêu chứa bột trầm + vỏ quế + hoa nhài. Treo xe hơi, tủ quần áo, phòng ngủ. Thơm tự nhiên 2–3 tháng. Refill được.</p>" },

  // Nhang trầm (12)
  { name: "Nhang trầm nguyên chất — hộp 50 que", category: "Nhang trầm", priceRange: "200k-500k/hộp", description: "<p>Nhang que 100% bột trầm + keo bời lời tự nhiên. Que trầm cháy 25–30 phút, khói mỏng, hương thanh nhẹ. Không hóa chất, không phẩm màu.</p>" },
  { name: "Nhang nụ trầm — hộp tre 48 nụ", category: "Nhang trầm", priceRange: "150k-350k/hộp", description: "<p>Nhang nụ mini, đốt 20–25 phút. Tiện dụng cho bàn làm việc, phòng thiền. Đóng hộp tre thủ công, nhỏ gọn mang theo.</p>" },
  { name: "Nhang vòng trầm hương — 4 giờ", category: "Nhang trầm", priceRange: "100k-250k/hộp", description: "<p>Nhang vòng xoắn, đốt liên tục 4 giờ. Phù hợp xông phòng diện tích lớn, chùa chiền, phòng họp. Hộp 10 vòng.</p>" },
  { name: "Nhang ống trầm cao cấp — quà t��ng", category: "Nhang trầm", priceRange: "500k-1.5 triệu", description: "<p>Nhang que cao cấp, đóng ống tre khắc chữ. 20 que/ống. 100% trầm Khánh Hòa loại A. Hộp quà tặng kèm đế cắm nhang gỗ hương.</p>" },
  { name: "Nhang trầm pha quế — ấm áp", category: "Nhang tr���m", priceRange: "100k-200k/hộp", description: "<p>Nhang que pha 70% bột trầm + 30% bột quế. Hương ấm áp, ngọt dịu. Phù hợp mùa đông, phòng ngủ. Hộp 30 que.</p>" },
  { name: "Nhang trầm backflow — thác khói", category: "Nhang trầm", priceRange: "80k-200k/hộp", description: "<p>Nhang nụ backflow — khói chảy ngược xuống như thác nước. Dùng với lư backflow để tạo hiệu ứng khói đẹp. Hộp 40 nụ.</p>" },
  { name: "Nhang sào trầm hương — 40cm", category: "Nhang trầm", priceRange: "300k-800k/bó", description: "<p>Nhang sào dài 40cm, đốt 45–60 phút. Dùng trong lễ cúng, chùa, đền. Hương trầm đậm, lan tỏa rộng. Bó 20 que.</p>" },
  { name: "Nhang trầm Nhật Bản style — thanh mảnh", category: "Nhang trầm", priceRange: "200k-400k/hộp", description: "<p>Nhang que kiểu Nhật (không lõi tre), thanh mảnh 1mm, dài 14cm. Cháy 15 phút, hương tinh tế. Đóng hộp giấy washi. 80 que/hộp.</p>" },
  { name: "Nhang xoắn trầm — treo trang trí", category: "Nhang trầm", priceRange: "120k-250k/bộ", description: "<p>Nhang xoắn treo, cháy 2 giờ. Vừa trang trí vừa xông hương. Kèm móc treo đồng thau. Bộ 10 nhang xoắn.</p>" },
  { name: "Nhang trầm mini — du lịch", category: "Nhang trầm", priceRange: "50k-120k", description: "<p>Set nhang mini cho người thường xuyên di chuyển. 30 que ngắn (7cm) + đế cắm mini bằng đồng. Đựng trong hộp thiếc nhỏ gọn.</p>" },
  { name: "Bột nhang trầm DIY — tự làm nhang", category: "Nhang trầm", priceRange: "200k-500k/500g", description: "<p>Bột trầm + bột keo bời lời, trộn sẵn tỷ lệ. Chỉ cần thêm nước, nhào, se. Hướng dẫn làm nhang thủ công kèm theo. Hobby kit thú vị!</p>" },
  { name: "Nhang trầm cuộn lớn — chùa chiền", category: "Nhang trầm", priceRange: "500k-1.2 triệu/cuộn", description: "<p>Nhang cuộn đường kính 30cm, đốt 12–24 giờ. Dùng cho chùa, đền, không gian rộng. 100% bột trầm nguyên chất.</p>" },

  // Vòng trầm (12)
  { name: "Vòng tay trầm hương 14mm — nam", category: "Vòng trầm", priceRange: "1-5 triệu", description: "<p>Vòng tay hạt tròn 14mm, chế tác từ trầm tốc tự nhiên. Vân dầu đẹp, thơm nhẹ. 16 hạt, chu vi 17–18cm. Phù hợp nam giới.</p>" },
  { name: "Vòng tay trầm 10mm — nữ thanh lịch", category: "Vòng trầm", priceRange: "800k-3 triệu", description: "<p>Vòng tay hạt 10mm mảnh mai, phù hợp nữ giới. Trầm nuôi cấy 10 năm, vân dầu tự nhiên. 19 hạt, co giãn. Đeo hàng ngày.</p>" },
  { name: "Chuỗi 108 hạt trầm — thiền định", category: "Vòng trầm", priceRange: "2-8 triệu", description: "<p>Chuỗi tràng hạt 108 hạt trầm 8mm, quấn 4 vòng quanh cổ tay. Dùng trong thiền định, niệm Phật. Trầm Khánh Hòa, mùi thơm dịu.</p>" },
  { name: "Vòng tay trầm hạt trụ — phong cách", category: "Vòng trầm", priceRange: "1.5-6 triệu", description: "<p>Hạt trụ (barrel bead) 12x8mm, phong cách khác biệt. Trầm tự nhiên, vân dầu theo chiều ngang rất đẹp. 18 hạt.</p>" },
  { name: "Vòng trầm kết hợp vàng 18K", category: "Vòng trầm", priceRange: "5-15 triệu", description: "<p>Vòng tay trầm hương cao cấp, xen kẽ charm vàng 18K (Pi Xiu, Chữ Phúc, hạt Kim Cang). Vừa phong thủy vừa thời trang.</p>" },
  { name: "Vòng tay trầm cho trẻ em — 6mm", category: "Vòng trầm", priceRange: "300k-800k", description: "<p>Vòng tay trầm hạt 6mm nhỏ xinh, dành cho trẻ em. Trầm nuôi cấy an toàn, dây co giãn. Hương trầm nhẹ, giúp bé ngủ ngon.</p>" },
  { name: "V��ng trầm đôi — couple", category: "Vòng trầm", priceRange: "2-6 triệu/đôi", description: "<p>Set vòng đôi: 1 nam (14mm) + 1 nữ (10mm), cùng khối trầm nguyên. Ý nghĩa: đồng tâm, hạnh phúc. Hộp quà tặng kèm.</p>" },
  { name: "Vòng trầm chìm nước — siêu dầu", category: "Vòng trầm", priceRange: "8-30 triệu", description: "<p>Vòng tay trầm 'chìm nước' — hàm lượng dầu cực cao, thả xuống nước chìm ngay. Hương thơm đậm đặc. Dành cho collector và người sành trầm.</p>" },
  { name: "Lắc tay trầm bạc 925 — nữ", category: "Vòng trầm", priceRange: "1-3 triệu", description: "<p>Lắc tay nữ: dây bạc 925 + 3 hạt trầm hương 8mm. Thiết kế thanh lịch, đeo được cả ngày. Kèm hộp trang sức.</p>" },
  { name: "Vòng cổ trầm hương — nam cao cấp", category: "Vòng trầm", priceRange: "5-20 triệu", description: "<p>Vòng cổ trầm hương 33 hạt tròn 12mm, dây dù đen. Phong cách nam tính, bản lĩnh. Trầm tự nhiên Khánh Hòa, vân dầu rõ.</p>" },
  { name: "Vòng tay trầm phong thủy — tỳ hưu", category: "Vòng trầm", priceRange: "2-8 triệu", description: "<p>Vòng tay trầm 12mm + charm tỳ hưu bằng trầm chạm khắc. Ý nghĩa: chiêu tài, hóa sát. Kèm túi nhung đỏ.</p>" },
  { name: "Nhẫn trầm hương — unisex", category: "Vòng trầm", priceRange: "500k-2 triệu", description: "<p>Nhẫn trầm hương nguyên khối, tiện CNC chính xác. Nhiều size. Nhẹ, thơm, phong cách. Đeo hàng ngày hoặc làm quà.</p>" },

  // Phong thủy (10)
  { name: "Tháp trầm hương — trấn trạch", category: "Phong thủy", priceRange: "3-15 triệu", description: "<p>Tháp trầm hương chế tác từ khối trầm nguyên, cao 15–25cm. Đặt phòng khách, bàn làm việc giúp trấn trạch, tụ khí. Mỗi tháp là duy nhất.</p>" },
  { name: "Tượng Quan Âm trầm hương — 20cm", category: "Phong thủy", priceRange: "5-25 triệu", description: "<p>Tượng Quan Thế Âm Bồ Tát chế tác từ trầm hương nguyên khối, cao 20cm. Chạm khắc tinh xảo, tỏa hương tự nhiên. Cung cấp cho chùa, gia đình.</p>" },
  { name: "Cây Tài Lộc bằng trầm hương", category: "Phong thủy", priceRange: "2-10 triệu", description: "<p>Cây tài lộc mini bằng trầm hương — thân trầm nguyên, lá bằng đá phong thủy (thạch anh, mã não). Đặt bàn làm việc chiêu tài.</p>" },
  { name: "Cóc ngậm tiền bằng trầm — chiêu tài", category: "Phong thủy", priceRange: "1-5 triệu", description: "<p>Cóc ba chân (Thiềm Thừ) chạm từ trầm hương. Biểu tượng chiêu tài, giữ tiền. Đặt hướng cửa chính, quay vào nhà.</p>" },
  { name: "Hồ lô trầm hương — hóa sát", category: "Phong thủy", priceRange: "1-4 triệu", description: "<p>Hồ lô (bầu) chế tác từ trầm hương nguyên khối. Biểu tượng sức khỏe, hóa bệnh tật. Treo cửa phòng ngủ hoặc đặt bàn.</p>" },
  { name: "Tỳ Hưu trầm hương — đôi", category: "Phong thủy", priceRange: "3-12 triệu/đôi", description: "<p>Đôi Tỳ Hưu (Pixiu) chế tác từ trầm hương, cao 8cm. Đực + cái, chiêu tài + giữ tài. Đặt bàn làm việc, quầy thu ngân.</p>" },
  { name: "Phật Di Lặc trầm — cười hạnh phúc", category: "Phong thủy", priceRange: "2-10 triệu", description: "<p>Tượng Phật Di Lặc cười, chế tác thủ công từ trầm hương nguyên khối. Biểu tượng hạnh phúc, may mắn, bao dung. Cao 10–15cm.</p>" },
  { name: "Bút ký trầm hương — quà tặng sếp", category: "Phong thủy", priceRange: "500k-2 triệu", description: "<p>Bút ký cao cấp, thân bút bằng trầm hương nguyên. Mực gel đen, viết mượt. Kèm hộp gỗ. Quà tặng ý nghĩa cho đối tác, sếp.</p>" },
  { name: "Thước kẻ Như Ý bằng trầm", category: "Phong thủy", priceRange: "800k-3 triệu", description: "<p>Thước kẻ 'Như Ý' (Ruyi) bằng trầm hương chạm khắc hoa văn truyền thống. Biểu tượng mọi sự như ý. Đặt bàn làm việc.</p>" },
  { name: "Mặt dây chuyền trầm hương — khắc chữ", category: "Phong thủy", priceRange: "500k-3 triệu", description: "<p>Mặt dây chuyền trầm hương, hình tròn/oval, khắc chữ Phúc, Lộc, hoặc chữ Phạn. Kèm dây da hoặc dây dù. Nam nữ đều đeo được.</p>" },

  // Mỹ nghệ (10)
  { name: "Tranh trầm hương — phong cảnh 40x60", category: "Mỹ nghệ", priceRange: "3-10 triệu", description: "<p>Tranh nghệ thuật làm từ mảnh trầm hương ghép trên nền gỗ. Chủ đề phong cảnh Việt Nam: ruộng bậc thang, thuyền buồm, chùa Một Cột. Khung gỗ hương.</p>" },
  { name: "Hộp đựng trang sức bằng trầm", category: "Mỹ nghệ", priceRange: "800k-3 triệu", description: "<p>Hộp trang sức chế tác từ gỗ trầm, lót nhung đỏ. Mở nắp thơm hương trầm. Kích thước: 15x10x8cm. Quà tặng sang trọng cho phái đẹp.</p>" },
  { name: "Quạt trầm hương — thủ công", category: "Mỹ nghệ", priceRange: "500k-2 triệu", description: "<p>Quạt tay bằng gỗ trầm hương, chạm khắc hoa sen hoặc rồng phượng. Quạt nhẹ tỏa hương. Vừa thực dụng vừa trang trí.</p>" },
  { name: "Đũa trầm hương — bộ 10 đôi", category: "Mỹ nghệ", priceRange: "1-3 triệu/bộ", description: "<p>Bộ 10 đôi đũa trầm hương, tiện tròn đều, đầu vuốt nhọn kiểu Nhật. An toàn thực phẩm. Đóng hộp gỗ. Quà tặng đặc sản Việt.</p>" },
  { name: "Lược trầm hương — dưỡng tóc", category: "Mỹ nghệ", priceRange: "200k-800k", description: "<p>Lược chải tóc bằng trầm hương, răng thưa. Chải tóc tỏa hương, giảm tĩnh điện. Kích thước: 15cm. Kèm túi vải.</p>" },
  { name: "Gạt tàn trầm hương — bàn làm việc", category: "Mỹ nghệ", priceRange: "300k-1 triệu", description: "<p>Gạt tàn thuốc bằng gỗ trầm hương nguyên khối, tiện tay. Hương trầm trung hòa mùi khói thuốc. Đường kính 10cm.</p>" },
  { name: "Kệ sách mini bằng trầm", category: "M�� nghệ", priceRange: "1-4 triệu", description: "<p>Kệ sách mini đặt bàn, chế tác từ gỗ trầm. Đặt 3–5 cuốn sách nhỏ hoặc trưng bày vật phẩm. Tỏa hương nhẹ nhàng cho góc đọc sách.</p>" },
  { name: "Khay trà trầm hương — tao nhã", category: "Mỹ nghệ", priceRange: "1.5-5 triệu", description: "<p>Khay trà chế tác từ gỗ trầm nguyên tấm, kích thước 30x20cm. Thoát nước tốt, hương trầm hòa quyện với hương trà. Nghệ thuật trà đạo.</p>" },
  { name: "Tượng ngựa trầm hương — Mã Đáo Thành Công", category: "Mỹ nghệ", priceRange: "3-15 triệu", description: "<p>Tượng ngựa phi (Mã Đáo Thành Công) chạm từ trầm hương. Biểu tượng thành công, sự nghiệp hanh thông. Cao 15–20cm.</p>" },
  { name: "Bookmark trầm hương — quà lưu niệm", category: "Mỹ nghệ", priceRange: "50k-150k", description: "<p>Bookmark (đánh dấu sách) bằng lát trầm hương mỏng, khắc laser hoa văn truyền thống hoặc logo. Quà lưu niệm đẹp, nhẹ, thơm.</p>" },

  // Trầm nuôi cấy (8)
  { name: "Cây giống dó bầu — 1 năm tuổi", category: "Trầm nuôi cấy", priceRange: "15k-30k/cây", description: "<p>Cây giống dó bầu (Aquilaria crassna) 1 năm tuổi, cao 40–60cm. Giống từ vườn mẹ Khánh Hòa, tỷ lệ sống >95%. Cung cấp số lượng lớn.</p>" },
  { name: "Chế phẩm vi sinh tạo trầm — BIOOUD", category: "Trầm nuôi cấy", priceRange: "200k-500k/lít", description: "<p>Chế phẩm vi sinh chuyên dụng cho tạo trầm nhân tạo. Tiêm vào thân cây dó bầu 5+ năm tuổi. Hiệu quả sau 12–18 tháng. Hướng dẫn kỹ thuật kèm theo.</p>" },
  { name: "Trầm nuôi cấy 10 năm — nguyên liệu", category: "Trầm nuôi cấy", priceRange: "1-3 triệu/kg", description: "<p>Trầm hương từ cây dó bầu nuôi cấy 10 năm tuổi, tạo trầm bằng vi sinh. Chất lượng ổn định, phù hợp sản xuất nhang, bột trầm, tinh dầu.</p>" },
  { name: "Bộ dụng cụ tạo trầm — starter kit", category: "Trầm nu��i cấy", priceRange: "500k-1.2 triệu/bộ", description: "<p>Bộ dụng cụ cơ bản cho người mới bắt đầu tạo trầm: khoan tay, kim tiêm, 2 lít chế phẩm vi sinh, 100 nút bịt. Kèm tài liệu hướng dẫn chi tiết.</p>" },
  { name: "Trầm nuôi cấy 15 năm — cao cấp", category: "Trầm nuôi cấy", priceRange: "3-8 triệu/kg", description: "<p>Trầm từ cây 15 năm tuổi, tạo trầm bằng kỹ thuật kết hợp (vi sinh + tổn thương cơ học). Hương gần giống trầm tự nhiên. Phù hợp chế tác, xông hương.</p>" },
  { name: "Dịch vụ tư vấn trồng trầm — trọn gói", category: "Trầm nuôi cấy", priceRange: "5-15 triệu/ha", description: "<p>Dịch vụ tư vấn trọn gói: khảo sát đất, thiết kế vườn, cung cấp giống, kỹ thuật trồng & chăm sóc, tạo trầm. Cam kết hỗ trợ kỹ thuật 3 năm.</p>" },
  { name: "Phân bón chuyên dụng cho dó bầu", category: "Trầm nuôi cấy", priceRange: "80k-150k/5kg", description: "<p>Phân hữu cơ vi sinh chuyên dụng cho cây dó bầu. Giúp cây phát triển khỏe, tăng khả năng tạo trầm. Bón 2 lần/năm. Bao 5kg.</p>" },
  { name: "Trầm nuôi cấy thô — xuất khẩu", category: "Trầm nuôi cấy", priceRange: "500k-2 triệu/kg", description: "<p>Trầm nuôi cấy dạng thô (chưa chế biến), cung cấp với số lượng lớn cho xuất khẩu. Có CO, phytosanitary certificate. MOQ: 100kg.</p>" },

  // Thực phẩm (8)
  { name: "Trà lá trầm hương — hộp 20 túi lọc", category: "Thực phẩm", priceRange: "80k-200k/hộp", description: "<p>Trà từ lá cây dó bầu sấy nhẹ nhiệt, không caffeine. Vị thanh mát, hậu ngọt nhẹ. Hỗ trợ thư giãn, giảm stress. Uống nóng hoặc lạnh đều ngon.</p>" },
  { name: "Mật ong trầm hương — 500ml", category: "Thực phẩm", priceRange: "200k-400k/chai", description: "<p>Mật ong từ đàn ong nuôi trong vườn dó bầu. Hương vị đặc trưng, có mùi trầm nhẹ. Giàu kháng sinh tự nhiên. Ngâm nước ấm uống mỗi sáng.</p>" },
  { name: "Rượu trầm hương — 500ml", category: "Thực ph���m", priceRange: "300k-800k/chai", description: "<p>Rượu gạo truyền thống 40° ngâm trầm hương 6+ tháng. Theo Đông y: ấm bụng, hỗ trợ tiêu hóa, an thần. Chai thủy tinh, nhãn mác đầy đủ.</p>" },
  { name: "Kẹo trầm hương — đặc sản Khánh Hòa", category: "Thực phẩm", priceRange: "30k-60k/gói", description: "<p>Kẹo mềm vị trầm hương, đặc sản Khánh Hòa. Chiết xuất trầm hương tự nhiên, vị ngọt thanh, hậu thơm. Gói 200g. Quà du lịch.</p>" },
  { name: "Trà trầm + hoa cúc — an giấc", category: "Thực phẩm", priceRange: "100k-250k/hộp", description: "<p>Trà túi lọc: lá trầm hương + hoa cúc La Mã. Công dụng: thư giãn, an giấc, giảm lo âu. Uống trước khi ngủ 30 phút. Hộp 30 túi.</p>" },
  { name: "Giấm trầm hương — detox", category: "Thực phẩm", priceRange: "150k-300k/500ml", description: "<p>Giấm lên men từ gỗ trầm hương, 3 tháng ủ. Pha nước uống (10ml/ly) giúp thanh lọc cơ thể, hỗ trợ tiêu hóa. Chứng nhận ATTP.</p>" },
  { name: "Bột trầm hương pha uống — 100g", category: "Thực phẩm", priceRange: "200k-500k/100g", description: "<p>Bột trầm hương siêu mịn, food grade, pha nước nóng uống. Vị đắng nhẹ, hậu ngọt. Hỗ trợ an thần, giảm stress. Dùng 1–2g/ngày.</p>" },
  { name: "Combo quà lưu niệm Khánh Hòa — trầm hương", category: "Th���c phẩm", priceRange: "200k-400k/combo", description: "<p>Combo quà lưu niệm gồm: 1 gói kẹo trầm + 1 hộp trà trầm + 1 túi thơm trầm. Đóng gói đẹp, lý tưởng mua về tặng sau chuyến du lịch Nha Trang.</p>" },
]

async function main() {
  console.log("🌱 Bắt đầu seed nội dung (100 posts + 100 products)...\n")

  // ── Fetch all users with their companies ──────────────────────
  const allUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      displayPriority: true,
      company: { select: { id: true, slug: true } },
    },
    orderBy: { displayPriority: "desc" },
  })

  if (allUsers.length === 0) {
    console.error("❌ Không có user nào! Chạy `npx prisma db seed` trước.")
    return
  }

  const vipUsers = allUsers.filter((u) => u.role === "VIP")
  const usersWithCompany = allUsers.filter((u) => u.company)
  const allTags = await prisma.tag.findMany({ select: { id: true } })

  console.log(`  Users: ${allUsers.length} (VIP: ${vipUsers.length}, có company: ${usersWithCompany.length})`)
  console.log(`  Tags: ${allTags.length}\n`)

  // ── Delete old content ────────────────────────────────────────
  console.log("🧹 Xóa posts và products cũ...")
  await prisma.postTag.deleteMany()
  await prisma.postReaction.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.report.deleteMany()
  await prisma.post.deleteMany()
  await prisma.certification.deleteMany()
  await prisma.product.deleteMany()
  console.log("✅ Đã xóa.\n")

  // ════════════════════════════════════════════════════════════════
  // SEED 100 POSTS
  // ══════��════════════════════════════════���════════════════════════
  console.log("📝 Tạo 100 bài viết feed...")

  // Build 100 posts from templates — mix categories
  const postTemplates: { title: string; content: string; category: PostCategory }[] = []

  // 50 GENERAL
  for (const p of GENERAL_POSTS) {
    postTemplates.push({ ...p, category: PostCategory.GENERAL })
  }
  // Pad to 50 if needed
  while (postTemplates.length < 50) {
    const base = pick(GENERAL_POSTS)
    postTemplates.push({
      title: base.title + ` (${postTemplates.length + 1})`,
      content: base.content,
      category: PostCategory.GENERAL,
    })
  }

  // 30 NEWS (from VIP/company users)
  for (const p of NEWS_POSTS) {
    postTemplates.push({ ...p, category: PostCategory.NEWS })
  }
  while (postTemplates.filter((p) => p.category === PostCategory.NEWS).length < 30) {
    const base = pick(NEWS_POSTS)
    postTemplates.push({
      title: base.title + ` — cập nhật`,
      content: base.content,
      category: PostCategory.NEWS,
    })
  }

  // 20 PRODUCT posts
  for (const p of PRODUCT_POSTS) {
    postTemplates.push({ ...p, category: PostCategory.PRODUCT })
  }
  while (postTemplates.filter((p) => p.category === PostCategory.PRODUCT).length < 20) {
    const base = pick(PRODUCT_POSTS)
    postTemplates.push({
      title: base.title + ` — mới`,
      content: base.content,
      category: PostCategory.PRODUCT,
    })
  }

  // Shuffle and take exactly 100
  const posts100 = postTemplates.sort(() => Math.random() - 0.5).slice(0, 100)

  let postCount = 0
  for (const tmpl of posts100) {
    // Assign author: NEWS & PRODUCT → VIP users, GENERAL → any user
    const author =
      tmpl.category === PostCategory.GENERAL
        ? pick(allUsers)
        : pick(vipUsers.length > 0 ? vipUsers : allUsers)

    const isVip = author.role === "VIP" || author.role === "ADMIN"
    const createdAt = randomDate(90) // last 90 days

    try {
      const post = await prisma.post.create({
        data: {
          authorId: author.id,
          title: tmpl.title,
          content: tmpl.content,
          category: tmpl.category,
          isPremium: isVip,
          authorPriority: author.displayPriority,
          viewCount: Math.floor(Math.random() * 500) + 10,
          createdAt,
          updatedAt: createdAt,
        },
      })

      // Attach 1–3 random tags
      if (allTags.length > 0) {
        const tags = pickN(allTags, Math.floor(Math.random() * 3) + 1)
        await prisma.postTag.createMany({
          data: tags.map((t) => ({ postId: post.id, tagId: t.id })),
          skipDuplicates: true,
        })
      }

      postCount++
    } catch (e) {
      console.error(`  ❌ Post "${tmpl.title}": ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log(`✅ Posts: ${postCount}/100\n`)

  // ════════════════���═══════════════════════════════════════════════
  // SEED 100 PRODUCTS
  // ════════════════════════���═══════════════════════════════════════
  console.log("🛍️ Tạo 100 sản phẩm marketplace...")

  // Take all product templates, pad to 100 if needed, shuffle
  const productPool = [...PRODUCTS]
  while (productPool.length < 100) {
    const base = pick(PRODUCTS)
    productPool.push({
      ...base,
      name: base.name + ` — mẫu ${productPool.length + 1}`,
    })
  }
  const products100 = productPool.sort(() => Math.random() - 0.5).slice(0, 100)

  let productCount = 0
  const usedSlugs = new Set<string>()

  for (let i = 0; i < products100.length; i++) {
    const tmpl = products100[i]

    // 70% from users with company, 30% from individual users
    const useCompany = Math.random() < 0.7 && usersWithCompany.length > 0
    const owner = useCompany
      ? pick(usersWithCompany)
      : pick(allUsers)

    let slug = slugify(tmpl.name)
    // Ensure unique slug
    if (usedSlugs.has(slug)) slug = slug + "-" + (i + 1)
    usedSlugs.add(slug)

    const createdAt = randomDate(120) // last 120 days

    // Some products from VIP companies get certified status
    const isFromCompany = !!owner.company
    const certChance = isFromCompany ? 0.2 : 0 // 20% of company products are certified
    const isCertified = Math.random() < certChance

    // Some get featured
    const isFeatured = Math.random() < 0.08 // 8% featured

    try {
      await prisma.product.create({
        data: {
          ownerId: owner.id,
          companyId: owner.company?.id ?? null,
          name: tmpl.name,
          slug,
          description: tmpl.description,
          category: tmpl.category,
          priceRange: tmpl.priceRange,
          imageUrls: [],
          isPublished: true,
          certStatus: isCertified ? "APPROVED" : "DRAFT",
          ...(isCertified && { certApprovedAt: randomDate(60) }),
          isFeatured,
          featuredOrder: isFeatured ? Math.floor(Math.random() * 50) + 1 : null,
          ownerPriority: owner.displayPriority,
          createdAt,
          updatedAt: createdAt,
        },
      })
      productCount++
    } catch (e) {
      console.error(`  ❌ Product "${tmpl.name}": ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log(`✅ Products: ${productCount}/100\n`)

  // ── Summary ───────────────────────────────────────────────────
  const finalPosts = await prisma.post.count()
  const finalProducts = await prisma.product.count()
  const certProducts = await prisma.product.count({ where: { certStatus: "APPROVED" } })
  const featProducts = await prisma.product.count({ where: { isFeatured: true } })
  const companyProducts = await prisma.product.count({ where: { companyId: { not: null } } })

  console.log("═".repeat(55))
  console.log("🎉 SEED NỘI DUNG HOÀN TẤT")
  console.log("═".repeat(55))
  console.log(`Bài viết:     ${finalPosts}`)
  console.log(`  GENERAL:    ${await prisma.post.count({ where: { category: "GENERAL" } })}`)
  console.log(`  NEWS:       ${await prisma.post.count({ where: { category: "NEWS" } })}`)
  console.log(`  PRODUCT:    ${await prisma.post.count({ where: { category: "PRODUCT" } })}`)
  console.log(`Sản phẩm:     ${finalProducts}`)
  console.log(`  Doanh nghiệp: ${companyProducts}`)
  console.log(`  Cá nhân:    ${finalProducts - companyProducts}`)
  console.log(`  Chứng nhận: ${certProducts}`)
  console.log(`  Nổi bật:    ${featProducts}`)
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
