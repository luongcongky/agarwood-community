import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chờ duyệt | Hội Trầm Hương Việt Nam",
}

export default function PendingApprovalPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-brand-200 shadow-lg p-8 space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
          <span className="text-3xl">⏳</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-brand-900">Đơn đăng ký đang chờ duyệt</h1>
          <p className="text-sm text-brand-500 mt-2">
            Ban quản trị đang xem xét đơn đăng ký hội viên của bạn.
            Thời gian xử lý thông thường là <strong>1–3 ngày làm việc</strong>.
          </p>
        </div>

        <div className="bg-brand-50 rounded-xl p-4 text-sm text-brand-600 space-y-2">
          <p className="font-medium">Bạn sẽ nhận được email thông báo khi:</p>
          <ul className="text-left space-y-1 ml-4 list-disc">
            <li>Đơn được phê duyệt — kèm hướng dẫn kích hoạt</li>
            <li>Cần bổ sung thông tin — admin sẽ liên hệ qua email</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-block rounded-xl bg-brand-700 text-white font-semibold py-2.5 px-6 text-sm hover:bg-brand-800 transition-colors"
          >
            Về trang chủ
          </Link>
          <Link
            href="/lien-he"
            className="text-sm text-brand-600 hover:text-brand-800"
          >
            Liên hệ ban quản trị
          </Link>
        </div>
      </div>
    </div>
  )
}
