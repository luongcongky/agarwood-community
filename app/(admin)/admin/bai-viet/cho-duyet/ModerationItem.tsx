"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cloudinaryResize } from "@/lib/cloudinary"

type ModerationItemProps = {
  post: {
    id: string
    title: string | null
    content: string // HTML sanitized
    imageUrls: string[]
    createdAt: string
    author: {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }
  }
}

export function ModerationItem({ post }: ModerationItemProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState<"approve" | "reject" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function approve() {
    if (!confirm("Duyệt bài này? Bài sẽ công khai với mọi người.")) return
    setProcessing("approve")
    setError(null)
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
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
      "Nhập lý do từ chối (sẽ hiện cho tác giả để họ biết cách sửa):",
    )
    if (!note) return
    if (note.trim().length === 0) {
      alert("Lý do không được để trống")
      return
    }
    setProcessing("reject")
    setError(null)
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reject", note }),
      })
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

  const plainText = post.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  const displayImages = post.imageUrls.slice(0, 4)

  return (
    <article className="rounded-xl border border-brand-200 bg-white p-5 shadow-sm">
      {/* Author */}
      <header className="mb-3 flex items-center gap-3">
        {post.author.avatarUrl ? (
          <Image
            src={post.author.avatarUrl}
            alt={post.author.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-200 text-sm font-bold text-brand-800">
            {post.author.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-brand-900">{post.author.name}</p>
          <p className="text-xs text-brand-500">
            {post.author.email} ·{" "}
            {new Date(post.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>
      </header>

      {/* Title + content preview */}
      {post.title && (
        <h3 className="mb-2 text-lg font-bold text-brand-900">{post.title}</h3>
      )}
      <p className="mb-3 text-sm leading-relaxed text-brand-800 whitespace-pre-wrap">
        {plainText}
      </p>

      {/* Images */}
      {displayImages.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {displayImages.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden rounded border border-brand-200 bg-brand-100"
            >
              <Image
                src={cloudinaryResize(url, 400)}
                alt=""
                fill
                className="object-cover"
                sizes="200px"
              />
            </a>
          ))}
          {post.imageUrls.length > 4 && (
            <span className="col-span-full text-xs text-brand-500">
              Còn {post.imageUrls.length - 4} ảnh khác — xem chi tiết.
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-brand-100 pt-3">
        <a
          href={`/bai-viet/${post.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-brand-300 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
        >
          Xem chi tiết ↗
        </a>
        <button
          type="button"
          onClick={reject}
          disabled={processing !== null}
          className="rounded border border-red-300 bg-white px-4 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {processing === "reject" ? "Đang xử lý…" : "Từ chối"}
        </button>
        <button
          type="button"
          onClick={approve}
          disabled={processing !== null}
          className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {processing === "approve" ? "Đang xử lý…" : "Duyệt"}
        </button>
      </div>
    </article>
  )
}
