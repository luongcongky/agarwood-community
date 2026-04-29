import { redirect } from "next/navigation"

/**
 * Backward-compat redirect: trang tạo banner đã gộp vào `/admin/banner`
 * thành workbench (mockup chọn vị trí + form bên phải). Bookmark cũ vẫn
 * hoạt động.
 */
export default function AdminBannerCreatePage() {
  redirect("/admin/banner")
}
