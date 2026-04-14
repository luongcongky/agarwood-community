"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

/**
 * Floating nút "Về đầu trang" — hiện sau khi cuộn xuống > 400px.
 * Vị trí: bottom-right, dễ thấy nhưng không đè nội dung chính.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Về đầu trang"
      title="Về đầu trang"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-brand-700 text-white shadow-lg hover:bg-brand-800 active:scale-95 transition-all"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
