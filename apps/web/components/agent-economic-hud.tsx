"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Activity,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Cpu,
  Zap,
  RefreshCw,
  ExternalLink,
  X,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

interface AgentBalance {
  asset: string
  balance: string
  type: string
}

interface AgentProfile {
  address: string
  network: string
  ready: boolean
  balances: AgentBalance[]
  treasury: { usdc: string; xlm: string }
  config: {
    analysisPriceUsd: number
    maxBudgetPerDay: number
    autoFundEnabled: boolean
  }
}

interface LedgerEntry {
  id: string
  type: "debit" | "credit"
  amount: string
  asset: string
  counterparty: string
  txHash: string
  timestamp: string
}

interface LedgerStats {
  dailySpendUsdc: string
  totalSettlements: number
  maxBudgetPerDay: number
  budgetUtilization: string
}

function timeAgo(ts: string) {
  const seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function shortAddr(addr: string) {
  if (!addr || addr.length < 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function getExplorerUrl(txHash: string, network: string) {
  const net = network?.includes("testnet") ? "testnet" : "public"
  return `https://stellar.expert/explorer/${net}/tx/${txHash}`
}

/**
 * BudgetGauge — circular SVG gauge for budget utilization
 */
function BudgetGauge({ utilization }: { utilization: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(utilization, 100) / 100) * circumference
  const color =
    utilization > 80
      ? "oklch(0.65 0.24 25)"
      : utilization > 50
        ? "oklch(0.78 0.16 82)"
        : "oklch(0.68 0.18 155)"

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="drop-shadow-lg">
      <circle
        cx="48"
        cy="48"
        r={radius}
        fill="none"
        stroke="oklch(0.18 0.01 255)"
        strokeWidth="6"
      />
      <circle
        cx="48"
        cy="48"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text
        x="48"
        y="44"
        textAnchor="middle"
        className="fill-white text-[15px] font-bold"
        style={{ fontFamily: "var(--font-space-mono, monospace)" }}
      >
        {utilization.toFixed(0)}%
      </text>
      <text
        x="48"
        y="58"
        textAnchor="middle"
        className="fill-zinc-500 text-[8px] uppercase"
        style={{ fontFamily: "var(--font-space-mono, monospace)", letterSpacing: "0.12em" }}
      >
        Budget
      </text>
    </svg>
  )
}

/**
 * Main Economic HUD component
 */
export function AgentEconomicHud() {
  const [expanded, setExpanded] = useState(false)
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [stats, setStats] = useState<LedgerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pulseActivity, setPulseActivity] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const refreshInFlightRef = useRef(false)

  const fetchWithTimeout = useCallback(async (url: string, timeoutMs = 8000) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/agent/profile`)
      if (!res.ok) return
      const data = await res.json()
      if (data.ok) setProfile(data.agent)
    } catch {
      /* swallow */
    }
  }, [fetchWithTimeout])

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/agent/ledger?limit=15`)
      if (!res.ok) return
      const data = await res.json()
      if (data.ok) {
        // Detect new entries for pulse animation
        if (ledger.length > 0 && data.ledger.length > 0 && data.ledger[0]?.id !== ledger[0]?.id) {
          setPulseActivity(true)
          setTimeout(() => setPulseActivity(false), 2000)
        }
        setLedger(data.ledger)
        setStats(data.stats)
      }
    } catch {
      /* swallow */
    }
  }, [fetchWithTimeout, ledger])

  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) return
    refreshInFlightRef.current = true
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchProfile(), fetchLedger()])
    } catch {
      setError("Failed to refresh")
    } finally {
      refreshInFlightRef.current = false
      setLoading(false)
    }
  }, [fetchProfile, fetchLedger])

  // Initial load + polling
  useEffect(() => {
    refresh()
    pollRef.current = setInterval(refresh, 30000) // 30s polling
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const usdcBalance = parseFloat(profile?.treasury?.usdc ?? "0")
  const xlmBalance = parseFloat(profile?.treasury?.xlm ?? "0")
  const budgetUtil = parseFloat(stats?.budgetUtilization ?? "0")
  const isReady = profile?.ready ?? false
  const costPerUnlock = profile?.config?.analysisPriceUsd ?? 0.05
  const remainingUnlocks = costPerUnlock > 0 ? Math.floor(usdcBalance / costPerUnlock) : 0

  return (
    <div className="w-full">
      {/* ─── Collapsed Bar ─── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
          "bg-[oklch(0.13_0.012_255)] border border-[oklch(0.20_0.015_255)]",
          "hover:border-[oklch(0.78_0.16_82/0.3)] hover:bg-[oklch(0.14_0.012_255)]",
          expanded && "rounded-b-none border-b-transparent"
        )}
      >
        <div className="relative">
          <Bot className="w-4 h-4 text-[oklch(0.78_0.16_82)]" />
          {pulseActivity && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[oklch(0.78_0.16_82)]">
            Agent HUD
          </span>
          <span className="hidden sm:inline text-[9px] font-mono text-zinc-600">
            {profile ? shortAddr(profile.address) : "—"}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          {profile && (
            <>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isReady ? "bg-emerald-400 shadow-[0_0_6px_oklch(0.68_0.18_155)]" : "bg-rose-400 shadow-[0_0_6px_oklch(0.65_0.24_25)]"
                )} />
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  {isReady ? "Ready" : "Setup Required"}
                </span>
              </div>
              <div className="h-3 w-px bg-zinc-800" />
              <span className="text-[10px] font-mono text-zinc-300 font-bold">
                {usdcBalance.toFixed(2)} <span className="text-zinc-500">USDC</span>
              </span>
              <div className="h-3 w-px bg-zinc-800" />
              <span className="text-[9px] font-mono text-zinc-500">
                {stats?.totalSettlements ?? 0} txns
              </span>
            </>
          )}
        </div>

        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        )}
      </button>

      {/* ─── Expanded Panel ─── */}
      {expanded && (
        <div className={cn(
          "border border-t-0 border-[oklch(0.20_0.015_255)] rounded-b-xl overflow-hidden",
          "bg-[oklch(0.11_0.012_260)] relative"
        )}>
          {/* Scan-line overlay */}
          <div className="pointer-events-none absolute inset-0 z-10 hud-scanline opacity-[0.03]" />

          <div className="p-5 space-y-5 relative z-20">
            {/* ─── Header Row ─── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[oklch(0.78_0.16_82)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Autonomous Economic Agent
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  <RefreshCw className={cn("w-3 h-3 text-zinc-500", loading && "animate-spin")} />
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-3 h-3 text-zinc-500" />
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[10px] font-mono text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* ─── Treasury Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* USDC Balance */}
              <div className="p-3 rounded-xl bg-[oklch(0.14_0.012_255)] border border-[oklch(0.20_0.015_255)] space-y-1">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-mono">USDC Balance</div>
                <div className="text-lg font-bold text-white font-mono tracking-tight">
                  {usdcBalance.toFixed(2)}
                </div>
                <div className="text-[9px] text-zinc-600 font-mono">
                  ≈ ${usdcBalance.toFixed(2)} USD
                </div>
              </div>

              {/* XLM Balance */}
              <div className="p-3 rounded-xl bg-[oklch(0.14_0.012_255)] border border-[oklch(0.20_0.015_255)] space-y-1">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-mono">XLM Reserve</div>
                <div className="text-lg font-bold text-white font-mono tracking-tight">
                  {xlmBalance.toFixed(2)}
                </div>
                <div className="text-[9px] text-zinc-600 font-mono">
                  Gas + Reserve
                </div>
              </div>

              {/* Unlocks Remaining */}
              <div className="p-3 rounded-xl bg-[oklch(0.14_0.012_255)] border border-[oklch(0.20_0.015_255)] space-y-1">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-mono">Unlocks Left</div>
                <div className="text-lg font-bold font-mono tracking-tight">
                  <span className={cn(
                    remainingUnlocks > 10 ? "text-emerald-400" : remainingUnlocks > 3 ? "text-[oklch(0.78_0.16_82)]" : "text-rose-400"
                  )}>
                    {remainingUnlocks}
                  </span>
                </div>
                <div className="text-[9px] text-zinc-600 font-mono">
                  @ ${costPerUnlock} each
                </div>
              </div>

              {/* Daily Settlements */}
              <div className="p-3 rounded-xl bg-[oklch(0.14_0.012_255)] border border-[oklch(0.20_0.015_255)] space-y-1">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-mono">Today&apos;s Spend</div>
                <div className="text-lg font-bold text-white font-mono tracking-tight">
                  ${parseFloat(stats?.dailySpendUsdc ?? "0").toFixed(2)}
                </div>
                <div className="text-[9px] text-zinc-600 font-mono">
                  of ${stats?.maxBudgetPerDay ?? 5} daily cap
                </div>
              </div>
            </div>

            {/* ─── Budget Gauge + Status ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gauge */}
              <div className="flex items-center justify-center p-4 rounded-xl bg-[oklch(0.13_0.010_255)] border border-[oklch(0.18_0.012_255)]">
                <BudgetGauge utilization={budgetUtil} />
              </div>

              {/* System Status */}
              <div className="md:col-span-2 p-4 rounded-xl bg-[oklch(0.13_0.010_255)] border border-[oklch(0.18_0.012_255)] space-y-3">
                <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-mono font-bold">System Status</div>
                <div className="space-y-2">
                  {[
                    { label: "Account Funded", ok: xlmBalance > 2, detail: `${xlmBalance.toFixed(1)} XLM` },
                    { label: "USDC Trustline", ok: isReady, detail: isReady ? "Active" : "Missing" },
                    { label: "x402 Settlement", ok: true, detail: "Enabled" },
                    { label: "Spending Guardrail", ok: budgetUtil < 100, detail: `${budgetUtil.toFixed(0)}% of daily cap` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.ok ? "bg-emerald-400" : "bg-rose-400"
                        )} />
                        <span className="text-[10px] text-zinc-400 font-mono">{item.label}</span>
                      </div>
                      <span className={cn(
                        "text-[9px] font-mono font-bold",
                        item.ok ? "text-emerald-400/70" : "text-rose-400/70"
                      )}>
                        {item.detail}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Network Badge */}
                <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-zinc-600" />
                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Network</span>
                  </div>
                  <span className="text-[9px] font-mono text-[oklch(0.78_0.16_82)] font-bold uppercase tracking-wider">
                    {profile?.network ?? "stellar:testnet"}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── M2M Activity Ledger ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-mono font-bold">
                    M2M Settlement Ledger
                  </span>
                </div>
                <span className="text-[9px] font-mono text-zinc-700">
                  {ledger.length} records
                </span>
              </div>

              <div className="rounded-xl border border-[oklch(0.18_0.012_255)] overflow-hidden">
                {ledger.length === 0 ? (
                  <div className="p-6 text-center">
                    <Wallet className="w-5 h-5 text-zinc-800 mx-auto mb-2" />
                    <div className="text-[10px] text-zinc-700 font-mono uppercase tracking-wider">
                      No settlements recorded
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[oklch(0.16_0.012_255)]">
                    {ledger.slice(0, 8).map((entry, i) => (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[oklch(0.14_0.012_255)]",
                          i === 0 && pulseActivity && "animate-pulse bg-emerald-500/5"
                        )}
                      >
                        {/* Direction Icon */}
                        <div className={cn(
                          "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                          entry.type === "debit"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        )}>
                          {entry.type === "debit" ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-300 font-bold">
                              {entry.type === "debit" ? "Paid" : "Received"} {parseFloat(entry.amount).toFixed(4)} {entry.asset}
                            </span>
                          </div>
                          <div className="text-[9px] font-mono text-zinc-600 truncate">
                            {entry.type === "debit" ? "→" : "←"} {shortAddr(entry.counterparty)}
                          </div>
                        </div>

                        {/* Timestamp + Link */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-mono text-zinc-700">
                            {timeAgo(entry.timestamp)}
                          </span>
                          <a
                            href={getExplorerUrl(entry.txHash, profile?.network ?? "testnet")}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-zinc-800 transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-700 hover:text-[oklch(0.78_0.16_82)]" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Agent Address Footer ─── */}
            {profile?.address && (
              <div className="pt-3 border-t border-zinc-800/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-zinc-700" />
                  <span className="text-[9px] font-mono text-zinc-700 tracking-wide">
                    Agent Vault: {shortAddr(profile.address)}
                  </span>
                </div>
                <a
                  href={`https://stellar.expert/explorer/${profile.network?.includes("testnet") ? "testnet" : "public"}/account/${profile.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-mono text-[oklch(0.78_0.16_82/0.5)] hover:text-[oklch(0.78_0.16_82)] transition-colors flex items-center gap-1"
                >
                  View on Explorer <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
