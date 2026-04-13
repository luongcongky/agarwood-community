import Link from "next/link"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-200 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Brand */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Hội Trầm Hương Việt Nam"
                width={56}
                height={56}
                className="h-14 w-14 shrink-0"
              />
              <h3 className="text-brand-100 font-semibold text-lg">
                Hội Trầm Hương Việt Nam
              </h3>
            </div>
            {/* text-base (16px) trên mobile — người dùng 40-60 tuổi cần đọc được */}
            <p className="text-base sm:text-sm text-brand-300 leading-relaxed">
              Kết nối cộng đồng doanh nghiệp trầm hương — chứng nhận sản phẩm,
              chia sẻ tri thức và phát triển thị trường bền vững.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-brand-100 font-semibold text-sm uppercase tracking-wider">
              Liên kết nhanh
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                { label: "Trang chủ",         href: "/" },
                { label: "Doanh nghiệp",      href: "/doanh-nghiep" },
                { label: "Dịch vụ",           href: "/dich-vu" },
                { label: "Điều lệ Hội",       href: "/dieu-le" },
                { label: "Liên hệ",           href: "/lien-he" },
                { label: "Văn bản pháp quy",  href: "/phap-ly" },
              ].map((l) => (
                <li key={l.href}>
                  {/* py-1 tăng vùng tap trên mobile */}
                  <Link
                    href={l.href}
                    className="block py-1 text-base sm:text-sm text-brand-300 hover:text-brand-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-brand-100 font-semibold text-sm uppercase tracking-wider">
              Liên hệ
            </h4>
            <ul className="space-y-2 text-base sm:text-sm text-brand-300">
              <li>📧 hoitramhuongvietnam2010@gmail.com</li>
              <li>📞 0913 810 060 · 0938 334 647</li>
              <li>📍 Số 150, Lý Chính Thắng, P. Xuân Hòa, TP.HCM</li>
              <li>🌐 hoitramhuong.vn</li>
            </ul>
          </div>

        </div>

        <Separator className="my-8 bg-brand-700" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-brand-400">
          <span>© {new Date().getFullYear()} Hội Trầm Hương Việt Nam. Bảo lưu mọi quyền.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-brand-300 transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="hover:text-brand-300 transition-colors">
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
