import Link from "next/link"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "404 — Trang không tìm thấy | Hội Trầm Hương Việt Nam",
}

export default function NotFound() {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center",
        "bg-brand-50 px-4 text-center"
      )}
    >
      <div className="text-6xl mb-6">🌿</div>

      <p className="text-8xl font-extrabold text-brand-600 leading-none tracking-tight">
        404
      </p>

      <h1 className="mt-4 text-2xl font-bold text-brand-900 sm:text-3xl">
        Trang không tìm thấy
      </h1>

      <p className="mt-3 max-w-md text-brand-600">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui lòng
        kiểm tra lại đường dẫn hoặc quay về trang chủ.
      </p>

      <div className="mt-8">
        <Link
          href="/"
          className={cn(
            "inline-flex items-center justify-center rounded-lg",
            "bg-brand-700 px-6 py-3 text-base font-semibold text-white",
            "transition-colors hover:bg-brand-800 active:bg-brand-900"
          )}
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
