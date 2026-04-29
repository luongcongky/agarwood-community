import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * Phase 3.6 (2026-04): trang lịch sử chỉnh sửa cho Post.
 * Truy cập: owner + admin (hidden cho user khác).
 *
 * Hiển thị:
 *  1. Callout "So sánh bản cuối owner vs bản cuối admin" — diff field + content side-by-side
 *  2. Full revision list (chronological desc) — mỗi row: editor + date + reason + changedFields
 */
export default async function PostHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    redirect(`/login?next=/bai-viet/${id}/lich-su`)
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      title: true,
      content: true,
      author: { select: { id: true, name: true } },
    },
  })
  if (!post) notFound()

  const isOwner = post.authorId === session.user.id
  const isAdminViewer = isAdmin(session.user.role)
  if (!isOwner && !isAdminViewer) notFound()

  const revisions = await prisma.postRevision.findMany({
    where: { postId: id },
    orderBy: { version: "desc" },
    include: {
      editor: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
    },
  })

  // Bản cuối của OWNER vs bản cuối của ADMIN — dùng cho callout diff trên top
  const latestOwner = revisions.find((r) => r.editedRole === "OWNER")
  const latestAdmin = revisions.find((r) => r.editedRole === "ADMIN")
  const hasDivergence = !!(latestOwner && latestAdmin)

  return (
    <div className="bg-brand-50/60 min-h-screen">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back link + title */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/bai-viet/${post.id}`}
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800"
          >
            ← Quay lại bài viết
          </Link>
          <span className="text-brand-300">/</span>
          <h1 className="font-bold text-brand-900 text-lg">Lịch sử chỉnh sửa</h1>
          <span className="text-xs text-brand-500">
            ({revisions.length} phiên bản)
          </span>
        </div>

        {/* Bài tham chiếu */}
        <article className="bg-white rounded-xl border border-brand-200 p-5">
          <p className="text-xs uppercase tracking-wide font-semibold text-brand-500 mb-2">
            Bài viết hiện tại (mới nhất)
          </p>
          <h2 className="text-base font-bold text-brand-900 mb-1">
            {post.title || <em className="text-brand-400">(không có tiêu đề)</em>}
          </h2>
          <p className="text-xs text-brand-500">
            Tác giả: {post.author.name}
          </p>
        </article>

        {/* Diff callout: owner vs admin — chỉ hiện khi cả 2 đều có */}
        {hasDivergence && latestOwner && latestAdmin && (
          <section className="bg-amber-50 rounded-xl border border-amber-300 p-5 space-y-4">
            <div>
              <h2 className="font-bold text-amber-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs">
                  ⚖
                </span>
                So sánh bản cuối: Owner ↔ Admin
              </h2>
              <p className="mt-1 text-xs text-amber-800">
                {latestAdmin.editedAt > latestOwner.editedAt
                  ? `Admin đã chỉnh sửa SAU bản cuối của owner (${formatDate(latestAdmin.editedAt)}).`
                  : `Owner đã chỉnh sửa LẠI sau khi admin sửa (${formatDate(latestOwner.editedAt)}).`}
              </p>
            </div>

            <DiffRow
              label="Tiêu đề"
              ownerValue={latestOwner.title || "(trống)"}
              adminValue={latestAdmin.title || "(trống)"}
            />
            <DiffRow
              label="Nội dung"
              ownerValue={latestOwner.content}
              adminValue={latestAdmin.content}
              isHtml
            />
            <DiffImagesRow
              ownerUrls={latestOwner.imageUrls}
              adminUrls={latestAdmin.imageUrls}
            />
          </section>
        )}

        {/* Full revision list */}
        <section className="bg-white rounded-xl border border-brand-200 overflow-hidden">
          <header className="px-5 py-3 border-b border-brand-200 bg-brand-50/40">
            <h2 className="font-semibold text-brand-900 text-sm">
              Toàn bộ lịch sử ({revisions.length})
            </h2>
          </header>
          {revisions.length === 0 ? (
            <p className="px-5 py-8 text-sm text-brand-400 text-center italic">
              Bài viết chưa có lịch sử chỉnh sửa nào.
            </p>
          ) : (
            <ul className="divide-y divide-brand-100">
              {revisions.map((rev) => (
                <RevisionRow key={rev.id} rev={rev} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return ""
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
        ADMIN
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5">
      OWNER
    </span>
  )
}

function RevisionRow({
  rev,
}: {
  rev: {
    id: string
    version: number
    editedAt: Date
    editedRole: string
    reason: string | null
    changedFields: string[]
    title: string | null
    content: string
    imageUrls: string[]
    editor: { id: string; name: string; avatarUrl: string | null; role: string } | null
  }
}) {
  return (
    <li className="px-5 py-4 hover:bg-brand-50/30">
      <div className="flex items-start gap-3">
        <div className="relative w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden">
          {rev.editor?.avatarUrl ? (
            <Image src={rev.editor.avatarUrl} alt="" fill className="object-cover" sizes="36px" />
          ) : (
            <span className="text-xs font-bold text-brand-700">
              {rev.editor?.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-brand-900 text-sm">
              {rev.editor?.name ?? "(đã xoá user)"}
            </span>
            <RoleBadge role={rev.editedRole} />
            <span className="text-[11px] text-brand-400">
              v{rev.version} · {formatDate(rev.editedAt)}
            </span>
          </div>
          {rev.reason && (
            <p className="mt-1 text-xs text-brand-700 italic">
              <span className="text-brand-500 not-italic">Lý do: </span>
              {rev.reason}
            </p>
          )}
          {rev.changedFields.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {rev.changedFields.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 border border-blue-100"
                >
                  {labelForField(f)}
                </span>
              ))}
            </div>
          )}
          {rev.changedFields.length === 0 && rev.version === 0 && (
            <span className="mt-1 inline-block text-[11px] italic text-brand-400">
              Bản gốc — baseline đầu tiên
            </span>
          )}
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] text-brand-500 hover:text-brand-700">
              Xem snapshot phiên bản này
            </summary>
            <div className="mt-2 rounded-md border border-brand-200 bg-white p-3 space-y-2">
              {rev.title && (
                <p className="text-sm font-semibold text-brand-900">{rev.title}</p>
              )}
              <div
                className="prose prose-sm max-w-none text-brand-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rev.content) }}
              />
              {rev.imageUrls.length > 0 && (
                <p className="text-[11px] text-brand-500">
                  {rev.imageUrls.length} ảnh đính kèm.
                </p>
              )}
            </div>
          </details>
        </div>
      </div>
    </li>
  )
}

function labelForField(f: string): string {
  switch (f) {
    case "title": return "Tiêu đề"
    case "content": return "Nội dung"
    case "imageUrls": return "Ảnh đính kèm"
    default: return f
  }
}

/** Side-by-side row cho 1 field — string equality để hide nếu giống nhau. */
function DiffRow({
  label,
  ownerValue,
  adminValue,
  isHtml = false,
}: {
  label: string
  ownerValue: string
  adminValue: string
  isHtml?: boolean
}) {
  const same = ownerValue === adminValue
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-semibold text-amber-900">{label}</span>
        {same ? (
          <span className="text-[10px] uppercase tracking-wide text-emerald-700 font-bold">
            Giống nhau
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-red-700 font-bold">
            Khác biệt
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DiffSide
          title="Bản cuối Owner"
          tone="brand"
          value={ownerValue}
          isHtml={isHtml}
          highlight={!same}
        />
        <DiffSide
          title="Bản cuối Admin"
          tone="amber"
          value={adminValue}
          isHtml={isHtml}
          highlight={!same}
        />
      </div>
    </div>
  )
}

function DiffSide({
  title,
  tone,
  value,
  isHtml,
  highlight,
}: {
  title: string
  tone: "brand" | "amber"
  value: string
  isHtml: boolean
  highlight: boolean
}) {
  const toneCls =
    tone === "brand"
      ? "border-brand-300 bg-brand-50/40"
      : "border-amber-300 bg-white"
  return (
    <div className={`rounded-md border ${toneCls} p-3 ${highlight ? "" : "opacity-70"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${tone === "brand" ? "text-brand-600" : "text-amber-700"}`}>
        {title}
      </p>
      {isHtml ? (
        <div
          className="prose prose-sm max-w-none text-brand-800 max-h-64 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
        />
      ) : (
        <p className="text-sm text-brand-800 wrap-break-word">{value}</p>
      )}
    </div>
  )
}

function DiffImagesRow({
  ownerUrls,
  adminUrls,
}: {
  ownerUrls: string[]
  adminUrls: string[]
}) {
  const same =
    ownerUrls.length === adminUrls.length &&
    ownerUrls.every((u, i) => u === adminUrls[i])
  if (same) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-amber-900">Ảnh đính kèm</span>
          <span className="text-[10px] uppercase tracking-wide text-emerald-700 font-bold">
            Giống nhau ({ownerUrls.length} ảnh)
          </span>
        </div>
      </div>
    )
  }
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-semibold text-amber-900">Ảnh đính kèm</span>
        <span className="text-[10px] uppercase tracking-wide text-red-700 font-bold">
          Khác biệt
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ImageThumbsSide title="Bản cuối Owner" tone="brand" urls={ownerUrls} />
        <ImageThumbsSide title="Bản cuối Admin" tone="amber" urls={adminUrls} />
      </div>
    </div>
  )
}

function ImageThumbsSide({
  title,
  tone,
  urls,
}: {
  title: string
  tone: "brand" | "amber"
  urls: string[]
}) {
  const toneCls =
    tone === "brand"
      ? "border-brand-300 bg-brand-50/40"
      : "border-amber-300 bg-white"
  return (
    <div className={`rounded-md border ${toneCls} p-3`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${tone === "brand" ? "text-brand-600" : "text-amber-700"}`}>
        {title} ({urls.length} ảnh)
      </p>
      {urls.length === 0 ? (
        <p className="text-xs text-brand-400 italic">Không có ảnh</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {urls.slice(0, 6).map((url, i) => (
            <a
              key={`${url}-${i}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden rounded border border-brand-200 bg-brand-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
