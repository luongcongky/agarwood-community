"use client"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 transition-colors"
    >
      🖨️ In / Lưu PDF
    </button>
  )
}
