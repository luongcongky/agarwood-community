"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { PendingCountsResponse } from "@/app/api/admin/pending-counts/route"

// Shared polling context so sidebar badges and the notification bell
// consume a single fetch on a 30s cadence — avoids N duplicate queries
// when multiple components care about the pending queue.

const POLL_INTERVAL_MS = 30_000

type Ctx = {
  data: PendingCountsResponse | null
  loading: boolean
  refresh: () => void
}

const PendingCountsCtx = createContext<Ctx>({
  data: null,
  loading: false,
  refresh: () => {},
})

export function PendingCountsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PendingCountsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)

  async function fetchCounts() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/pending-counts", { cache: "no-store" })
      if (!res.ok) return
      const json = (await res.json()) as PendingCountsResponse
      if (mountedRef.current) setData(json)
    } catch {
      // silent — badge just won't update this tick
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    fetchCounts()
    const id = setInterval(fetchCounts, POLL_INTERVAL_MS)
    // Re-fetch when tab regains focus — covers the case where admin left
    // the tab open for a while and comes back wanting fresh numbers.
    const onFocus = () => fetchCounts()
    window.addEventListener("focus", onFocus)
    return () => {
      mountedRef.current = false
      clearInterval(id)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  return (
    <PendingCountsCtx.Provider value={{ data, loading, refresh: fetchCounts }}>
      {children}
    </PendingCountsCtx.Provider>
  )
}

export function usePendingCounts() {
  return useContext(PendingCountsCtx)
}
