"use client"

import { DieuLeUploader } from "@/app/(admin)/admin/cai-dat/DieuLeUploader"

type Props = {
  /** Map từ SiteConfig key → value cho mọi key dieu_le_* (cả 3 locale). */
  files: Record<string, string>
}

const LOCALES = ["vi", "en", "zh", "ar"] as const
type DieuLeLocale = (typeof LOCALES)[number]

function suffixFor(locale: DieuLeLocale): string {
  return locale === "vi" ? "" : `_${locale}`
}

export function DieuLeMockup({ files }: Props) {
  return (
    <div className="space-y-6">
      {/* ── Mockup trang /dieu-le ───────────────────────────────────── */}
      <div className="bg-brand-50 rounded-xl p-6 border border-brand-100">
        <h3 className="text-sm font-bold text-brand-900 mb-4 uppercase tracking-wider">
          Bố cục trang: Điều lệ
        </h3>
        <div className="bg-white border border-brand-200 rounded-lg shadow-sm overflow-hidden text-[10px]">
          {/* Browser Header */}
          <div className="bg-brand-50 border-b border-brand-100 px-3 py-1.5 flex items-center gap-1.5">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="bg-white border border-brand-100 rounded px-2 py-0.5 flex-1 mx-4 text-center text-brand-400 truncate">
              hoitramhuong.vn/dieu-le
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 p-6">
            {/* Sidebar (left): PDF download card + TOC */}
            <aside className="col-span-4 space-y-3">
              {/* PDF download card — đây là vùng đọc file dieu_le_drive_file_id */}
              <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📄</span>
                  <span className="text-[8px] font-bold text-emerald-900">
                    PDF Điều lệ chính thức
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[7px] text-emerald-700">dieu-le-vawa.pdf</div>
                  <div className="text-[6px] text-emerald-600">2.1 MB · cập nhật 2023</div>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div className="bg-emerald-700 text-white text-[7px] font-bold text-center py-1 rounded">
                    👁 Xem
                  </div>
                  <div className="bg-white border border-emerald-300 text-emerald-700 text-[7px] font-bold text-center py-1 rounded">
                    ⬇ Tải
                  </div>
                </div>
              </div>
              {/* TOC */}
              <div className="space-y-1">
                <div className="text-[7px] font-bold uppercase text-brand-500">Mục lục</div>
                {["I. Quy định chung", "II. Hội viên", "III. Tổ chức", "IV. Tài chính", "V. ..."].map(
                  (c, i) => (
                    <div key={i} className="text-[7px] text-brand-600 truncate">
                      {c}
                    </div>
                  ),
                )}
              </div>
            </aside>

            {/* Main content: chapter/article render */}
            <main className="col-span-8 space-y-2">
              <div className="space-y-1">
                <div className="text-[7px] font-bold uppercase text-brand-500">Chương I</div>
                <div className="h-3 w-2/3 bg-brand-200/70 rounded" />
                <div className="h-2 w-full bg-brand-100 rounded mt-1.5" />
                <div className="h-2 w-5/6 bg-brand-100 rounded" />
                <div className="h-2 w-3/4 bg-brand-100 rounded" />
              </div>
              <div className="space-y-1 mt-3">
                <div className="text-[7px] font-bold uppercase text-brand-500">Chương II</div>
                <div className="h-3 w-1/2 bg-brand-200/70 rounded" />
                <div className="h-2 w-full bg-brand-100 rounded mt-1.5" />
                <div className="h-2 w-4/5 bg-brand-100 rounded" />
              </div>
            </main>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-brand-500 italic">
          * Sidebar bên trái hiển thị nút Tải/Xem PDF Điều lệ — file ở đây sẽ thay đổi theo
          ngôn ngữ user đang chọn (URL `/vi/dieu-le`, `/en/dieu-le`, `/zh/dieu-le`).
        </p>
      </div>

      {/* ── Uploader per locale ──────────────────────────────────────── */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wider">
            File PDF — mỗi ngôn ngữ một bản
          </h3>
          <p className="mt-1 text-xs text-brand-500">
            Bản VI là pháp lý gốc (do Bộ Nội vụ phê duyệt). Bản EN/ZH là dịch công chứng.
            Locale không có file riêng sẽ fallback về bản VI trên trang viewer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {LOCALES.map((loc) => {
            const s = suffixFor(loc)
            return (
              <DieuLeUploader
                key={loc}
                locale={loc}
                currentFileId={files[`dieu_le_drive_file_id${s}`] ?? null}
                currentFileName={files[`dieu_le_file_name${s}`] ?? null}
                currentFileSize={files[`dieu_le_file_size${s}`] ?? null}
                currentUploadedAt={files[`dieu_le_uploaded_at${s}`] ?? null}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
