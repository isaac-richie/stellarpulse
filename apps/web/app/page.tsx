"use client"

import { useCallback, useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { TrendingHeader } from "@/components/trending-header"
import { CategoriesBar } from "@/components/categories-bar"
import { MarketsGrid } from "@/components/markets-grid"
import { Footer } from "@/components/footer"
import { AnalysisUnlockModal } from "@/components/analysis-unlock-modal"
import { CatalystHero } from "@/components/catalyst-hero"
import { AgentEconomicHud } from "@/components/agent-economic-hud"
import type { PolymarketMarket } from "@/lib/polymarket"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("trending")
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [analysisMarket, setAnalysisMarket] = useState<PolymarketMarket | null>(null)

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("q") ?? ""
    setSearchQuery(query)
  }, [])

  useEffect(() => {
    if (searchQuery) setCategory("all")
  }, [searchQuery])

  const openAnalysis = useCallback((market: PolymarketMarket) => {
    setAnalysisMarket(market)
    setAnalysisOpen(true)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Agent Economic HUD — persistent, collapsible */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(1.75rem+4rem+0.75rem)]">
        <AgentEconomicHud />
      </div>

      <CatalystHero onUnlockAnalysis={openAnalysis} />
      <TrendingHeader onUnlockAnalysis={openAnalysis} />

      <main id="markets" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-10 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Live Events</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Event discovery and paid analysis. Trading is intentionally disabled in this build.
            </p>
          </div>
        </div>

        <CategoriesBar selected={category} onSelect={setCategory} sortBy={sortBy} onSortChange={setSortBy} />

        <div className="pt-6">
          <MarketsGrid category={category} sortBy={sortBy} search={searchQuery} onUnlockAnalysis={openAnalysis} />
        </div>
      </main>

      <Footer />
      <AnalysisUnlockModal open={analysisOpen} market={analysisMarket} onOpenChange={setAnalysisOpen} />
    </div>
  )
}
