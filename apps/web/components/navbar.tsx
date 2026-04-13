"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Activity, ChevronDown, Copy, Menu, Search, Wallet, X } from "lucide-react"
import { fetchMarkets } from "@/lib/markets"
import type { PolymarketMarket } from "@/lib/polymarket"
import { cn } from "@/lib/utils"
import { isConnected, requestAccess, getAddress, setAllowed } from "@stellar/freighter-api"

function getYesPrice(market: PolymarketMarket) {
  const yes = market.outcomes?.find((o) => o.name.toLowerCase().includes("yes"))?.price
  const fallback = market.outcomes?.[0]?.price
  return typeof yes === "number" ? yes : typeof fallback === "number" ? fallback : 50
}

export function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<PolymarketMarket[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    if (!searchValue.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    const handle = setTimeout(async () => {
      const query = searchValue.trim()
      if (!query) return
      setSearchLoading(true)
      setSearchError(null)
      try {
        const data = await fetchMarkets("all", 12, "trending", 0, query)
        setSearchResults(data.filter((m) => m.source !== "kalshi"))
      } catch {
        setSearchError("Search failed. Try again.")
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 280)

    return () => clearTimeout(handle)
  }, [searchValue, searchOpen])

  useEffect(() => {
    if (!walletMenuOpen) return
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest("[data-wallet-menu]")) {
        setWalletMenuOpen(false)
      }
    }
    window.addEventListener("mousedown", onClick)
    return () => window.removeEventListener("mousedown", onClick)
  }, [walletMenuOpen])

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await isConnected()
        if (connected) {
          const res = await getAddress() as any
          const userAddress = typeof res === "string" ? res : res?.address
          if (userAddress) {
            setWalletAddress(userAddress)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    checkConnection()

    // No standard accountsChanged event for Freighter yet, 
    // but checking on load is sufficient for now.
  }, [])

  const clearSearch = () => {
    setSearchValue("")
    setSearchResults([])
    setSearchError(null)
  }

  const connectWallet = async () => {
    try {
      if (await isConnected()) {
        await requestAccess()
        const res = await getAddress() as any
        const userAddress = typeof res === "string" ? res : res?.address
        if (userAddress) {
          setWalletAddress(userAddress)
        }
      } else {
        alert("Please install Freighter wallet extension!")
      }
    } catch {
      // ignore
    }
  }

  const disconnectWallet = () => {
    setWalletAddress(null)
    setWalletMenuOpen(false)
  }

  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] h-7 bg-[oklch(0.13_0.012_255)] border-b border-[oklch(0.20_0.015_255)] flex items-center overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-full bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] text-[10px] font-bold uppercase tracking-widest shrink-0 z-10">
           <Activity className="w-3 h-3" />
           Network Activity
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-12 whitespace-nowrap ticker-scroll hover:pause py-1">
             {[
               { id: "GARY...", amount: "0.05", asset: "USDC", market: "US_ELECTION_24", time: "12s ago" },
               { id: "GBMR...", amount: "0.05", asset: "USDC", market: "FED_RATES_MAY", time: "34s ago" },
               { id: "GCPQ...", amount: "0.05", asset: "USDC", market: "BTC_ETV_FLOW", time: "1m ago" },
               { id: "GDSA...", amount: "0.05", asset: "USDC", market: "AI_REVENUE_Q3", time: "3m ago" },
               { id: "GARY...", amount: "0.05", asset: "USDC", market: "SOL_ETF_APPROVE", time: "5m ago" },
               { id: "GA7X...", amount: "0.05", asset: "USDC", market: "NVIDIA_EPS_BEAT", time: "7m ago" },
             ].map((evt, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[10px] font-mono text-muted-foreground/80">
                   <span className="text-[oklch(0.78_0.16_82)] font-bold">[STLR-M2M]</span>
                   <span className="text-foreground/90">Agent {evt.id}</span>
                   <span>settled</span>
                   <span className="text-foreground font-bold">{evt.amount} {evt.asset}</span>
                   <span>for</span>
                   <span className="text-[oklch(0.68_0.18_155)] uppercase tracking-wider">{evt.market}</span>
                   <span className="text-muted-foreground/40">{evt.time}</span>
                </div>
             ))}
             {/* Duplicate for seamless loop */}
             {[
               { id: "GARY...", amount: "0.05", asset: "USDC", market: "US_ELECTION_24", time: "12s ago" },
               { id: "GBMR...", amount: "0.05", asset: "USDC", market: "FED_RATES_MAY", time: "34s ago" },
               { id: "GCPQ...", amount: "0.05", asset: "USDC", market: "BTC_ETV_FLOW", time: "1m ago" },
             ].map((evt, i) => (
                <div key={`dup-${i}`} className="flex items-center gap-2.5 text-[10px] font-mono text-muted-foreground/80">
                   <span className="text-[oklch(0.78_0.16_82)] font-bold">[STLR-M2M]</span>
                   <span className="text-foreground/90">Agent {evt.id}</span>
                   <span>settled</span>
                   <span className="text-foreground font-bold">{evt.amount} {evt.asset}</span>
                   <span>for</span>
                   <span className="text-[oklch(0.68_0.18_155)] uppercase tracking-wider">{evt.market}</span>
                   <span className="text-muted-foreground/40">{evt.time}</span>
                </div>
             ))}
          </div>
        </div>
      </div>
      <header
        className={cn(
          "fixed top-7 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-[oklch(0.11_0.012_260/0.95)] backdrop-blur-xl border-b border-[oklch(0.22_0.015_255)]"
            : "bg-[oklch(0.11_0.012_260/0.85)] backdrop-blur-md border-b border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Stellar Pulse" className="w-full h-full object-cover" />
            </div>
            <div className="leading-none">
              <div className="text-sm font-bold tracking-tight text-foreground">
                stellar<span className="text-[oklch(0.78_0.16_82)]">pulse</span>
              </div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">prediction terminal</div>
            </div>
          </Link>

          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 items-center gap-3 h-10 px-4 rounded-xl bg-[oklch(0.16_0.014_255)] border border-[oklch(0.24_0.016_255)] text-muted-foreground hover:border-[oklch(0.78_0.16_82/0.35)] transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Search events, tags, and outcomes...</span>
            <kbd className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-[oklch(0.2_0.015_255)] border border-[oklch(0.24_0.016_255)]">
              ⌘K
            </kbd>
          </button>

          <div className="hidden sm:block relative" data-wallet-menu>
            {walletAddress ? (
              <>
                <button
                  onClick={() => setWalletMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] text-sm font-semibold shadow-[0_0_18px_oklch(0.78_0.16_82/0.24)]"
                >
                  <Wallet className="w-4 h-4" />
                  {shortAddress}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {walletMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] shadow-2xl overflow-hidden z-50">
                    <button
                      onClick={async () => {
                        if (!walletAddress) return
                        try {
                          await navigator.clipboard.writeText(walletAddress)
                        } catch {
                          // ignore
                        }
                        setWalletMenuOpen(false)
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[oklch(0.2_0.014_255)] transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy address
                    </button>
                    <button
                      onClick={() => {
                        router.push("/portfolio")
                        setWalletMenuOpen(false)
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[oklch(0.2_0.014_255)] transition-colors"
                    >
                      View portfolio
                    </button>
                    <button
                      onClick={disconnectWallet}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-[oklch(0.58_0.2_25)] hover:bg-[oklch(0.2_0.014_255)] transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 h-10 rounded-xl bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] text-sm font-semibold shadow-[0_0_18px_oklch(0.78_0.16_82/0.24)]"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>

          <button
            className="md:hidden w-9 h-9 rounded-lg bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] flex items-center justify-center text-muted-foreground"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[oklch(0.22_0.015_255)] bg-[oklch(0.11_0.012_260/0.98)] p-4">
            <button
              onClick={() => {
                setSearchOpen(true)
                setMobileOpen(false)
              }}
              className="w-full flex items-center gap-3 h-10 px-3 rounded-lg bg-[oklch(0.16_0.014_255)] border border-[oklch(0.24_0.016_255)] text-sm text-muted-foreground"
            >
              <Search className="w-4 h-4" />
              Search events...
            </button>
            <button
              onClick={connectWallet}
              className="w-full mt-2 flex items-center justify-center gap-2 h-10 px-3 rounded-lg bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] text-sm font-semibold"
            >
              <Wallet className="w-4 h-4" />
              {walletAddress ? shortAddress : "Connect Wallet"}
            </button>
          </div>
        )}
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-[oklch(0.08_0.01_260/0.82)] backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[oklch(0.16_0.014_255)] border border-[oklch(0.24_0.016_255)] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[oklch(0.22_0.015_255)]">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Search prediction events..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              {searchValue && (
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={clearSearch}>
                  Clear
                </button>
              )}
              <kbd className="text-[10px] font-mono text-muted-foreground px-2 py-1 rounded bg-[oklch(0.2_0.015_255)]">ESC</kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto">
              {searchLoading && <div className="p-4 text-sm text-muted-foreground">Searching…</div>}
              {!searchLoading && searchError && <div className="p-4 text-sm text-[oklch(0.58_0.2_25)]">{searchError}</div>}
              {!searchLoading && !searchError && searchValue && searchResults.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No results.</div>
              )}
              {!searchLoading && searchResults.length > 0 && (
                <div className="divide-y divide-[oklch(0.22_0.015_255)]">
                  {searchResults.map((market) => (
                    <button
                      key={market.id}
                      onClick={() => {
                        setSearchOpen(false)
                        router.push(`/?q=${encodeURIComponent(market.question)}`)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[oklch(0.18_0.014_255)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {market.image ? (
                          <img src={market.image} alt="" className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[oklch(0.18_0.014_255)]" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground line-clamp-1">{market.question}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{market.category}</div>
                        </div>
                        <div className="text-xs font-semibold text-[oklch(0.78_0.16_82)]">{getYesPrice(market).toFixed(1)}¢</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
