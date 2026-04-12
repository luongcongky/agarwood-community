"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type ProductRow = {
  id: string
  name: string
  slug: string
  imageUrls: string[]
  certStatus: string
  isFeatured: boolean
  featuredOrder: number | null
  company: { name: string; slug: string }
}

type CompanyRow = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  isVerified: boolean
  isFeatured: boolean
  featuredOrder: number | null
  owner: { name: string }
}

interface Props {
  initialProducts: ProductRow[]
  initialCompanies: CompanyRow[]
}

type Tab = "products" | "companies"

export function FeaturedManager({ initialProducts, initialCompanies }: Props) {
  const [tab, setTab] = useState<Tab>("products")
  const [products, setProducts] = useState(initialProducts)
  const [companies, setCompanies] = useState(initialCompanies)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function saveProduct(id: string, patch: { isFeatured?: boolean; featuredOrder?: number | null }) {
    setSavingId(id)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/admin/products/${id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error ?? "Lưu thất bại")
        // Revert: refetch from server
        startTransition(() => router.refresh())
        return
      }
      const updated = await res.json()
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, isFeatured: updated.isFeatured, featuredOrder: updated.featuredOrder } : p,
        ),
      )
    } finally {
      setSavingId(null)
    }
  }

  async function saveCompany(id: string, patch: { isFeatured?: boolean; featuredOrder?: number | null }) {
    setSavingId(id)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/admin/companies/${id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error ?? "Lưu thất bại")
        startTransition(() => router.refresh())
        return
      }
      const updated = await res.json()
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, isFeatured: updated.isFeatured, featuredOrder: updated.featuredOrder } : c,
        ),
      )
    } finally {
      setSavingId(null)
    }
  }

  function handleProductToggle(id: string, current: boolean) {
    // Optimistic
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isFeatured: !current } : p)))
    saveProduct(id, { isFeatured: !current })
  }

  function handleProductOrderChange(id: string, value: string) {
    const n = value === "" ? null : Number(value)
    if (n !== null && (Number.isNaN(n) || n < 1)) return
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, featuredOrder: n } : p)))
    saveProduct(id, { featuredOrder: n })
  }

  function handleCompanyToggle(id: string, current: boolean) {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, isFeatured: !current } : c)))
    saveCompany(id, { isFeatured: !current })
  }

  function handleCompanyOrderChange(id: string, value: string) {
    const n = value === "" ? null : Number(value)
    if (n !== null && (Number.isNaN(n) || n < 1)) return
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, featuredOrder: n } : c)))
    saveCompany(id, { featuredOrder: n })
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-brand-200">
        <button
          type="button"
          onClick={() => setTab("products")}
          className={cn(
            "px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors",
            tab === "products"
              ? "border-brand-700 text-brand-900"
              : "border-transparent text-brand-500 hover:text-brand-700",
          )}
        >
          Sản phẩm tiêu biểu
        </button>
        <button
          type="button"
          onClick={() => setTab("companies")}
          className={cn(
            "px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors",
            tab === "companies"
              ? "border-brand-700 text-brand-900"
              : "border-transparent text-brand-500 hover:text-brand-700",
          )}
        >
          Doanh nghiệp tiêu biểu
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <p className="text-xs text-brand-500 italic">
        Tick vào ô để chọn làm tiêu biểu. Số thứ tự nhỏ hơn = ưu tiên cao hơn (1 = đầu danh sách).
        Thay đổi tự động lưu.
      </p>

      {/* Products tab */}
      {tab === "products" && (
        <div className="rounded-xl border border-brand-200 bg-white overflow-hidden">
          {products.length === 0 ? (
            <p className="p-12 text-center text-brand-500 italic">
              Chưa có sản phẩm nào từ doanh nghiệp VIP.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-xs uppercase text-brand-500">
                <tr>
                  <th className="px-4 py-3 text-left w-12">Tiêu biểu</th>
                  <th className="px-4 py-3 text-left w-20">Thứ tự</th>
                  <th className="px-4 py-3 text-left">Sản phẩm</th>
                  <th className="px-4 py-3 text-left">Doanh nghiệp</th>
                  <th className="px-4 py-3 text-left w-28">Chứng nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {products.map((p) => {
                  const cover = p.imageUrls[0] ?? null
                  const isSaving = savingId === p.id
                  return (
                    <tr key={p.id} className={cn(p.isFeatured && "bg-amber-50/40", isSaving && "opacity-60")}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={p.isFeatured}
                          onChange={() => handleProductToggle(p.id, p.isFeatured)}
                          className="w-4 h-4 accent-brand-700 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={p.featuredOrder ?? ""}
                          disabled={!p.isFeatured}
                          onChange={(e) => handleProductOrderChange(p.id, e.target.value)}
                          placeholder="—"
                          className="w-16 rounded-md border border-brand-200 px-2 py-1 text-sm disabled:bg-brand-50 disabled:text-brand-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative w-10 h-10 rounded overflow-hidden bg-brand-100 shrink-0">
                            {cover ? (
                              <Image src={cover} alt="" fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">🌿</div>
                            )}
                          </div>
                          <span className="font-medium text-brand-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-brand-600">{p.company.name}</td>
                      <td className="px-4 py-3">
                        {p.certStatus === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                            ✓ Đã cấp
                          </span>
                        ) : (
                          <span className="text-xs text-brand-400">{p.certStatus}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Companies tab */}
      {tab === "companies" && (
        <div className="rounded-xl border border-brand-200 bg-white overflow-hidden">
          {companies.length === 0 ? (
            <p className="p-12 text-center text-brand-500 italic">
              Chưa có doanh nghiệp VIP nào.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-xs uppercase text-brand-500">
                <tr>
                  <th className="px-4 py-3 text-left w-12">Tiêu biểu</th>
                  <th className="px-4 py-3 text-left w-20">Thứ tự</th>
                  <th className="px-4 py-3 text-left">Doanh nghiệp</th>
                  <th className="px-4 py-3 text-left">Chủ sở hữu</th>
                  <th className="px-4 py-3 text-left w-28">Xác minh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {companies.map((c) => {
                  const isSaving = savingId === c.id
                  return (
                    <tr key={c.id} className={cn(c.isFeatured && "bg-amber-50/40", isSaving && "opacity-60")}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={c.isFeatured}
                          onChange={() => handleCompanyToggle(c.id, c.isFeatured)}
                          className="w-4 h-4 accent-brand-700 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={c.featuredOrder ?? ""}
                          disabled={!c.isFeatured}
                          onChange={(e) => handleCompanyOrderChange(c.id, e.target.value)}
                          placeholder="—"
                          className="w-16 rounded-md border border-brand-200 px-2 py-1 text-sm disabled:bg-brand-50 disabled:text-brand-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-brand-700 shrink-0 flex items-center justify-center">
                            {c.logoUrl ? (
                              <Image src={c.logoUrl} alt="" fill className="object-cover" sizes="40px" />
                            ) : (
                              <span className="text-xs font-bold text-brand-100">{c.name[0]}</span>
                            )}
                          </div>
                          <span className="font-medium text-brand-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-brand-600">{c.owner.name}</td>
                      <td className="px-4 py-3">
                        {c.isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                            ✓ Đã verify
                          </span>
                        ) : (
                          <span className="text-xs text-brand-400">Chưa</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
