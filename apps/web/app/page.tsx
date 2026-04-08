"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { useSearchParams } from "next/navigation"
import { ethers } from "ethers"
import { ClobClient, OrderType, Side } from "@polymarket/clob-client"
import { Navbar } from "@/components/navbar"
import { TrendingHeader } from "@/components/trending-header"
import { CategoriesBar } from "@/components/categories-bar"
import { MarketsGrid } from "@/components/markets-grid"
import { Footer } from "@/components/footer"
import { X, Wallet, Info } from "lucide-react"
import type { PolymarketMarket } from "@/lib/polymarket"
import { cn } from "@/lib/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
const CLOB_HOST = "https://clob.polymarket.com"
const POLYGON_CHAIN_ID = 137

type QuickSide = "yes" | "no"

export default function Home() {
  const searchParams = useSearchParams()
  const searchQuery = useMemo(() => searchParams.get("q") ?? "", [searchParams])

  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("trending")

  const { authenticated } = usePrivy()
  const { wallets } = useWallets()

  const [quickOpen, setQuickOpen] = useState(false)
  const [quickSide, setQuickSide] = useState<QuickSide>("yes")
  const [quickMarket, setQuickMarket] = useState<PolymarketMarket | null>(null)
  const [quickAmount, setQuickAmount] = useState("10")
  const [quickStatus, setQuickStatus] = useState<string | null>(null)
  const [quickDetail, setQuickDetail] = useState<{ tokenIds: string[]; outcomePrices: number[] } | null>(null)

  useEffect(() => {
    if (searchQuery) setCategory("all")
  }, [searchQuery])

  const openQuickTrade = useCallback((market: PolymarketMarket, side: QuickSide) => {
    setQuickMarket(market)
    setQuickSide(side)
    setQuickAmount("10")
    setQuickStatus(null)
    setQuickDetail(null)
    setQuickOpen(true)
  }, [])

  useEffect(() => {
    const loadDetail = async () => {
      if (!quickOpen || !quickMarket) return
      try {
        const res = await fetch(`${API_BASE}/gamma/markets?id=${quickMarket.id}`)
        const data = await res.json()
        const m = Array.isArray(data) ? data[0] : data
        const tokenIds = m?.clobTokenIds ?? m?.clob_token_ids ?? []
        const outcomePrices = Array.isArray(m?.outcomePrices)
          ? m.outcomePrices.map(Number)
          : Array.isArray(m?.tokens)
          ? m.tokens.map((t: any) => Number(t.price))
          : []
        setQuickDetail({ tokenIds, outcomePrices })
      } catch (err) {
        console.error("Failed to load quick trade detail", err)
      }
    }
    loadDetail()
  }, [quickOpen, quickMarket])

  const normalizedPrice = useMemo(() => {
    if (!quickMarket) return 0.5
    const index = quickSide === "yes" ? 0 : 1
    const raw = quickDetail?.outcomePrices?.[index]
    if (typeof raw === "number") return raw > 1 ? raw / 100 : raw
    const fallback = quickMarket.outcomes?.[index]?.price
    if (typeof fallback === "number") return fallback / 100
    return 0.5
  }, [quickMarket, quickSide, quickDetail])

  const confirmQuickTrade = async () => {
    if (!quickMarket) return
    if (!authenticated || !wallets[0]) {
      setQuickStatus("Connect wallet to trade")
      return
    }
    try {
      setQuickStatus("Initializing...")
      const provider = await wallets[0].getEthereumProvider()
      const web3Provider = new ethers.BrowserProvider(provider)
      const signer = await web3Provider.getSigner()

      const idx = quickSide === "yes" ? 0 : 1
      const tokenId = quickDetail?.tokenIds?.[idx]
      if (!tokenId) throw new Error("Token ID unavailable")

      const client = new ClobClient(CLOB_HOST, POLYGON_CHAIN_ID, signer as any)
      const creds = await client.createOrDeriveApiKey()
      const authed = new ClobClient(CLOB_HOST, POLYGON_CHAIN_ID, signer as any, creds)

      await authed.createAndPostOrder(
        {
          tokenID: tokenId,
          price: normalizedPrice,
          side: Side.BUY,
          size: Number(quickAmount),
        },
        {},
        OrderType.GTC
      )

      setQuickStatus("Trade submitted")
    } catch (err: any) {
      setQuickStatus(`Error: ${err.message ?? "Trade failed"}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TrendingHeader />

      <main id="markets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-10 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Live Markets
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time prediction markets with deep liquidity and instant settlement.
            </p>
          </div>
        </div>

        <CategoriesBar
          selected={category}
          onSelect={setCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="pt-6">
          <MarketsGrid
            category={category}
            sortBy={sortBy}
            search={searchQuery}
            onQuickTrade={openQuickTrade}
          />
        </div>
      </main>

      <Footer />

      {quickOpen && quickMarket && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-[oklch(0.08_0.01_260/0.8)] backdrop-blur-sm" onClick={() => setQuickOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[oklch(0.11_0.012_260)] border-l border-[oklch(0.22_0.015_255)] shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[oklch(0.22_0.015_255)]">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Quick Trade</div>
                <div className="text-lg font-bold text-foreground">{quickMarket.question}</div>
              </div>
              <button
                onClick={() => setQuickOpen(false)}
                className="w-9 h-9 rounded-lg bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQuickSide("yes")}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    quickSide === "yes"
                      ? "bg-[oklch(0.68_0.18_155/0.12)] border-[oklch(0.68_0.18_155/0.5)] text-[oklch(0.68_0.18_155)]"
                      : "bg-[oklch(0.16_0.014_255)] border-[oklch(0.22_0.015_255)] text-muted-foreground"
                  )}
                >
                  <span className="text-[10px] font-bold block mb-1">YES</span>
                  <span className="text-xl font-bold">{quickMarket.outcomes?.[0]?.price ?? 50}%</span>
                </button>
                <button
                  onClick={() => setQuickSide("no")}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    quickSide === "no"
                      ? "bg-[oklch(0.58_0.2_25/0.12)] border-[oklch(0.58_0.2_25/0.5)] text-[oklch(0.58_0.2_25)]"
                      : "bg-[oklch(0.16_0.014_255)] border-[oklch(0.22_0.015_255)] text-muted-foreground"
                  )}
                >
                  <span className="text-[10px] font-bold block mb-1">NO</span>
                  <span className="text-xl font-bold">{quickMarket.outcomes?.[1]?.price ?? 50}%</span>
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-mono bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] text-foreground outline-none focus:border-[oklch(0.78_0.16_82/0.5)]"
                />
              </div>

              <div className="space-y-2">
                <Button className="w-full h-11" onClick={confirmQuickTrade}>
                  Confirm Buy
                </Button>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Wallet className="w-3 h-3" />
                  Trades execute on Polygon via Polymarket liquidity
                </div>
              </div>

              {quickStatus && (
                <div className="p-3 rounded-lg bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[oklch(0.78_0.16_82)]" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    {quickStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
