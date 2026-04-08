"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookmarkPlus, Clock, TrendingUp, TrendingDown, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PolymarketMarket } from "@/lib/polymarket"

function formatEndDate(dateStr: string): string {
  if (!dateStr) return "Open-ended"
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return "Resolved"
    if (days === 0) return "Closes today"
    if (days === 1) return "Closes tomorrow"
    if (days <= 7) return `${days}d remaining`
    if (days <= 30) return `${Math.ceil(days / 7)}w remaining`
    const month = d.toLocaleString("en-US", { month: "short" })
    return `${month} ${d.getDate()}, ${d.getFullYear()}`
  } catch {
    return "Open-ended"
  }
}

function ProbabilityBar({ outcomes }: { outcomes: PolymarketMarket["outcomes"] }) {
  if (!outcomes || outcomes.length === 0) return null

  // Binary market
  if (outcomes.length === 2) {
    const yes = outcomes.find((o) => o.name.toLowerCase().includes("yes"))?.price ??
      outcomes[0].price
    const no = 100 - yes
    const isHigh = yes >= 70
    const isLow = yes <= 30

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[oklch(0.68_0.18_155)]">
            YES {yes}%
          </span>
          <span className="text-muted-foreground font-medium">
            NO {no.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-1.5 rounded-full bg-[oklch(0.22_0.015_255)] overflow-hidden">
          <div
            className={cn(
              "absolute left-0 top-0 h-full rounded-full transition-all duration-700",
              isHigh ? "bg-[oklch(0.68_0.18_155)]" : isLow ? "bg-[oklch(0.58_0.2_25)]" : "bg-[oklch(0.78_0.16_82)]"
            )}
            style={{ width: `${yes}%` }}
          />
        </div>
      </div>
    )
  }

  // Multi-outcome
  const maxOutcome = outcomes.reduce((a, b) => (a.price > b.price ? a : b))
  return (
    <div className="space-y-1.5">
      {outcomes.slice(0, 3).map((o, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground w-20 truncate">{o.name}</span>
          <div className="flex-1 h-1.5 rounded-full bg-[oklch(0.22_0.015_255)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                o.name === maxOutcome.name ? "bg-[oklch(0.78_0.16_82)]" : "bg-[oklch(0.35_0.015_255)]"
              )}
              style={{ width: `${o.price}%` }}
            />
          </div>
          <span className={cn("font-mono w-10 text-right", o.name === maxOutcome.name ? "text-[oklch(0.78_0.16_82)] font-bold" : "text-muted-foreground")}>{o.price}%</span>
        </div>
      ))}
      {outcomes.length > 3 && (
        <div className="text-xs text-muted-foreground">+{outcomes.length - 3} more outcomes</div>
      )}
    </div>
  )
}

interface TradingCardProps {
  market: PolymarketMarket
  index: number
  onQuickTrade?: (market: PolymarketMarket, side: "yes" | "no") => void
}

export function TradingCard({ market, index, onQuickTrade }: TradingCardProps) {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(false)

  const yesPrice = market.outcomes.find((o) => o.name.toLowerCase().includes("yes"))?.price ??
    market.outcomes[0]?.price ?? 50
  const noPrice = 100 - yesPrice
  const isHotMarket = parseFloat(market.volume.replace(/[$KMB]/g, "")) > 5

  const animDelay = Math.min(index * 60, 600)

  return (
    <article
      className="card-enter group surface-card surface-card-hover rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-[0_8px_40px_oklch(0.08_0.01_260)] hover:-translate-y-0.5"
      style={{ animationDelay: `${animDelay}ms`, animationFillMode: "both" }}
      onClick={() => router.push(`/markets/${market.id}`)}
    >
      {/* Card top image / gradient banner */}
      <div className="relative h-24 bg-[oklch(0.16_0.014_255)] overflow-hidden flex-shrink-0">
        {market.image ? (
          <img
            src={market.image}
            alt=""
            className="w-full h-full object-cover opacity-60 group-hover:opacity-85 group-hover:brightness-110 group-hover:saturate-110 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, oklch(0.16 0.018 ${index * 37 % 360} / 1) 0%, oklch(0.20 0.022 ${(index * 37 + 60) % 360} / 1) 100%)`,
            }}
          />
        )}
        {/* Top overlay bar */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[oklch(0.145_0.014_255/0.85)]" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {market.featured && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[oklch(0.78_0.16_82/0.9)] text-[oklch(0.12_0.01_255)] text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-2.5 h-2.5" />
              Featured
            </span>
          )}
          {market.new && (
            <span className="px-2 py-0.5 rounded-full bg-[oklch(0.68_0.18_155/0.9)] text-[oklch(0.12_0.01_255)] text-[10px] font-bold uppercase tracking-wider">
              New
            </span>
          )}
        </div>

        {/* Bookmark */}
        <button
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-[oklch(0.12_0.01_255/0.7)] backdrop-blur-sm flex items-center justify-center text-[oklch(0.45_0.01_90)] hover:text-[oklch(0.78_0.16_82)] transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked) }}
        >
          <BookmarkPlus className={cn("w-3.5 h-3.5", bookmarked && "text-[oklch(0.78_0.16_82)] fill-current")} />
        </button>

        {/* Category pill */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-md bg-[oklch(0.12_0.01_255/0.75)] backdrop-blur-sm text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {market.category}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Question */}
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-[oklch(0.88_0.01_90)] transition-colors">
          {market.question}
        </h3>

        {/* Probability bar */}
        <div className="mt-auto">
          <ProbabilityBar outcomes={market.outcomes} />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-[oklch(0.22_0.015_255)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[oklch(0.78_0.16_82)]" />
              <span className="font-mono text-[oklch(0.65_0.01_90)] font-medium">{market.volume}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.68_0.18_155)]" />
              <span className="font-mono text-[oklch(0.55_0.01_90)]">{market.liquidity}</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatEndDate(market.endDate)}
          </span>
        </div>

        {/* Buy buttons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onQuickTrade?.(market, "yes")
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
              "bg-[oklch(0.68_0.18_155/0.1)] border-[oklch(0.68_0.18_155/0.3)] text-[oklch(0.68_0.18_155)] hover:bg-[oklch(0.68_0.18_155/0.2)] hover:border-[oklch(0.68_0.18_155/0.5)]"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Buy YES {yesPrice}¢
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onQuickTrade?.(market, "no")
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
              "bg-[oklch(0.58_0.2_25/0.1)] border-[oklch(0.58_0.2_25/0.3)] text-[oklch(0.58_0.2_25)] hover:bg-[oklch(0.58_0.2_25/0.2)] hover:border-[oklch(0.58_0.2_25/0.5)]"
            )}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Buy NO {noPrice.toFixed(0)}¢
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Instant execution via Polymarket liquidity
        </p>
      </div>
    </article>
  )
}
