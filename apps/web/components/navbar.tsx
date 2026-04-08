"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Bell,
  ChevronDown,
  Globe,
  Menu,
  Search,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { cn } from "@/lib/utils"
import { fetchPolymarketMarkets, type PolymarketMarket } from "@/lib/polymarket"

const navLinks = [
  { label: "Markets", href: "/", icon: BarChart3 },
  { label: "Portfolio", href: "/portfolio", icon: TrendingUp },
  { label: "Docs", href: "#docs", icon: Globe },
]

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
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)
  const walletMenuRef = useRef<HTMLDivElement | null>(null)
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()

  const connectedLabel = useMemo(() => {
    const addr = wallets?.[0]?.address
    if (!addr) return "Wallet"
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }, [wallets])

  useEffect(() => {
    if (!walletMenuOpen) return
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (walletMenuRef.current && !walletMenuRef.current.contains(target)) {
        setWalletMenuOpen(false)
      }
    }
    window.addEventListener("mousedown", onClick)
    return () => window.removeEventListener("mousedown", onClick)
  }, [walletMenuOpen])

  const copyAddress = async () => {
    const addr = wallets?.[0]?.address
    if (!addr) return
    try {
      await navigator.clipboard.writeText(addr)
    } catch {
      // ignore
    }
  }

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
        const data = await fetchPolymarketMarkets("all", 11, "trending", 0, query)
        setSearchResults(data)
      } catch (err: any) {
        setSearchError("Search failed. Try again.")
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(handle)
  }, [searchValue, searchOpen])

  const clearSearch = () => {
    setSearchValue("")
    setSearchResults([])
    setSearchError(null)
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-[oklch(0.11_0.012_260/0.95)] backdrop-blur-xl border-b border-[oklch(0.22_0.015_255)]"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.78_0.16_82)] flex items-center justify-center group-hover:shadow-[0_0_16px_oklch(0.78_0.16_82/0.5)] transition-shadow duration-300">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <polygon points="9,1 17,5.5 17,12.5 9,17 1,12.5 1,5.5" fill="oklch(0.12 0.01 255)" strokeWidth="0"/>
                    <polygon points="9,4 14,6.8 14,11.2 9,14 4,11.2 4,6.8" fill="oklch(0.78 0.16 82)" strokeWidth="0"/>
                    <circle cx="9" cy="9" r="2" fill="oklch(0.12 0.01 255)"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight text-foreground">
                  rwa<span className="text-[oklch(0.78_0.16_82)]">analytics</span>
                </span>
                <span className="text-[9px] font-mono text-[oklch(0.55_0.01_90)] uppercase tracking-widest">
                  prediction markets
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium text-[oklch(0.65_0.01_90)] hover:text-foreground hover:bg-[oklch(0.18_0.014_255)] transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
              <button className="flex items-center gap-1 px-3.5 py-2 rounded-md text-sm font-medium text-[oklch(0.65_0.01_90)] hover:text-foreground hover:bg-[oklch(0.18_0.014_255)] transition-all duration-200">
                More <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] text-[oklch(0.45_0.01_90)] text-sm hover:border-[oklch(0.78_0.16_82/0.4)] transition-colors duration-200 w-44"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search markets...</span>
                <kbd className="ml-auto font-mono text-[10px] bg-[oklch(0.22_0.015_255)] px-1.5 py-0.5 rounded">⌘K</kbd>
              </button>

              {ready && (
                <div className="hidden sm:block relative" ref={walletMenuRef}>
                  <button
                    onClick={() => {
                      if (!authenticated) return login()
                      setWalletMenuOpen((v) => !v)
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] text-sm font-semibold hover:bg-[oklch(0.82_0.16_82)] active:bg-[oklch(0.72_0.16_82)] transition-all duration-200 shadow-[0_0_16px_oklch(0.78_0.16_82/0.25)] hover:shadow-[0_0_24px_oklch(0.78_0.16_82/0.4)]"
                  >
                    <Wallet className="w-4 h-4" />
                    {authenticated ? connectedLabel : "Connect Wallet"}
                    {authenticated && <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {authenticated && walletMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] shadow-2xl overflow-hidden z-50">
                      <button
                        onClick={() => {
                          copyAddress()
                          setWalletMenuOpen(false)
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[oklch(0.2_0.014_255)] transition-colors"
                      >
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
                        onClick={() => {
                          logout()
                          setWalletMenuOpen(false)
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-[oklch(0.58_0.2_25)] hover:bg-[oklch(0.2_0.014_255)] transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] text-[oklch(0.55_0.01_90)]"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[oklch(0.22_0.015_255)] bg-[oklch(0.11_0.012_260/0.98)] backdrop-blur-xl">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[oklch(0.65_0.01_90)] hover:text-foreground hover:bg-[oklch(0.18_0.014_255)] transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  <link.icon className="w-4 h-4 text-[oklch(0.78_0.16_82)]" />
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-[oklch(0.22_0.015_255)]">
                {ready && (
                  <button
                    onClick={() => {
                      if (authenticated) logout()
                      else login()
                      setMobileOpen(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] text-sm font-semibold"
                  >
                    <Wallet className="w-4 h-4" />
                    {authenticated ? connectedLabel : "Connect Wallet"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-[oklch(0.08_0.01_260/0.8)] backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[oklch(0.22_0.015_255)]">
              <Search className="w-5 h-5 text-[oklch(0.55_0.01_90)]" />
              <input
                autoFocus
                type="text"
                placeholder="Search prediction markets..."
                className="flex-1 bg-transparent text-foreground placeholder:text-[oklch(0.45_0.01_90)] outline-none text-base"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              {searchValue && (
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={clearSearch}
                >
                  Clear
                </button>
              )}
              <kbd className="font-mono text-[10px] text-[oklch(0.45_0.01_90)] bg-[oklch(0.22_0.015_255)] px-2 py-1 rounded">ESC</kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {searchLoading && (
                <div className="p-4 text-sm text-muted-foreground">Searching…</div>
              )}
              {!searchLoading && searchError && (
                <div className="p-4 text-sm text-[oklch(0.58_0.2_25)]">{searchError}</div>
              )}
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
                        router.push(`/markets/${market.id}`)
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
                        <div className="text-xs font-semibold text-[oklch(0.78_0.16_82)]">
                          {getYesPrice(market).toFixed(1)}¢
                        </div>
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
