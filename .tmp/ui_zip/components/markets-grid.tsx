"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { TradingCard } from "./trading-card"
import { fetchPolymarketMarkets } from "@/lib/polymarket"
import type { PolymarketMarket } from "@/lib/polymarket"

interface MarketsGridProps {
  category: string
  sortBy: string
}

export function MarketsGrid({ category, sortBy }: MarketsGridProps) {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const fetchKey = useRef<string>("")

  const load = useCallback(async (reset = false) => {
    const key = `${category}-${sortBy}`
    fetchKey.current = key
    setLoading(true)
    setError(null)

    try {
      const limit = 12
      const offset = reset ? 0 : page * limit
      const data = await fetchPolymarketMarkets(category, limit, sortBy)

      if (fetchKey.current !== key) return // stale

      if (reset) {
        setMarkets(data)
        setPage(1)
      } else {
        setMarkets((prev) => [...prev, ...data])
        setPage((p) => p + 1)
      }
      setHasMore(data.length === limit)
    } catch (err) {
      if (fetchKey.current !== key) return
      setError("Failed to load markets. Please try again.")
    } finally {
      if (fetchKey.current === key) setLoading(false)
    }
  }, [category, sortBy, page])

  // Reset and reload on category/sort change
  useEffect(() => {
    setPage(0)
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sortBy])

  if (loading && markets.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="surface-card rounded-2xl overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-24 shimmer" />
            <div className="p-4 space-y-3">
              <div className="h-4 shimmer rounded-md w-full" />
              <div className="h-4 shimmer rounded-md w-4/5" />
              <div className="h-2 shimmer rounded-full w-full mt-4" />
              <div className="flex gap-2 mt-4">
                <div className="h-8 shimmer rounded-xl flex-1" />
                <div className="h-8 shimmer rounded-xl flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <AlertCircle className="w-8 h-8 text-[oklch(0.58_0.2_25)]" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => load(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] text-sm font-medium hover:border-[oklch(0.78_0.16_82/0.4)] transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {markets.map((market, i) => (
          <TradingCard key={market.id} market={market} index={i} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => load(false)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] text-sm font-medium text-muted-foreground hover:border-[oklch(0.78_0.16_82/0.4)] hover:text-foreground disabled:opacity-50 transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {loading ? "Loading..." : "Load More Markets"}
          </button>
        </div>
      )}
    </div>
  )
}
