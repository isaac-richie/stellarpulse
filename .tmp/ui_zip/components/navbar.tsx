"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Markets", href: "#markets", icon: BarChart3 },
  { label: "Portfolio", href: "#portfolio", icon: TrendingUp },
  { label: "Leaderboard", href: "#leaderboard", icon: Zap },
  { label: "Docs", href: "#docs", icon: Globe },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
            {/* Logo */}
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
                  Predict<span className="text-[oklch(0.78_0.16_82)]">X</span>
                </span>
                <span className="text-[9px] font-mono text-[oklch(0.55_0.01_90)] uppercase tracking-widest">
                  on BNB
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
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

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] text-[oklch(0.45_0.01_90)] text-sm hover:border-[oklch(0.78_0.16_82/0.4)] transition-colors duration-200 w-44"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search markets...</span>
                <kbd className="ml-auto font-mono text-[10px] bg-[oklch(0.22_0.015_255)] px-1.5 py-0.5 rounded">⌘K</kbd>
              </button>

              {/* Notifications */}
              <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] text-[oklch(0.55_0.01_90)] hover:text-foreground hover:border-[oklch(0.78_0.16_82/0.4)] transition-all duration-200">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[oklch(0.78_0.16_82)]" />
              </button>

              {/* Connect Wallet */}
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] text-sm font-semibold hover:bg-[oklch(0.82_0.16_82)] active:bg-[oklch(0.72_0.16_82)] transition-all duration-200 shadow-[0_0_16px_oklch(0.78_0.16_82/0.25)] hover:shadow-[0_0_24px_oklch(0.78_0.16_82/0.4)]">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>

              {/* Mobile menu toggle */}
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

        {/* Mobile Menu */}
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
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] text-sm font-semibold">
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Search Modal */}
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
              />
              <kbd className="font-mono text-[10px] text-[oklch(0.45_0.01_90)] bg-[oklch(0.22_0.015_255)] px-2 py-1 rounded">ESC</kbd>
            </div>
            <div className="p-3 text-sm text-[oklch(0.45_0.01_90)] font-mono">
              Type to search markets, e.g. &quot;BTC price&quot;, &quot;US Election&quot;...
            </div>
          </div>
        </div>
      )}
    </>
  )
}
