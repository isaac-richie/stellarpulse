"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { HeroHeader } from "@/components/hero-header"
import { CategoriesBar } from "@/components/categories-bar"
import { MarketsGrid } from "@/components/markets-grid"
import { Footer } from "@/components/footer"
import { TrendingUp, Flame, Sparkles } from "lucide-react"

const featuredTabs = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "hot", label: "Hot", icon: Flame },
  { id: "new", label: "New Listings", icon: Sparkles },
]

export default function Home() {
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("volume")
  const [featuredTab, setFeaturedTab] = useState("trending")

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroHeader />

      <main id="markets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-10 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Live Markets
              <span className="ml-3 text-xs font-mono font-normal text-muted-foreground align-middle">
                Powered by Polymarket
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time prediction markets with deep liquidity and instant settlement.
            </p>
          </div>

          {/* Featured tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)]">
            {featuredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFeaturedTab(tab.id)
                  setSortBy(tab.id === "trending" ? "volume" : tab.id === "new" ? "newest" : "liquidity")
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  featuredTab === tab.id
                    ? "bg-[oklch(0.22_0.04_82)] text-[oklch(0.78_0.16_82)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CategoriesBar
          selected={category}
          onSelect={setCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="pt-6">
          <MarketsGrid category={category} sortBy={sortBy} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
