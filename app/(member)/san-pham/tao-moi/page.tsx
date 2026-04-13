import { redirect } from "next/navigation"

// Trang tạo sản phẩm cũ đã được gộp vào composer thống nhất ở /feed/tao-bai.
// Giữ route này để các bookmark/deep-link cũ không 404.
export default function CreateProductPage() {
  redirect("/feed/tao-bai?category=PRODUCT")
}
