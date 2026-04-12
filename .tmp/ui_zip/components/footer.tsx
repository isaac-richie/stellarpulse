import Link from "next/link"
import { ArrowUpRight, ExternalLink, Github, Twitter } from "lucide-react"

const footerLinks = {
  Protocol: [
    { label: "Markets", href: "#" },
    { label: "Leaderboard", href: "#" },
    { label: "Portfolio", href: "#" },
    { label: "Activity Feed", href: "#" },
  ],
  Developers: [
    { label: "Documentation", href: "#", ext: true },
    { label: "API Reference", href: "#", ext: true },
    { label: "GitHub", href: "#", ext: true },
    { label: "Status", href: "#", ext: true },
  ],
  Resources: [
    { label: "How It Works", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Blog", href: "#", ext: true },
    { label: "Community", href: "#", ext: true },
  ],
  Legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Risk Disclosure", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
}

const chains = [
  { label: "BNB Chain", color: "#F0B90B", active: true },
  { label: "Polygon", color: "#8247E5", active: false },
  { label: "Ethereum", color: "#627EEA", active: false },
]

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-[oklch(0.22_0.015_255)] bg-[oklch(0.105_0.012_260)]">
      {/* Top ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, oklch(0.78 0.16 82 / 0.3), transparent)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 py-14">
          {/* Brand column */}
          <div className="col-span-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.78_0.16_82)] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <polygon points="9,1 17,5.5 17,12.5 9,17 1,12.5 1,5.5" fill="oklch(0.12 0.01 255)" strokeWidth="0"/>
                  <polygon points="9,4 14,6.8 14,11.2 9,14 4,11.2 4,6.8" fill="oklch(0.78 0.16 82)" strokeWidth="0"/>
                  <circle cx="9" cy="9" r="2" fill="oklch(0.12 0.01 255)"/>
                </svg>
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

            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs">
              The most liquid decentralized prediction market protocol. Trade on real-world outcomes with instant settlement.
            </p>

            {/* Chain badges */}
            <div className="flex items-center gap-2 mb-6">
              {chains.map((c) => (
                <div
                  key={c.label}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                    c.active
                      ? "bg-[oklch(0.22_0.04_82)] border-[oklch(0.78_0.16_82/0.4)] text-[oklch(0.78_0.16_82)]"
                      : "bg-[oklch(0.15_0.012_255)] border-[oklch(0.22_0.015_255)] text-[oklch(0.4_0.01_90)]"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.active ? c.color : "oklch(0.3 0.01 255)" }} />
                  {c.label}
                  {c.active && <span className="text-[8px] font-bold">LIVE</span>}
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {[
                { icon: Twitter, label: "Twitter", href: "#" },
                { icon: Github, label: "GitHub", href: "#" },
                {
                  icon: () => (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.552 1.004C3.46 1.004 1 3.44 1 6.5c0 1.643.71 3.117 1.843 4.147L1 15l4.5-1.788A5.465 5.465 0 0 0 6.552 13.5C9.644 13.5 12 11.064 12 8.004V6.5C12 3.44 9.64 1.004 6.552 1.004Z"/>
                    </svg>
                  ),
                  label: "Discord",
                  href: "#",
                },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] text-muted-foreground hover:text-[oklch(0.78_0.16_82)] hover:border-[oklch(0.78_0.16_82/0.4)] transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[oklch(0.78_0.16_82)] mb-4">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
                    >
                      {link.label}
                      {link.ext && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter bar */}
        <div className="border-t border-[oklch(0.22_0.015_255)] py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Stay ahead of the market</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get weekly market insights and high-volume signals.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 sm:w-56 bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] rounded-xl px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[oklch(0.78_0.16_82/0.5)] transition-colors"
              />
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[oklch(0.78_0.16_82)] text-[oklch(0.12_0.01_255)] text-sm font-semibold hover:bg-[oklch(0.82_0.16_82)] transition-colors whitespace-nowrap shadow-[0_0_16px_oklch(0.78_0.16_82/0.2)]">
                Subscribe
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[oklch(0.22_0.015_255)] py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2025 PredictX Protocol. All rights reserved. Data powered by Polymarket.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.68_0.18_155)] pulse-dot" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
