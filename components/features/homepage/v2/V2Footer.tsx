import Link from "next/link"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"

// Fetch Chủ tịch + Phó CT + TTK + CVP cho cột "Lãnh đạo Hội".
// Match title bằng regex vì admin nhập free-text (đồng bộ cách Footer v1 đang làm).
const getLeadership = unstable_cache(
  async () =>
    prisma.leader.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: "Chủ tịch", mode: "insensitive" } },
          { title: { contains: "Tổng Thư ký", mode: "insensitive" } },
          { title: { contains: "Chánh Văn Phòng", mode: "insensitive" } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        name_en: true,
        name_zh: true,
        name_ar: true,
        title: true,
      },
      take: 10,
    }),
  ["v2_footer_leadership"],
  { revalidate: 600, tags: ["footer", "leaders"] },
)

export async function V2Footer() {
  const [leaders, t, locale] = await Promise.all([
    getLeadership(),
    getTranslations("footer"),
    getLocale() as Promise<Locale>,
  ])
  const year = new Date().getFullYear()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lName = (r: any) =>
    (localize(r as Record<string, unknown>, "name", locale) as string) ?? ""

  const chuTich = leaders.find((l) => /^Chủ tịch\s*$/i.test(l.title.trim()))
  const phoChuTich = leaders
    .filter((l) => /Phó Chủ tịch/i.test(l.title))
    .slice(0, 3)
  const tongThuKy = leaders.find((l) => /Tổng Thư ký/i.test(l.title))
  const chanhVanPhong = leaders.find((l) => /Chánh Văn Phòng/i.test(l.title))

  const hasLeadership =
    chuTich || phoChuTich.length > 0 || tongThuKy || chanhVanPhong

  return (
    <footer className="bg-brand-900 text-neutral-200">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-6 lg:gap-10 lg:px-8 lg:py-12">
        {/* About (col-span-2) */}
        <div className="sm:col-span-2 lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Hội Trầm Hương Việt Nam
          </h3>
          <p className="text-[13px] leading-relaxed text-neutral-300">
            Kết nối cộng đồng doanh nghiệp trầm hương — chứng nhận sản phẩm,
            chia sẻ tri thức và phát triển thị trường bền vững.
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
            Thành lập theo Quyết định số 23/QĐ-BNV ngày 11/01/2010 của Bộ Nội Vụ.
          </p>
        </div>

        {/* Leadership */}
        {hasLeadership && (
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
              {t("leadership")}
            </h3>
            <ul className="space-y-2 text-[13px] leading-snug text-neutral-300">
              {chuTich && (
                <li>
                  <span className="block text-[11px] uppercase tracking-wide text-neutral-400">
                    {t("chairman")}
                  </span>
                  <span className="font-semibold text-white">
                    {lName(chuTich)}
                  </span>
                </li>
              )}
              {phoChuTich.map((l) => (
                <li key={l.id}>
                  <span className="block text-[11px] uppercase tracking-wide text-neutral-400">
                    {t("viceChairman")}
                  </span>
                  <span>{lName(l)}</span>
                </li>
              ))}
              {tongThuKy && (
                <li>
                  <span className="block text-[11px] uppercase tracking-wide text-neutral-400">
                    {t("secretaryGeneral")}
                  </span>
                  <span>{lName(tongThuKy)}</span>
                </li>
              )}
              {chanhVanPhong && (
                <li>
                  <span className="block text-[11px] uppercase tracking-wide text-neutral-400">
                    {t("chiefOfOffice")}
                  </span>
                  <span>{lName(chanhVanPhong)}</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Quick links */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Liên kết nhanh
          </h3>
          <ul className="space-y-1.5 text-[13px]">
            <li>
              <Link href="/gioi-thieu" className="hover:text-white hover:underline">
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link href="/dieu-le" className="hover:text-white hover:underline">
                Điều lệ
              </Link>
            </li>
            <li>
              <Link href="/ban-lanh-dao" className="hover:text-white hover:underline">
                Ban lãnh đạo
              </Link>
            </li>
            <li>
              <Link href="/tin-tuc" className="hover:text-white hover:underline">
                Tin tức
              </Link>
            </li>
            <li>
              <Link href="/nghien-cuu" className="hover:text-white hover:underline">
                Nghiên cứu
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Liên hệ
          </h3>
          <address className="text-[13px] not-italic leading-relaxed text-neutral-300">
            Số 150, Đường Lý Chính Thắng
            <br />
            Phường Xuân Hòa
            <br />
            Thành phố Hồ Chí Minh
            <br />
            <a
              href="mailto:contact@hoitramhuong.vn"
              className="hover:text-white hover:underline"
            >
              contact@hoitramhuong.vn
            </a>
          </address>
        </div>

        {/* Working hours */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Giờ làm việc
          </h3>
          <p className="text-[13px] leading-relaxed text-neutral-300">
            Thứ 2 - Thứ 6
            <br />
            8:00 - 17:00
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://www.facebook.com/hoitramhuongvietnam.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center border border-neutral-500 text-xs font-bold text-neutral-300 hover:border-white hover:text-white"
              aria-label="Facebook"
            >
              f
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-800 bg-black/30">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-4 text-[12px] text-neutral-400 sm:flex-row sm:px-6 lg:px-8">
          <span>© {year} Hội Trầm Hương Việt Nam. Bảo lưu mọi quyền.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white hover:underline">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="hover:text-white hover:underline">
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
