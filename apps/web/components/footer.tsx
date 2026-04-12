import Link from "next/link"

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[oklch(0.22_0.015_255)] bg-[oklch(0.105_0.012_260)]/96 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight">
              StellarPulse Protocol
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Built for fast event discovery, reliable execution routing, and premium AI analysis.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Events</Link>
            <Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</Link>
            <span className="hidden sm:inline">•</span>
            <span className="text-[oklch(0.55_0.01_90)]">© {new Date().getFullYear()}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[oklch(0.22_0.015_255)] flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <p className="leading-none">
            stellar<span className="text-[oklch(0.78_0.16_82)]">pulse</span>
            <span className="ml-2 text-[oklch(0.45_0.01_90)]">on Stellar</span>
          </p>
          <p className="leading-none">Liquidity routed. Intelligence unlocked.</p>
        </div>
      </div>
    </footer>
  )
}
