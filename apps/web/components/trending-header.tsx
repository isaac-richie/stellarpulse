"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, TrendingUp, TrendingDown, Flame } from "lucide-react"
import { fetchPolymarketMarkets, type PolymarketMarket } from "@/lib/polymarket"
import { cn } from "@/lib/utils"

function getYesPrice(market: PolymarketMarket): number {
  const yes = market.outcomes?.find((o) => o.name.toLowerCase().includes("yes"))?.price
  const fallback = market.outcomes?.[0]?.price
  const price = typeof yes === "number" ? yes : typeof fallback === "number" ? fallback : 50
  return price
}

function formatEndDate(dateStr?: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function TrendingHeader() {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [indexPrices, setIndexPrices] = useState<Record<string, number>>({})

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchPolymarketMarkets("all", 11, "trending", 0)
        setMarkets(data.slice(0, 11))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadPrices = async () => {
      const tokenIds = markets
        .map((m) => m.tokenIds?.[0])
        .filter((id): id is string => Boolean(id))
      if (!tokenIds.length) return
      try {
        const res = await fetch(`${API_BASE}/clob/last-trades-prices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token_ids: tokenIds }),
        })
        if (!res.ok) return
        const data = await res.json()
        const map: Record<string, number> = {}
        if (Array.isArray(data)) {
          for (const item of data) {
            const id = item.token_id ?? item.tokenId ?? item.id
            const price = item.price ?? item.last_trade_price ?? item.lastTradePrice
            if (id && price !== undefined) map[id] = Number(price)
          }
        } else if (data?.prices && typeof data.prices === "object") {
          for (const [id, price] of Object.entries(data.prices)) {
            map[id] = Number(price)
          }
        } else if (data && typeof data === "object") {
          for (const [id, price] of Object.entries(data)) {
            map[id] = Number(price)
          }
        }
        setIndexPrices(map)
      } catch (err) {
        console.error(err)
      }
    }
    loadPrices()
  }, [markets, API_BASE])

  const getIndexPrice = (market: PolymarketMarket) => {
    const tokenId = market.tokenIds?.[0]
    if (tokenId && indexPrices[tokenId] !== undefined) {
      const p = indexPrices[tokenId]
      return p <= 1 ? p * 100 : p
    }
    return getYesPrice(market)
  }

  return (
    <section className="relative pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <Flame className="w-3.5 h-3.5 text-[oklch(0.78_0.16_82)]" /> Trending Markets
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">
              Top activity today
            </h1>
          </div>
          <button className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-[oklch(0.78_0.16_82/0.4)] transition-all">
            View all markets
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="surface-card rounded-2xl overflow-hidden border border-[oklch(0.22_0.015_255)]">
          <div className="h-px gold-line" />
          <div className="hidden lg:grid grid-cols-[1.2fr_0.3fr_0.35fr_0.35fr_0.35fr_0.35fr] gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-[oklch(0.16_0.014_255)]">
            <span>Market</span>
            <span>Index</span>
            <span>Volume</span>
            <span>Liquidity</span>
            <span>Auto Close</span>
            <span className="text-right">Trade</span>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading trending markets…</div>
          ) : (
            <div className="divide-y divide-[oklch(0.22_0.015_255)]">
              {markets.map((market) => {
                const index = getIndexPrice(market)
                const isUp = index >= 50
                return (
                  <div
                    key={market.id}
                    className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.3fr_0.35fr_0.35fr_0.35fr_0.35fr] gap-4 px-5 py-4 items-center hover:bg-[oklch(0.16_0.014_255)] transition-colors row-hover-accent"
                  >
                    <div className="flex items-center gap-3">
                      {market.image ? (
                        <img src={market.image} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[oklch(0.18_0.014_255)]" />
                      )}
                      <div>
                        <div className="text-sm font-semibold text-foreground line-clamp-1">
                          {market.question}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                          {market.category}
                        </div>
                      </div>
                    </div>

                    <div className={cn("text-sm font-semibold", isUp ? "text-[oklch(0.68_0.18_155)]" : "text-[oklch(0.58_0.2_25)]")}>
                      {index.toFixed(1)}¢
                    </div>

                    <div className="text-sm font-mono text-muted-foreground">{market.volume}</div>
                    <div className="text-sm font-mono text-muted-foreground">{market.liquidity}</div>
                    <div className="text-xs text-muted-foreground">{formatEndDate(market.endDate)}</div>

                    <div className="flex items-center gap-2 justify-end">
                      <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[oklch(0.68_0.18_155/0.15)] text-[oklch(0.68_0.18_155)] border border-[oklch(0.68_0.18_155/0.3)] hover:bg-[oklch(0.68_0.18_155/0.25)] btn-press">
                        Buy
                      </button>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[oklch(0.58_0.2_25/0.15)] text-[oklch(0.58_0.2_25)] border border-[oklch(0.58_0.2_25/0.3)] hover:bg-[oklch(0.58_0.2_25/0.25)] btn-press">
                        Sell
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
