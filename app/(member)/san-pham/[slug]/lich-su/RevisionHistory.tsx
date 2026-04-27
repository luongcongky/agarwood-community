"use client"

import { useMemo, useState } from "react"
import { diffLines, diffWords } from "diff"
import { cn } from "@/lib/utils"

type Revision = {
  id: string
  version: number
  editedAt: string // ISO
  editedRole: string
  reason: string | null
  changedFields: string[]
  editor: { id: string; name: string; email: string }
  name: string
  name_en: string | null
  name_zh: string | null
  name_ar: string | null
  slug: string
  description: string | null
  description_en: string | null
  description_zh: string | null
  description_ar: string | null
  category: string | null
  category_en: string | null
  category_zh: string | null
  category_ar: string | null
  priceRange: string | null
  imageUrls: string[]
  isPublished: boolean
}

const FIELD_LABELS: Record<string, string> = {
  name: "Tên sản phẩm",
  name_en: "Tên (EN)",
  name_zh: "Tên (中文)",
  name_ar: "Tên (العربية)",
  slug: "Slug",
  description: "Mô tả",
  description_en: "Mô tả (EN)",
  description_zh: "Mô tả (中文)",
  description_ar: "Mô tả (العربية)",
  category: "Danh mục",
  category_en: "Danh mục (EN)",
  category_zh: "Danh mục (中文)",
  category_ar: "Danh mục (العربية)",
  priceRange: "Mức giá",
  imageUrls: "Hình ảnh",
  isPublished: "Công khai",
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  OWNER: { label: "Chủ sở hữu", cls: "bg-brand-100 text-brand-800" },
  ADMIN: { label: "Admin", cls: "bg-red-100 text-red-800" },
  TRUYEN_THONG: { label: "Ban Truyền thông", cls: "bg-purple-100 text-purple-800" },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Strip HTML tags → text line-based để diffLines không lạc giữa tag. */
function htmlToPlainLines(html: string | null): string {
  if (!html) return ""
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim()
}

export function RevisionHistory({ revisions }: { revisions: Revision[] }) {
  // Mặc định chọn 2 version gần nhất (newer vs older) để so sánh ngay.
  const [compareA, setCompareA] = useState<number>(revisions[1]?.version ?? revisions[0].version)
  const [compareB, setCompareB] = useState<number>(revisions[0].version)

  const revA = revisions.find((r) => r.version === compareA)
  const revB = revisions.find((r) => r.version === compareB)

  const fieldDiffs = useMemo(() => {
    if (!revA || !revB) return []
    const diffs: { field: string; kind: "text" | "html" | "images" | "bool"; a: unknown; b: unknown }[] = []
    for (const f of Object.keys(FIELD_LABELS)) {
      const key = f as keyof Revision
      const a = revA[key] as unknown
      const b = revB[key] as unknown
      const equal = Array.isArray(a) && Array.isArray(b)
        ? a.length === b.length && a.every((v, i) => v === b[i])
        : a === b
      if (equal) continue
      if (f.startsWith("description")) {
        diffs.push({ field: f, kind: "html", a, b })
      } else if (f === "imageUrls") {
        diffs.push({ field: f, kind: "images", a, b })
      } else if (f === "isPublished") {
        diffs.push({ field: f, kind: "bool", a, b })
      } else {
        diffs.push({ field: f, kind: "text", a, b })
      }
    }
    return diffs
  }, [revA, revB])

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
      {/* ── Revision list ──────────────────────────────────────────── */}
      <aside className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        <h2 className="text-sm font-semibold text-brand-900">Các phiên bản</h2>
        <ol className="space-y-1.5">
          {revisions.map((r) => {
            const isA = r.version === compareA
            const isB = r.version === compareB
            const role = ROLE_LABELS[r.editedRole] ?? { label: r.editedRole, cls: "bg-gray-100 text-gray-700" }
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    // Click 1 version → đưa nó thành B (new), version cũ hơn kế tiếp thành A.
                    if (isB) return
                    if (isA) {
                      setCompareA(compareB)
                      setCompareB(r.version)
                    } else {
                      setCompareA(compareB)
                      setCompareB(r.version)
                    }
                  }}
                  className={cn(
                    "w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors",
                    isB
                      ? "border-emerald-400 bg-emerald-50"
                      : isA
                        ? "border-sky-400 bg-sky-50"
                        : "border-brand-200 bg-white hover:bg-brand-50",
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-brand-900">v{r.version}</span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", role.cls)}>
                      {role.label}
                    </span>
                  </div>
                  <p className="mt-1 text-brand-700">{r.editor.name}</p>
                  <p className="text-[11px] text-brand-500">{formatDate(r.editedAt)}</p>
                  {r.version !== 0 && r.changedFields.length > 0 && (
                    <p className="mt-1 text-[10px] text-brand-500 line-clamp-1">
                      Đổi: {r.changedFields.map((f) => FIELD_LABELS[f] ?? f).join(", ")}
                    </p>
                  )}
                  {r.version === 0 && (
                    <p className="mt-1 text-[10px] text-brand-400 italic">Phiên bản khởi tạo</p>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      {/* ── Compare view ───────────────────────────────────────────── */}
      <section className="space-y-4 min-w-0">
        <div className="rounded-xl border border-brand-200 bg-white p-4 text-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span className="text-xs text-brand-500">So sánh:</span>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-sky-200 border border-sky-400" />
                A = v{compareA} (cũ hơn)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-emerald-200 border border-emerald-400" />
                B = v{compareB} (mới hơn)
              </span>
            </div>
          </div>

          {revA && revB && (
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-brand-600">
              <RevSummary title="Phiên bản A (cũ hơn)" rev={revA} />
              <RevSummary title="Phiên bản B (mới hơn)" rev={revB} />
            </div>
          )}
        </div>

        {revA && revB && fieldDiffs.length === 0 && (
          <div className="rounded-xl border border-brand-200 bg-white p-6 text-center text-sm text-brand-500">
            Hai phiên bản này giống hệt nhau (không có field nào đổi).
          </div>
        )}

        {fieldDiffs.map(({ field, kind, a, b }) => (
          <article key={field} className="rounded-xl border border-brand-200 bg-white p-5 space-y-2">
            <h3 className="font-semibold text-brand-900 text-sm">
              {FIELD_LABELS[field]}
            </h3>
            {kind === "text" && (
              <InlineTextDiff a={String(a ?? "")} b={String(b ?? "")} />
            )}
            {kind === "html" && (
              <HtmlLineDiff a={String(a ?? "")} b={String(b ?? "")} />
            )}
            {kind === "images" && (
              <ImageDiff a={a as string[]} b={b as string[]} />
            )}
            {kind === "bool" && (
              <p className="text-sm">
                <span className="text-sky-700 line-through">{a ? "Công khai" : "Ẩn"}</span>{" "}
                →{" "}
                <span className="text-emerald-700 font-semibold">{b ? "Công khai" : "Ẩn"}</span>
              </p>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}

function RevSummary({ title, rev }: { title: string; rev: Revision }) {
  const role = ROLE_LABELS[rev.editedRole] ?? { label: rev.editedRole, cls: "bg-gray-100 text-gray-700" }
  return (
    <div className="space-y-1">
      <p className="font-semibold text-brand-800">{title}</p>
      <p>v{rev.version} · {formatDate(rev.editedAt)}</p>
      <p>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", role.cls)}>{role.label}</span>{" "}
        {rev.editor.name} ({rev.editor.email})
      </p>
      {rev.reason && (
        <p className="italic text-brand-500 line-clamp-2" title={rev.reason}>
          Lý do: {rev.reason}
        </p>
      )}
    </div>
  )
}

/** Word-level diff cho text ngắn (tên, slug, category, giá). */
function InlineTextDiff({ a, b }: { a: string; b: string }) {
  const parts = diffWords(a, b)
  return (
    <p className="text-sm leading-relaxed font-mono break-words">
      {parts.map((part, i) => (
        <span
          key={i}
          className={cn(
            part.added && "bg-emerald-100 text-emerald-900 px-0.5 rounded",
            part.removed && "bg-sky-100 text-sky-700 line-through px-0.5 rounded",
          )}
        >
          {part.value}
        </span>
      ))}
    </p>
  )
}

/** Line-level diff cho description (HTML). Strip tag thành text lines rồi
 *  diff. Mất formatting nhưng rõ nội dung nào đổi — phù hợp audit. */
function HtmlLineDiff({ a, b }: { a: string; b: string }) {
  const aText = htmlToPlainLines(a)
  const bText = htmlToPlainLines(b)
  const parts = diffLines(aText, bText)
  return (
    <pre className="text-xs leading-6 whitespace-pre-wrap font-mono bg-brand-50/30 rounded-lg p-3 overflow-x-auto">
      {parts.map((part, i) => (
        <span
          key={i}
          className={cn(
            "block",
            part.added && "bg-emerald-100 text-emerald-900 border-l-2 border-emerald-500 pl-2",
            part.removed && "bg-sky-100 text-sky-700 line-through border-l-2 border-sky-400 pl-2",
          )}
        >
          {part.added ? "+ " : part.removed ? "− " : "  "}
          {part.value.replace(/\n$/, "")}
        </span>
      ))}
    </pre>
  )
}

function ImageDiff({ a, b }: { a: string[]; b: string[] }) {
  const setA = new Set(a)
  const setB = new Set(b)
  const removed = a.filter((url) => !setB.has(url))
  const added = b.filter((url) => !setA.has(url))
  const kept = a.filter((url) => setB.has(url))

  if (added.length + removed.length === 0) {
    return <p className="text-xs text-brand-500">Thứ tự ảnh thay đổi nhưng danh sách giống nhau.</p>
  }

  return (
    <div className="space-y-2 text-xs">
      {added.length > 0 && (
        <div>
          <p className="font-semibold text-emerald-700 mb-1">+ Thêm ({added.length})</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {added.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="aspect-square object-cover rounded border border-emerald-300" />
            ))}
          </div>
        </div>
      )}
      {removed.length > 0 && (
        <div>
          <p className="font-semibold text-sky-700 mb-1">− Xoá ({removed.length})</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {removed.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="aspect-square object-cover rounded border border-sky-300 opacity-60" />
            ))}
          </div>
        </div>
      )}
      {kept.length > 0 && (
        <p className="text-[11px] text-brand-400">{kept.length} ảnh giữ nguyên</p>
      )}
    </div>
  )
}
