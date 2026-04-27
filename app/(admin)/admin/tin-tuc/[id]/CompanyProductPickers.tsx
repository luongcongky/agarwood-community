"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────
export type CompanySummary = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

export type ProductSummary = {
  id: string
  name: string
  slug: string
  imageUrls: string[]
  priceRange: string | null
  certStatus: string
  company: { id: string; name: string } | null
}

// ── Generic search dropdown helper ──────────────────────────────────────────
function useDebouncedSearch<T>(
  endpoint: string,
  query: string,
  extra?: Record<string, string>,
) {
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const run = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      params.set("limit", "10")
      if (extra) for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v)
      const res = await fetch(`${endpoint}?${params.toString()}`)
      if (!res.ok) {
        setResults([])
        return
      }
      const data = (await res.json()) as Record<string, T[]>
      // API trả { companies: [...] } hoặc { products: [...] } → lấy first array
      const arr = Object.values(data).find(Array.isArray) as T[] | undefined
      setResults(arr ?? [])
    } finally {
      setLoading(false)
    }
  }, [endpoint, query, extra])

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => void run(), 300)
    return () => {
      if (debRef.current) clearTimeout(debRef.current)
    }
  }, [run])

  return { results, loading }
}

// ── CompanyPicker ────────────────────────────────────────────────────────────
export function CompanyPicker({
  value,
  onChange,
}: {
  value: CompanySummary | null
  onChange: (c: CompanySummary | null) => void
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { results, loading } = useDebouncedSearch<CompanySummary>(
    "/api/admin/companies/search",
    query,
  )

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2">
        {value.logoUrl ? (
          <Image
            src={value.logoUrl}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded bg-brand-200 text-xs font-bold text-brand-700">
            {value.name.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">{value.name}</p>
          <p className="truncate text-[11px] text-brand-500">{value.slug}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
        >
          Đổi
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Tìm doanh nghiệp theo tên..."
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-brand-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-3 text-sm text-brand-400">Đang tìm…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-brand-400 italic">
              {query ? "Không có doanh nghiệp khớp." : "Gõ để tìm doanh nghiệp."}
            </p>
          ) : (
            <ul>
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c)
                      setQuery("")
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-50"
                  >
                    {c.logoUrl ? (
                      <Image
                        src={c.logoUrl}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-brand-100 text-xs font-bold text-brand-500">
                        {c.name.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-900">
                        {c.name}
                      </p>
                      <p className="truncate text-[11px] text-brand-400">{c.slug}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── ProductPicker ────────────────────────────────────────────────────────────
export function ProductPicker({
  value,
  companyId,
  onChange,
}: {
  value: ProductSummary | null
  /** Khi set, chỉ hiện SP của doanh nghiệp này. */
  companyId: string | null
  onChange: (p: ProductSummary | null) => void
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { results, loading } = useDebouncedSearch<ProductSummary>(
    "/api/admin/products/search",
    query,
    companyId ? { companyId } : undefined,
  )

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  if (value) {
    const cover = value.imageUrls[0]
    return (
      <div className="flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2">
        {cover ? (
          <Image
            src={cover}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded bg-brand-200 text-xs">📦</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">{value.name}</p>
          <p className="truncate text-[11px] text-brand-500">
            {value.company?.name ?? value.slug}
            {value.priceRange && <span className="ml-1">· {value.priceRange}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
        >
          Đổi
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        disabled={!companyId}
        placeholder={
          companyId ? "Tìm sản phẩm của doanh nghiệp..." : "Chọn doanh nghiệp trước"
        }
        className={cn(
          "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
          !companyId && "opacity-50 cursor-not-allowed",
        )}
      />
      {open && companyId && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-brand-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-3 text-sm text-brand-400">Đang tìm…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-brand-400 italic">
              Doanh nghiệp này chưa có sản phẩm khớp.
            </p>
          ) : (
            <ul>
              {results.map((p) => {
                const cover = p.imageUrls[0]
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(p)
                        setQuery("")
                        setOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-50"
                    >
                      {cover ? (
                        <Image
                          src={cover}
                          alt=""
                          width={36}
                          height={36}
                          className="h-9 w-9 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-brand-100 text-xs">📦</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-brand-900">
                          {p.name}
                        </p>
                        <p className="truncate text-[11px] text-brand-400">
                          {p.slug} · {p.certStatus}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
