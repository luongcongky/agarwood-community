"use client"

import { useState } from "react"

/**
 * Small icon button that copies a Drive view URL to the clipboard. Used on the
 * tài liệu list so an admin can grab a link and paste it into places that
 * accept an existing Drive URL (e.g. the Điều lệ "Dán URL Drive có sẵn" tab).
 */
export function CopyDriveUrlButton({ driveFileId }: { driveFileId: string }) {
  const [copied, setCopied] = useState(false)
  const url = `https://drive.google.com/file/d/${driveFileId}/view`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API blocked (insecure origin, etc.) — fall back to prompt
      window.prompt("Copy URL:", url)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Đã copy!" : "Copy URL Drive để paste vào nơi khác"}
      className={`rounded-lg border bg-white px-2 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
        copied
          ? "border-emerald-300 text-emerald-700 bg-emerald-50"
          : "border-brand-200 text-brand-700 hover:bg-brand-50"
      }`}
    >
      {copied ? "✓ Đã copy" : "🔗 Copy link"}
    </button>
  )
}
