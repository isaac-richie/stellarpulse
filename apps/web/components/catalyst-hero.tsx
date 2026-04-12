"use client"

import { useState } from "react"
import { Search, Sparkles, Zap, ArrowRight, Loader2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PolymarketMarket } from "@/lib/polymarket"

interface CatalystMarket {
  id: string;
  question: string;
  category: string;
  image?: string;
  probability?: number;
  volume?: string;
  reasoning: string;
}

interface CatalystHeroProps {
  onUnlockAnalysis: (market: PolymarketMarket) => void
}

export function CatalystHero({ onUnlockAnalysis }: CatalystHeroProps) {
  const [news, setNews] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CatalystMarket[]>([])
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!news.trim() || loading) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const res = await fetch(`${API_BASE}/analysis/catalyst`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news })
      })

      if (!res.ok) throw new Error("Alpha extraction service unavailable")
      const data = await res.json()
      setResults(data.catalysts || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMarketClick = (c: CatalystMarket) => {
    // Convert CatalystMarket to PolymarketMarket for the modal
    const market: PolymarketMarket = {
      id: c.id,
      question: c.question,
      description: c.reasoning,
      category: c.category,
      image: c.image,
      volume: c.volume || "0",
      liquidity: "N/A",
      endDate: "",
      source: "polymarket",
      active: true,
      new: false,
      featured: false,
      slug: c.id,
      outcomes: [
        { name: "Yes", price: c.probability || 50 },
        { name: "No", price: 100 - (c.probability || 50) }
      ]
    }
    onUnlockAnalysis(market)
  }

  return (
    <section className="relative pt-12 pb-16 overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-[oklch(0.78_0.16_82/0.05)] to-transparent rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[oklch(0.78_0.16_82/0.1)] border border-[oklch(0.78_0.16_82/0.2)] text-[10px] font-bold uppercase tracking-[0.2em] text-[oklch(0.78_0.16_82)] mb-6 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3 h-3" />
          Neural Catalyst Engine v1.0
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
          Turn Global News into <span className="text-[oklch(0.78_0.16_82)] italic">Actionable Alpha</span>
        </h2>
        
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Input any news headline or global event. Our agent will map the catalyst to live prediction events and extract hidden signals using Stellar x402.
        </p>

        <form onSubmit={handleDiscover} className="relative group">
          <div className={cn(
            "flex items-center gap-3 p-2 pl-5 rounded-2xl bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] transition-all duration-300 shadow-2xl focus-within:border-[oklch(0.78_0.16_82/0.5)] focus-within:ring-4 focus-within:ring-[oklch(0.78_0.16_82/0.1)]",
            loading && "opacity-80"
          )}>
            <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-[oklch(0.78_0.16_82)] transition-colors" />
            <input
              type="text"
              placeholder="Paste breaking news or event description..."
              className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/50 py-3"
              value={news}
              onChange={(e) => setNews(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !news.trim()}
              className="px-6 py-3 rounded-xl bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? "Extracting..." : "Discover Alpha"}
            </button>
          </div>
          
          {error && (
            <div className="absolute top-full left-0 right-0 mt-4 text-xs font-mono text-[oklch(0.58_0.2_25)] flex items-center justify-center gap-2">
              <Info className="w-3 h-3" />
              {error}
            </div>
          )}
        </form>

        {/* Results Stream */}
        {results.length > 0 && (
          <div className="mt-12 space-y-4 text-left animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-[oklch(0.22_0.015_255)]" />
              Intelligence Match Discovered
              <div className="h-px flex-1 bg-[oklch(0.22_0.015_255)]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => handleMarketClick(c)}
                  className="surface-card p-5 rounded-xl border border-[oklch(0.22_0.015_255)] hover:border-[oklch(0.78_0.16_82/0.4)] cursor-pointer transition-all group/card overflow-hidden relative"
                >
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h4 className="text-sm font-bold text-foreground leading-tight group-hover/card:text-[oklch(0.78_0.16_82)] transition-colors">
                      {c.question}
                    </h4>
                    <span className="text-[10px] font-mono text-[oklch(0.68_0.18_155)] font-bold whitespace-nowrap">
                      {c.probability?.toFixed(1)}% Consensus
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-4 line-clamp-2 leading-relaxed italic">
                    {c.reasoning}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#888]">
                      Asset ID: {c.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-1 text-[oklch(0.78_0.16_82)] text-[10px] font-bold uppercase tracking-widest">
                      Run x402 Model <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
