"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cloudinaryResize } from "@/lib/cloudinary"

type PromotionRequestItemProps = {
  request: {
    id: string
    reason: string | null
    createdAt: string
    requester: {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }
    post: {
      id: string
      title: string | null
      content: string
      imageUrls: string[]
      category: string
      isPromoted: boolean
      createdAt: string
      author: {
        id: string
        name: string
        email: string
        avatarUrl: string | null
        role: string
        company: { name: string } | null
      }
    }
  }
}

/**
 * 1 row inbox. Admin xem preview bài + lý do → Duyệt (isPromoted=true) hoặc
 * Từ chối (kèm lý do hiện cho owner).
 *
 * Preview content cắt ngắn 300 ký tự text để inbox không quá dài. Nếu admin
 * cần xem full, click vào tiêu đề → mở trang chi tiết bài.
 */
export function PromotionRequestItem({ request }: PromotionRequestItemProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState<"approve" | "reject" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const plainPreview = request.post.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300)

  const firstImage = request.post.imageUrls[0]

  async function approve() {
    if (!confirm("Duyệt yêu cầu này? Bài sẽ được đẩy lên trang chủ.")) return
    setProcessing("approve")
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/posts/promotion-requests/${request.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        },
      )
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Duyệt thất bại")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi")
    } finally {
      setProcessing(null)
    }
  }

  async function reject() {
    const note = window.prompt(
      "Nhập lý do từ chối (sẽ hiện cho tác giả):",
    )
    if (!note) return
    if (note.trim().length === 0) {
      alert("Lý do không được để trống")
      return
    }
    setProcessing("reject")
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/posts/promotion-requests/${request.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "reject", note }),
        },
      )
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Từ chối thất bại")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi")
    } finally {
      setProcessing(null)
    }
  }

  const requestedAt = new Date(request.createdAt).toLocaleString("vi-VN")
  const categoryLabel =
    request.post.category === "NEWS"
      ? "Tin doanh nghiệp"
      : request.post.category === "PRODUCT"
      ? "Tin sản phẩm"
      : "Bài chung"

  return (
    <article className="rounded-lg border border-brand-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header: tác giả + thời gian xin */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-100">
            {request.post.author.avatarUrl ? (
              <Image
                src={request.post.author.avatarUrl}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-brand-900">
              {request.post.author.name}
            </p>
            <p className="truncate text-xs text-brand-500">
              {request.post.author.company?.name ?? request.post.author.email} ·{" "}
              <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                {request.post.author.role}
              </span>
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-brand-400">
          <p>Xin lúc: {requestedAt}</p>
          <p className="mt-0.5">
            Section:{" "}
            <span className="font-semibold text-brand-600">
              {categoryLabel}
            </span>
          </p>
        </div>
      </div>

      {/* Nội dung bài */}
      <div className="space-y-2 rounded-md bg-brand-50/40 p-3">
        {request.post.title && (
          <h3 className="font-bold text-brand-900">{request.post.title}</h3>
        )}
        <p className="text-sm text-brand-800 leading-relaxed">
          {plainPreview}
          {plainPreview.length >= 300 && "…"}
        </p>
        {firstImage && (
          <div className="relative mt-2 h-40 w-full overflow-hidden rounded-md bg-brand-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryResize(firstImage, 800)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Lý do xin */}
      {request.reason && (
        <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Lý do xin đẩy lên:
          </p>
          <p className="mt-1 leading-relaxed">{request.reason}</p>
        </div>
      )}

      {/* Warning nếu bài đã đang isPromoted */}
      {request.post.isPromoted && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 border border-emerald-200">
          Bài này đã đang ở trạng thái <strong>Promoted</strong> (admin đẩy
          trực tiếp trước đó). Duyệt vẫn OK để mark yêu cầu là APPROVED.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-100">
        <button
          type="button"
          onClick={reject}
          disabled={processing !== null}
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {processing === "reject" ? "Đang xử lý…" : "Từ chối"}
        </button>
        <button
          type="button"
          onClick={approve}
          disabled={processing !== null}
          className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {processing === "approve" ? "Đang xử lý…" : "Duyệt + đẩy lên"}
        </button>
      </div>
    </article>
  )
}
