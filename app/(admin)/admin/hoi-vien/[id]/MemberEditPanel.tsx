"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

/**
 * Phase 3.7 (2026-04): admin chỉnh sửa thông tin hội viên + avatar tại
 * /admin/hoi-vien/[id]. Gọi PATCH /api/admin/users/[id]/profile (server tự
 * gate role admin). Tách thành component riêng để giữ page server-rendered.
 */

type Props = {
  userId: string
  initial: {
    name: string
    phone: string | null
    bio: string | null
    avatarUrl: string | null
  }
}

export function MemberEditPanel({ userId, initial }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initial.name)
  const [phone, setPhone] = useState(initial.phone ?? "")
  const [bio, setBio] = useState(initial.bio ?? "")
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? "")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: "error", text: "Ảnh quá lớn (tối đa 5MB)." })
      return
    }
    setAvatarUploading(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "users")
      const upRes = await fetch("/api/upload", { method: "POST", body: fd })
      if (!upRes.ok) throw new Error("upload-failed")
      const upData = await upRes.json()
      const newUrl = upData.secure_url ?? upData.url
      // Lưu ngay qua admin endpoint (admin có thể update bất kỳ user nào).
      const patchRes = await fetch(`/api/admin/users/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: newUrl }),
      })
      if (!patchRes.ok) throw new Error("patch-failed")
      setAvatarUrl(newUrl)
      setMsg({ type: "success", text: "Đã cập nhật ảnh đại diện." })
      router.refresh()
    } catch {
      setMsg({ type: "error", text: "Tải ảnh thất bại. Vui lòng thử lại." })
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ""
    }
  }

  async function handleAvatarRemove() {
    if (!confirm("Xoá ảnh đại diện của hội viên này?")) return
    setAvatarUploading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      })
      if (!res.ok) throw new Error("delete-failed")
      setAvatarUrl("")
      setMsg({ type: "success", text: "Đã xoá ảnh đại diện." })
      router.refresh()
    } catch {
      setMsg({ type: "error", text: "Không xoá được ảnh." })
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      setMsg({ type: "error", text: "Tên tối thiểu 2 ký tự." })
      return
    }
    setSubmitting(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          bio: bio.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "error", text: data.error ?? "Cập nhật thất bại." })
      } else {
        setMsg({ type: "success", text: "Đã cập nhật thông tin hội viên." })
        router.refresh()
      }
    } catch {
      setMsg({ type: "error", text: "Không thể kết nối máy chủ." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-brand-200 p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-brand-900">Chỉnh sửa thông tin</h2>
        <p className="mt-0.5 text-xs text-brand-500">
          Admin có thể đổi tên, số điện thoại, tiểu sử và ảnh đại diện. Bank info
          + password thuộc privacy — admin không động vào (đổi password qua nút
          riêng nếu cần).
        </p>
      </div>

      {/* Avatar block — upload tách khỏi submit chính */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-brand-800">Ảnh đại diện</label>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full bg-brand-100 border border-brand-200 overflow-hidden shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" sizes="80px" />
            ) : (
              <span className="text-2xl font-bold text-brand-700">
                {name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
              className="text-xs text-brand-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-800 hover:file:bg-brand-200 disabled:opacity-50"
            />
            <div className="flex items-center gap-3 text-[11px]">
              {avatarUploading && <span className="text-brand-500 italic">Đang tải lên...</span>}
              {avatarUrl && !avatarUploading && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  className="text-red-600 hover:text-red-800 underline"
                >
                  Xoá ảnh
                </button>
              )}
              <span className="text-brand-400">Tối đa 5MB. JPG/PNG/WebP.</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-800">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-800">Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-800">Tiểu sử</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Giới thiệu ngắn về hội viên..."
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-y"
          />
          <p className="text-[11px] text-brand-400">{bio.length}/2000 ký tự</p>
        </div>

        {msg && (
          <div
            className={cn(
              "rounded-lg border px-4 py-2.5 text-sm",
              msg.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-700",
            )}
          >
            {msg.type === "success" ? "✓ " : ""}
            {msg.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors",
              submitting ? "opacity-60 cursor-not-allowed" : "hover:bg-brand-800",
            )}
          >
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  )
}
