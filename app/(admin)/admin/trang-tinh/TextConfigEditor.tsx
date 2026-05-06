"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import type { StaticTextMeta } from "@/lib/static-page-meta"
import { saveStaticText } from "./actions"
import { ImagePlus, Loader2, Save, Sparkles, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StaticPageConfig } from "@prisma/client"

interface Props {
  pageKey: string
  itemMeta: StaticTextMeta
  initialData?: StaticPageConfig
  defaultTranslations?: { vi: string, en: string, zh: string, ar: string }
  onSuccess?: () => void
}

export function TextConfigEditor({ pageKey, itemMeta, initialData, defaultTranslations, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isTranslating, setIsTranslating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isImage = itemMeta.type === "image"

  const [formData, setFormData] = useState({
    value: initialData?.value || defaultTranslations?.vi || "",
    value_en: initialData?.value_en || defaultTranslations?.en || "",
    value_zh: initialData?.value_zh || defaultTranslations?.zh || "",
    value_ar: initialData?.value_ar || defaultTranslations?.ar || "",
  })

  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setMsg({ type: "error", text: "Chỉ chấp nhận file ảnh" })
      return
    }
    setMsg(null)
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      // Lưu vào folder "trang-tinh" để tách khỏi ảnh CMS khác.
      fd.append("folder", "trang-tinh")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload thất bại")
      setFormData((prev) => ({ ...prev, value: data.secure_url ?? data.url }))
      setMsg({ type: "success", text: "Đã tải ảnh lên. Nhớ bấm Lưu cấu hình!" })
    } catch (err) {
      setMsg({ type: "error", text: "Lỗi tải ảnh: " + (err as Error).message })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleAiTranslate() {
    if (!formData.value) {
      setMsg({ type: "error", text: "Vui lòng nhập nội dung gốc (Tiếng Việt) trước" })
      return
    }

    setMsg(null)
    setIsTranslating(true)
    
    try {
      const promises = []
      const translateTo = async (locale: string) => {
        const res = await fetch("/api/admin/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetLocale: locale,
            fields: { value: formData.value }
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to translate")
        return { locale, text: data.fields?.value || "" }
      }

      if (!formData.value_en) promises.push(translateTo("en"))
      if (!formData.value_zh) promises.push(translateTo("zh"))
      if (!formData.value_ar) promises.push(translateTo("ar"))

      if (promises.length === 0) {
        setMsg({ type: "success", text: "Tất cả ngôn ngữ đã có nội dung." })
        setIsTranslating(false)
        return
      }

      const results = await Promise.all(promises)
      
      const newFormData = { ...formData }
      results.forEach(res => {
        if (res.locale === "en" && res.text) newFormData.value_en = res.text
        if (res.locale === "zh" && res.text) newFormData.value_zh = res.text
        if (res.locale === "ar" && res.text) newFormData.value_ar = res.text
      })
      setFormData(newFormData)
      setMsg({ type: "success", text: "Đã dịch tự động xong. Nhớ bấm Lưu cấu hình!" })
    } catch (err) {
      setMsg({ type: "error", text: "Lỗi AI dịch: " + (err as Error).message })
    } finally {
      setIsTranslating(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const result = await saveStaticText(pageKey, itemMeta.key, formData)
      if (result.success) {
        setMsg({ type: "success", text: "Đã lưu thay đổi" })
        onSuccess?.()
      } else {
        setMsg({ type: "error", text: result.error || "Có lỗi xảy ra khi lưu" })
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-brand-200 shadow-sm overflow-hidden flex flex-col h-full">
      <header className="px-6 py-4 bg-brand-50/50 border-b border-brand-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-brand-900">{itemMeta.label}</h3>
          <p className="text-xs text-brand-500 font-mono">{itemMeta.key}</p>
        </div>
        <div className="flex items-center gap-2">
          {itemMeta.type === "richtext" && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">RichText</span>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
        {/* Action bar — sticky để luôn nhìn thấy nút Lưu khi cuộn dài */}
        <div className="sticky top-0 z-10 -mx-6 -mt-6 px-6 py-3 bg-white/95 backdrop-blur border-b border-brand-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setFormData({
              value: initialData?.value || defaultTranslations?.vi || "",
              value_en: initialData?.value_en || defaultTranslations?.en || "",
              value_zh: initialData?.value_zh || defaultTranslations?.zh || "",
              value_ar: initialData?.value_ar || defaultTranslations?.ar || "",
            })}
            className="text-sm font-medium text-brand-500 hover:text-brand-700 transition-colors"
          >
            Hủy thay đổi
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu cấu hình
              </>
            )}
          </button>
        </div>

        {msg && (
          <div className={cn(
            "rounded-lg border px-4 py-2.5 text-sm animate-in fade-in slide-in-from-top-1",
            msg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700",
          )}>
            {msg.text}
          </div>
        )}

        {isImage ? (
          /* Image picker — chỉ lưu URL vào field `value`, không multilang */
          <div className="space-y-3">
            <label className="text-xs font-bold text-brand-700 flex items-center gap-2">
              Ảnh
              <span className="text-[10px] font-normal text-brand-400 italic">JPG/PNG/WebP, tối đa 5MB</span>
            </label>

            {formData.value ? (
              <div className="relative rounded-lg overflow-hidden border border-brand-200 bg-brand-50">
                <Image
                  src={formData.value}
                  alt="Preview"
                  width={800}
                  height={1000}
                  unoptimized
                  className="w-full h-auto max-h-[420px] object-contain bg-white"
                />
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, value: "" }))}
                  className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 backdrop-blur border border-brand-200 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xoá ảnh
                </button>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-brand-200 bg-brand-50/40 p-8 text-center text-sm text-brand-500">
                Chưa có ảnh. Bấm nút bên dưới để tải lên.
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-md text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4" />
                  {formData.value ? "Đổi ảnh khác" : "Tải ảnh lên"}
                </>
              )}
            </button>

            {/* URL field cho phép paste link Cloudinary có sẵn */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
                Hoặc dán URL ảnh
              </label>
              <input
                type="url"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="https://res.cloudinary.com/..."
              />
            </div>
          </div>
        ) : (
        <>
        {/* Tiếng Việt (Gốc) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-brand-700 flex items-center gap-2">
            Tiếng Việt (Gốc)
            <span className="text-[10px] font-normal text-brand-400 italic">* Bắt buộc</span>
          </label>
          <p className="text-[10px] text-brand-500 italic mb-2 leading-relaxed">
            💡 <strong>Mẹo:</strong> Để một cụm từ luôn đi liền nhau (không bị rớt xuống dòng), hãy thay dấu cách bằng <code>&amp;nbsp;</code> (VD: <code>Trầm&amp;nbsp;Hương</code>).
          </p>
          {itemMeta.type === "text" ? (
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Nhập nội dung tiếng Việt..."
              required
            />
          ) : (
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[120px]"
              placeholder="Nhập nội dung tiếng Việt..."
              required
            />
          )}
        </div>

        <div className="h-px bg-brand-100" />

        {/* Các ngôn ngữ khác */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-brand-900 uppercase tracking-wider">
            Các ngôn ngữ khác
          </label>
          <button
            type="button"
            onClick={handleAiTranslate}
            disabled={isTranslating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-md text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Dịch (Ngôn ngữ trống)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Tiếng Anh */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-600">English (Tiếng Anh)</label>
            {itemMeta.type === "text" ? (
              <input
                type="text"
                value={formData.value_en}
                onChange={(e) => setFormData({ ...formData, value_en: e.target.value })}
                className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="English content..."
              />
            ) : (
              <textarea
                value={formData.value_en}
                onChange={(e) => setFormData({ ...formData, value_en: e.target.value })}
                className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[100px]"
                placeholder="English content..."
              />
            )}
          </div>

          {/* Tiếng Trung */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-600">中文 (Tiếng Trung)</label>
            {itemMeta.type === "text" ? (
              <input
                type="text"
                value={formData.value_zh}
                onChange={(e) => setFormData({ ...formData, value_zh: e.target.value })}
                className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="中文內容..."
              />
            ) : (
              <textarea
                value={formData.value_zh}
                onChange={(e) => setFormData({ ...formData, value_zh: e.target.value })}
                className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[100px]"
                placeholder="中文內容..."
              />
            )}
          </div>

          {/* Tiếng Ả Rập */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-600">العربية (Tiếng Ả Rập)</label>
            {itemMeta.type === "text" ? (
              <input
                type="text"
                dir="rtl"
                value={formData.value_ar}
                onChange={(e) => setFormData({ ...formData, value_ar: e.target.value })}
                className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="المحتوى العربي..."
              />
            ) : (
              <textarea
                dir="rtl"
                value={formData.value_ar}
                onChange={(e) => setFormData({ ...formData, value_ar: e.target.value })}
                className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[100px]"
                placeholder="المحتوى العربي..."
              />
            )}
          </div>
        </div>
        </>
        )}

      </form>
    </div>
  )
}
