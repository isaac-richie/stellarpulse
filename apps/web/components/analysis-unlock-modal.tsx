"use client"

import { useMemo, useState, useEffect } from "react"
import type { PolymarketMarket } from "@/lib/polymarket"
import { createFreighterPaymentFetch, connectFreighterWallet, addUsdcTrustline, swapXlmForUsdc } from "@/lib/x402"
import { isConnected, getAddress, getNetwork } from "@stellar/freighter-api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Bot, UserRound, ShieldCheck, Wallet, ChevronRight, Activity, AlertTriangle, Cpu, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

type ActorType = "user" | "agent"
type PaymentStage = "idle" | "connecting" | "requesting" | "signing" | "ready" | "error"

interface AnalysisData {
  eventBrief: string
  globalContext: string
  structuralDrivers: string[]
  marketSignalInterpretation: string
  informationAsymmetry: string
  riskLandscape: string[]
  strategicInsight: string
  terminalNote: string
  timeline?: string[]
  intelligenceDossier?: {
    probabilityBias: "Positive" | "Negative" | "Neutral"
    tacticalMilestones: string[]
    informationAsymmetry: string
    catalystChronology: string[]
    mppExecutionPath: string
    agentDirective?: string
    signalStrength?: number
    rawSignalHash: string
    agentState?: {
      mode: string
      focus: string
      confidenceStructure: string
    }
    reasoningTrace?: string[]
    agentMemory?: {
      previousPatternsDetected: string[]
      structuralDeviation: string
    }
  }
}

interface SettlementData {
  amountUsd: number
  proof: string
  settledAt: string
}

interface ReceiptData {
  id: string
  rail: string
  network: string
  asset: string
  amountAtomic: string
  amountUsd: number
  payTo: string
  payer?: string
  txHash: string
  settledAt: string
}

interface UnlockResponse {
  ok: boolean
  analysis: AnalysisData
  settlement: SettlementData
  receipt?: ReceiptData
}

const SentimentPolarizer = ({ bias }: { bias: "Positive" | "Negative" | "Neutral" }) => {
  const getGradient = () => {
    if (bias === "Positive") return "from-emerald-500/20 to-emerald-500"
    if (bias === "Negative") return "from-rose-500/20 to-rose-500"
    return "from-blue-500/20 to-blue-500"
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Sentiment Polarity</span>
        <span className={cn(
          "text-xs font-bold font-mono tracking-tighter",
          bias === "Positive" ? "text-emerald-400" : bias === "Negative" ? "text-rose-400" : "text-blue-400"
        )}>{bias}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800/50">
        <div className={cn(
          "h-full rounded-full bg-gradient-to-r transition-all duration-1000",
          getGradient(),
          bias === "Positive" ? "w-[85%]" : bias === "Negative" ? "w-[85%] ml-auto" : "w-[40%] mx-auto"
        )} />
      </div>
    </div>
  )
}

const ConfidenceMeter = ({ score }: { score: number }) => {
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end">
        <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Analyst Conviction</span>
        <span className="text-xs font-bold font-mono text-zinc-300">{score}%</span>
      </div>
      <div className="flex gap-0.5 h-1.5 grayscale opacity-60">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "flex-1 rounded-sm transition-all duration-700",
              i < (score / 5) ? (score > 75 ? "bg-blue-400" : "bg-zinc-400") : "bg-zinc-800"
            )} 
          />
        ))}
      </div>
    </div>
  )
}

interface ReadinessResponse {
  ok: boolean
  readiness?: {
    ready: boolean
    checks: {
      accountExists: boolean
      trustlineExists: boolean | "unknown"
    }
    hints: string[]
  }
}

interface AnalysisUnlockModalProps {
  open: boolean
  market: PolymarketMarket | null
  onOpenChange: (open: boolean) => void
}

function humanizeError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("trustline entry is missing")) {
    return "Your Freighter wallet is missing a USDC trustline on Stellar. Add the trustline, then retry."
  }
  if (lower.includes("invalid stellar asset address")) {
    return "Payment asset address config is invalid."
  }
  if (lower.includes("networkerror") || lower.includes("failed to fetch")) {
    return "Network request failed. Check connection and retry."
  }
  return message
}

export function AnalysisUnlockModal({ open, market, onOpenChange }: AnalysisUnlockModalProps) {
  const [actorType, setActorType] = useState<ActorType>("user")
  const [loading, setLoading] = useState(false)
  const [userAnalysis, setUserAnalysis] = useState<AnalysisData | null>(null)
  const [agentAnalysis, setAgentAnalysis] = useState<AnalysisData | null>(null)
  const [userReceipt, setUserReceipt] = useState<ReceiptData | null>(null)
  const [agentReceipt, setAgentReceipt] = useState<ReceiptData | null>(null)
  const [lastSettlement, setLastSettlement] = useState<SettlementData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletNetwork, setWalletNetwork] = useState<string | null>(null)
  const [paymentStage, setPaymentStage] = useState<PaymentStage>("idle")
  const [walletReady, setWalletReady] = useState<boolean | null>(null)
  const [walletHints, setWalletHints] = useState<string[]>([])
  const [agentStatus, setAgentStatus] = useState<any>(null)
  const [agentLedger, setAgentLedger] = useState<any>(null)
  const [bridgeQuote, setBridgeQuote] = useState<any>(null)
  const [bridgeLoading, setBridgeLoading] = useState(false)
  const [trustlineLoading, setTrustlineLoading] = useState(false)
  const [fundingLoading, setFundingLoading] = useState(false)
  const [agentActivationLoading, setAgentActivationLoading] = useState(false)

  const yesPrice = useMemo(() => market?.outcomes?.[0]?.price ?? 50, [market])

  useEffect(() => {
    if (open) {
      const checkNet = async () => {
        try {
          const net = await getNetwork() as any
          const netName = typeof net === "string" ? net : net?.network ?? "UNKNOWN"
          setWalletNetwork(String(netName))
        } catch (e) {
          console.error(e)
          setWalletNetwork("ERROR")       }
      }
      checkNet()
    }
  }, [open])

  useEffect(() => {
    if (open && !walletAddress) {
      const checkConnection = async () => {
        try {
          const connected = await isConnected()
          if (connected) {
            const res = await getAddress() as any
            const userAddress = typeof res === "string" ? res : res?.address
            if (userAddress) {
              setWalletAddress(userAddress)
              await checkReadiness(userAddress)
            }
          }
        } catch (e) {
          console.error(e)
        }
      }
      checkConnection()
    }
  }, [open, walletAddress])

  // Neural Reset Protocol: Clear state when event changes to prevent "Ghost Analysis"
  useEffect(() => {
    if (market?.id) {
      setUserAnalysis(null)
      setAgentAnalysis(null)
      setUserReceipt(null)
      setAgentReceipt(null)
      setError(null)
      setPaymentStage("idle")
    }
  }, [market?.id])

  const fetchAgentStatus = async () => {
    try {
      const [statusRes, ledgerRes] = await Promise.all([
        fetch(`${API_BASE}/analysis/agent-status`),
        fetch(`${API_BASE}/agent/ledger`)
      ])
      
      const statusData = await statusRes.json()
      if (statusData.ok) setAgentStatus(statusData.status)

      const ledgerData = await ledgerRes.json()
      if (ledgerData.ok) setAgentLedger(ledgerData)
    } catch (e) {
      console.error("Failed to fetch agent status", e)
    }
  }

  useEffect(() => {
    if (open && actorType === "agent") {
      fetchAgentStatus()
    }
  }, [open, actorType])

  const handleActivateAgent = async () => {
    setAgentActivationLoading(true)
    try {
      const res = await fetch(`${API_BASE}/analysis/activate-agent`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Agent activation failed")
      toast.success("Agent Activated")
      await new Promise(r => setTimeout(r, 2000))
      await fetchAgentStatus()
    } catch (err: any) {
      toast.error(err.message || "Activation failed")
    } finally {
      setAgentActivationLoading(false)
    }
  }

  const handleAddTrustline = async () => {
    setTrustlineLoading(true)
    try {
      await addUsdcTrustline()
      toast.success("Trustline added")
      await new Promise(resolve => setTimeout(resolve, 2000))
      if (walletAddress) checkReadiness(walletAddress)
      await fetchAgentStatus()
    } catch (err: any) {
      toast.error(err.message || "Failed")
    } finally {
      setTrustlineLoading(false)
    }
  }

  const handleFundWallet = async () => {
    setFundingLoading(true)
    try {
      await swapXlmForUsdc()
      toast.success("Funding successful")
      await new Promise(resolve => setTimeout(resolve, 2000))
      if (walletAddress) checkReadiness(walletAddress)
    } catch (err: any) {
      toast.error(err.message || "Failed")
    } finally {
      setFundingLoading(false)
    }
  }

  const checkReadiness = async (address: string) => {
    const res = await fetch(`${API_BASE}/analysis/payment-readiness?address=${encodeURIComponent(address)}`)
    const data = (await res.json()) as ReadinessResponse
    if (!res.ok || !data.ok || !data.readiness) {
      setWalletReady(null)
      return
    }
    setWalletReady(data.readiness.ready)
    setWalletHints(data.readiness.hints ?? [])
  }

  const connectWallet = async () => {
    setError(null)
    setPaymentStage("connecting")
    try {
      const address = await connectFreighterWallet()
      setWalletAddress(address)
      await checkReadiness(address)
      setPaymentStage("idle")
    } catch (err: any) {
      setError(err?.message ?? "Connect failed")
      setPaymentStage("error")
    }
  }

  const requestUnlock = async () => {
    if (!market) return
    setLoading(true)
    setError(null)
    setPaymentStage("requesting")
    try {
      setPaymentStage("signing")
      let res;
      let data;
      if (actorType === "agent") {
        res = await fetch(`${API_BASE}/analysis/unlock-agent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            actorType: "agent", 
            market: { 
              id: market.id,
              question: market.question,
              category: market.category,
              outcomes: market.outcomes
            } 
          })
        })
        data = await res.json()
      } else {
        const fetchWithPayment = await createFreighterPaymentFetch()
        res = await fetchWithPayment(`${API_BASE}/analysis/unlock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            actorType: "user", 
            market: { 
              id: market.id,
              question: market.question,
              category: market.category,
              outcomes: market.outcomes
            } 
          }),
        })
        data = await res.json()
      }
      if (!res.ok) throw new Error(data?.message ?? "Unlock failed")
      const okData = data as UnlockResponse
      
      if (actorType === "agent") {
        setAgentAnalysis(okData.analysis)
        setAgentReceipt(okData.receipt ?? null)
      } else {
        setUserAnalysis(okData.analysis)
        setUserReceipt(okData.receipt ?? null)
      }
      
      setLastSettlement(okData.settlement)
      setPaymentStage("ready")
    } catch (err: any) {
      setError(humanizeError(err?.message ?? "Error"))
      setPaymentStage("error")
    } finally {
      setLoading(false)
    }
  }

  const handleFetchBridgeQuote = async () => {
    setBridgeLoading(true)
    try {
      const res = await fetch(`${API_BASE}/bridge/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromChainId: "11111", asset: "USDC", amount: "100" })
      })
      const data = await res.json()
      setBridgeQuote(data)
    } catch (e) {
      setError("Bridge failed")
    } finally {
      setBridgeLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col overflow-hidden bg-zinc-950 border-zinc-800 text-white rounded-xl shadow-2xl shadow-black/50 data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:duration-300 transition-all">
        
        {/* TOP FIXED NAV ZONE */}
        <div className="p-6 pb-4 shrink-0 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md z-20">
          <DialogHeader className="mb-4">
            {actorType === "agent" ? (
              <>
                <DialogTitle className="text-2xl font-bold uppercase tracking-tighter text-emerald-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  ACTIVE AGENT PROCESS
                </DialogTitle>
                <DialogDescription className="text-emerald-500/80 font-mono text-xs tracking-widest uppercase">
                  Real-time narrative intelligence system
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle className="text-2xl font-bold uppercase tracking-tighter">Neural Intelligence Terminal</DialogTitle>
                <DialogDescription className="text-zinc-500 font-mono text-xs">
                  [SYSTEM] SECURING INSTITUTIONAL ALPHA VIA STELLAR x402
                </DialogDescription>
              </>
            )}
          </DialogHeader>

          {market && (
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-xl font-medium tracking-tight text-white/90">{market.question}</div>
                <div className="mt-2 flex items-center gap-3">
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 py-0.5 uppercase tracking-widest text-[10px] bg-yellow-500/5">{market.category}</Badge>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{yesPrice}% CONSENSUS</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 bg-black/50 p-1 rounded-lg border border-zinc-800/50 self-start">
                <Button variant={actorType === "user" ? "secondary" : "ghost"} onClick={() => setActorType("user")} size="sm" className="h-8 text-xs px-4">
                  <UserRound className="w-3 h-3 mr-2" /> User
                </Button>
                <Button variant={actorType === "agent" ? "secondary" : "ghost"} onClick={() => setActorType("agent")} size="sm" className="h-8 text-xs px-4">
                  <Bot className="w-3 h-3 mr-2" /> Agent
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* SCROLLING INTELLIGENCE BODY */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-zinc-950/50 relative">
          {market && (
            <div className="space-y-6">

              {((actorType === "user" && !userAnalysis) || (actorType === "agent" && !agentAnalysis)) && (
                <div className="space-y-4">
                  {actorType === "user" && !walletAddress && (
                    <Button onClick={connectWallet} className="w-full bg-yellow-400 text-black hover:bg-yellow-500">Connect Wallet</Button>
                  )}
                  {actorType === "user" && walletAddress && (
                    <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs font-mono space-y-2">
                       <div className="flex justify-between">
                         <span className="text-zinc-500">WALLET:</span>
                         <span className="text-zinc-300">{walletAddress.slice(0,6)}...{walletAddress.slice(-6)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-zinc-500">READY:</span>
                         <span className={walletReady ? "text-green-400" : "text-red-400"}>{walletReady ? "TRUE" : "ACTION REQUIRED"}</span>
                       </div>
                       {walletHints.length > 0 && (
                         <div className="pt-2">
                           <ul className="text-[10px] text-zinc-500 list-disc list-inside">
                             {walletHints.map((h, i) => <li key={i}>{h}</li>)}
                           </ul>
                           {!walletReady && walletHints.some(h => h.includes("trustline")) && (
                             <Button onClick={handleAddTrustline} disabled={trustlineLoading} className="w-full mt-2 h-8 text-[10px]" variant="outline">
                               {trustlineLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Zap className="w-3 h-3 mr-1"/>} Add Trustline
                             </Button>
                           )}
                           {!walletReady && walletHints.some(h => h.includes("balance")) && (
                             <Button onClick={handleFundWallet} disabled={fundingLoading} className="w-full mt-2 h-8 text-[10px]" variant="outline">
                               {fundingLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Activity className="w-3 h-3 mr-1"/>} Fast-Fund XLM → USDC
                             </Button>
                           )}
                         </div>
                       )}
                    </div>
                  )}
                  {actorType === "agent" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '100ms'}}>
                       {/* Treasury Core Node */}
                       <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-sm">
                          <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                            <Bot className="w-24 h-24" />
                          </div>
                          <div>
                            <div className="text-zinc-500 uppercase tracking-widest text-[9px] mb-1 font-bold">Agent Treasury</div>
                            <div className="text-2xl font-medium tracking-tight text-white flex items-baseline gap-1">
                               {(() => {
                                  const targetCode = (agentStatus?.usdcAssetCode ?? "USDC").toUpperCase();
                                  const targetIssuer = agentStatus?.usdcIssuer;
                                  const bal = agentStatus?.balances?.find((b:any) => 
                                     b.asset_code?.toUpperCase() === targetCode && 
                                     (!targetIssuer || b.asset_issuer === targetIssuer)
                                  );
                                  if (!bal || parseFloat(bal.balance) === 0) {
                                     const anyFunded = agentStatus?.balances?.find((b:any) => 
                                        b.asset_code?.toUpperCase() === "USDC" && parseFloat(b.balance) > 0
                                     );
                                     return (anyFunded?.balance ?? bal?.balance ?? "0.00");
                                  }
                                  return (bal.balance ?? "0.00");
                               })()}
                               <span className="text-xs text-zinc-500 font-mono">USDC</span>
                            </div>
                          </div>
                          <div className="mt-4">
                            {!agentStatus?.ready ? (
                               <Button onClick={handleActivateAgent} disabled={agentActivationLoading} size="sm" className="h-6 text-[9px] bg-amber-600 hover:bg-amber-700 w-full">Activate Configuration</Button>
                            ) : (
                               <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-[9px] tracking-widest uppercase">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span> ONLINE
                               </Badge>
                            )}
                          </div>
                       </div>
                       
                       {/* Telemetry Node */}
                       <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between hover:border-blue-500/30 transition-colors shadow-sm">
                          <div className="text-zinc-500 uppercase tracking-widest text-[9px] mb-1 font-bold flex justify-between">
                            <span>Runtime Logistics</span>
                            <span className="text-blue-400">{agentLedger?.stats?.budgetUtilization ?? "0"}% BUDGET</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-black/30 p-2 rounded">
                               <div className="text-[8px] text-zinc-600 mb-0.5 tracking-widest uppercase">24H Spend</div>
                               <div className="text-sm font-medium text-white">${agentLedger?.stats?.dailySpendUsdc ?? "0.00"} <span className="text-zinc-500 text-[9px] font-normal tracking-wide">/ ${agentLedger?.stats?.maxBudgetPerDay ?? "5"}</span></div>
                            </div>
                            <div className="bg-black/30 p-2 rounded">
                               <div className="text-[8px] text-zinc-600 mb-0.5 tracking-widest uppercase">M2M Txns</div>
                               <div className="text-sm font-medium text-white">{agentLedger?.stats?.totalSettlements ?? 0} <span className="text-zinc-500 text-[9px] font-normal tracking-wide">settled</span></div>
                            </div>
                          </div>
                       </div>
                    </div>
                  )}
                  <Button onClick={requestUnlock} disabled={loading || (actorType === "user" && !walletReady)} className="w-full h-12 bg-yellow-400 text-black hover:bg-yellow-500 font-bold uppercase tracking-widest text-xs relative overflow-hidden group">
                    <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <ShieldCheck className="w-4 h-4 mr-2"/>}
                    {loading ? "Decrypting Payload..." : "Unlock Intelligence Brief"}
                  </Button>
                  
                  {loading && (
                    <div className="mt-8 space-y-4 animate-pulse opacity-40 pb-8 transition-opacity duration-1000">
                       <div className="flex items-center gap-3 mb-6">
                          <Cpu className="w-5 h-5 text-emerald-500" />
                          <div className="h-4 bg-emerald-500/20 rounded w-1/3"></div>
                       </div>
                       <div className="h-32 bg-zinc-800/40 rounded-xl border border-zinc-800/50"></div>
                       <div className="flex gap-4 mt-4">
                         <div className="h-24 bg-zinc-800/40 rounded-xl flex-1 border border-zinc-800/50"></div>
                         <div className="h-24 bg-zinc-800/40 rounded-xl flex-1 border border-zinc-800/50"></div>
                       </div>
                       <div className="h-4 bg-zinc-800/40 rounded w-1/4 mt-8"></div>
                       <div className="h-16 bg-zinc-800/40 rounded-xl border border-zinc-800/50"></div>
                    </div>
                  )}
                </div>
              )}

              {error && <div className="p-3 rounded bg-red-900/20 border border-red-900/50 text-red-500 text-[10px] font-mono whitespace-pre-wrap">{error}</div>}

              {walletNetwork && typeof walletNetwork === 'string' && walletNetwork.toUpperCase() !== "TESTNET" && (
                 <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/50 text-amber-500 text-[10px] font-mono flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <div>
                       <div className="font-bold">NETWORK MISMATCH DETECTED</div>
                       <div className="text-[9px] opacity-80">Freighter is set to {walletNetwork}. Change to TESTNET in wallet settings to enable x402 settlement.</div>
                    </div>
                 </div>
               )}

               {((actorType === "user" && userAnalysis) || (actorType === "agent" && agentAnalysis)) && (() => {
                  const currentAnalysis = actorType === "user" ? userAnalysis : agentAnalysis;
                  const currentReceipt = actorType === "user" ? userReceipt : agentReceipt;
                  const isAgentView = actorType === "agent";
                  if (!currentAnalysis) return null;

                  return (
                <div className="space-y-6 animate-in fade-in duration-500">

                    {/* Agent State Overlay */}
                    {isAgentView && currentAnalysis.intelligenceDossier && (
                      <div className="space-y-4 mb-6">
                        <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono flex divide-x divide-zinc-800">
                           <div className="px-3 flex-1">
                             <div className="text-zinc-600 mb-1">STATE MODE</div>
                             <div className="text-emerald-400 font-bold flex items-center gap-2">
                               <div className="relative flex items-center justify-center">
                                 <span className="w-2 h-2 rounded-full bg-emerald-500/40 animate-ping absolute" />
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative" />
                               </div>
                               {currentAnalysis.intelligenceDossier.agentState?.mode ?? "Monitoring"}
                             </div>
                           </div>
                           <div className="px-3 flex-1">
                             <div className="text-zinc-600 mb-1">FOCUS VECTOR</div>
                             <div className="text-zinc-300 truncate">{currentAnalysis.intelligenceDossier.agentState?.focus ?? "Aggregate"}</div>
                           </div>
                           <div className="px-3 flex-1">
                             <div className="text-zinc-600 mb-1">CONFIDENCE STRUCTURE</div>
                             <div className="text-zinc-300 truncate">{currentAnalysis.intelligenceDossier.agentState?.confidenceStructure ?? "Fragmented"}</div>
                           </div>
                        </div>

                        {currentAnalysis.intelligenceDossier.reasoningTrace && (
                          <div className="p-3 rounded-none bg-black border-l-2 border-emerald-500/50 space-y-1.5 font-mono">
                            <div className="text-[9px] text-emerald-500/80 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                               <Cpu className="w-3 h-3"/> Agent Reasoning Trace (Limited View)
                            </div>
                            {currentAnalysis.intelligenceDossier.reasoningTrace.map((trace, i) => (
                              <div key={i} className="text-[11px] text-zinc-500 flex items-start gap-2 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 400}ms`, animationFillMode: 'both' }}>
                                <span className="text-zinc-800">{'>'}</span> {trace}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Agent-exclusive directive banner */}
                        {currentAnalysis.intelligenceDossier.agentDirective && (
                          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
                            <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <div className="text-[9px] uppercase tracking-[0.15em] text-emerald-500 font-mono font-bold">Agent Directive</div>
                              <div className="text-xs text-emerald-300 font-mono mt-0.5">{currentAnalysis.intelligenceDossier.agentDirective}</div>
                            </div>
                            {currentAnalysis.intelligenceDossier.signalStrength != null && (
                              <div className="ml-auto text-right shrink-0">
                                <div className="text-[8px] uppercase tracking-widest text-zinc-600 font-mono">Signal</div>
                                <div className={cn(
                                  "text-sm font-bold font-mono",
                                  currentAnalysis.intelligenceDossier.signalStrength > 70 ? "text-emerald-400" : currentAnalysis.intelligenceDossier.signalStrength > 40 ? "text-[oklch(0.78_0.16_82)]" : "text-rose-400"
                                )}>{currentAnalysis.intelligenceDossier.signalStrength}/100</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}                     <Tabs defaultValue="overview" className="w-full relative">
                       <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md pt-2 pb-4 border-b border-zinc-800/50 mb-6">
                         <TabsList className={cn(
                           "w-full bg-black/60 border border-zinc-800 p-1 grid shadow-xl",
                           isAgentView ? "grid-cols-4" : "grid-cols-3"
                         )}>
                         <TabsTrigger value="overview" className="text-[10px] uppercase font-mono tracking-tighter data-[state=active]:bg-zinc-900 border-none transition-all">
                           {isAgentView ? "Process Stream" : "Overview"}
                         </TabsTrigger>
                         <TabsTrigger value="drivers" className="text-[10px] uppercase font-mono tracking-tighter data-[state=active]:bg-zinc-900 border-none transition-all">
                           {isAgentView ? "Signal Analysis" : "Drivers"}
                         </TabsTrigger>
                         <TabsTrigger value="risk" className="text-[10px] uppercase font-mono tracking-tighter data-[state=active]:bg-zinc-900 border-none transition-all">
                           {isAgentView ? "Risk Matrix" : "Risk"}
                         </TabsTrigger>
                         {isAgentView && (
                           <TabsTrigger value="neural" className="text-[10px] uppercase font-mono tracking-tighter data-[state=active]:bg-emerald-900/50 data-[state=active]:text-emerald-400 border-none transition-all">
                             Intelligence Dossier
                           </TabsTrigger>
                         )}
                         </TabsList>
                       </div>

                       <TabsContent value="overview" className="space-y-6 mt-0">
                          <section className="space-y-4">
                            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '0ms' }}>
                              <div className="text-[10px] text-zinc-500 uppercase font-mono mb-3">
                                {isAgentView ? "Event Initialization" : "Event Brief"}
                              </div>
                              <p className="text-xl font-medium text-white/95 leading-relaxed tracking-tight">{currentAnalysis.eventBrief}</p>
                            </div>
                            
                            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/10 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '150ms' }}>
                              <div className="text-[10px] text-zinc-500 uppercase font-mono mb-2">
                                {isAgentView ? "Signal Structure" : "Market Signal Interpretation"}
                              </div>
                              <p className="text-sm text-zinc-400 leading-relaxed">{currentAnalysis.marketSignalInterpretation}</p>
                            </div>

                            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/10 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '300ms' }}>
                              <div className="text-[10px] text-zinc-500 uppercase font-mono mb-2">
                                {isAgentView ? "Intelligence Gap" : "Information Asymmetry"}
                              </div>
                              <p className="text-sm text-zinc-400 leading-relaxed italic">{currentAnalysis.informationAsymmetry}</p>
                            </div>
                            
                            {isAgentView && currentAnalysis.intelligenceDossier && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '450ms' }}>
                                <div className="p-4 rounded-xl border border-zinc-800 bg-black/40">
                                  <SentimentPolarizer bias={currentAnalysis.intelligenceDossier.probabilityBias} />
                                </div>
                                <div className="p-4 rounded-xl border border-zinc-800 bg-black/40">
                                  <ConfidenceMeter score={currentAnalysis.intelligenceDossier.signalStrength ?? 0} />
                                </div>
                              </div>
                            )}
                          </section>
                       </TabsContent>

                       <TabsContent value="drivers" className="space-y-6 mt-0">
                          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '0ms' }}>
                             <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Global Context</div>
                             </div>
                              <p className="text-sm text-zinc-300 leading-relaxed">{currentAnalysis.globalContext}</p>
                          </div>

                          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '150ms' }}>
                            <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Structural Drivers</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {currentAnalysis.structuralDrivers?.map((item, i) => (
                                <div key={i} className="flex flex-col gap-3 bg-zinc-900/20 p-5 rounded-xl border border-zinc-800/50 hover:bg-zinc-900/50 hover:border-zinc-700 transition-colors shadow-sm">
                                  <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                                  <span className="text-sm text-zinc-300 leading-relaxed">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                       </TabsContent>

                       <TabsContent value="risk" className="space-y-6 mt-0">
                          <div className="p-5 rounded-xl border border-blue-500/30 bg-blue-500/10 shadow-lg shadow-blue-900/10 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '0ms' }}>
                             <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-blue-400" />
                                <div className="text-[10px] text-blue-400 uppercase font-mono tracking-widest font-bold">Strategic Insight</div>
                             </div>
                             <p className="text-sm text-zinc-200 leading-relaxed border-l-2 border-blue-500/50 pl-4 py-2 bg-black/20 rounded-r font-medium tracking-tight">{currentAnalysis.strategicInsight}</p>
                          </div>

                          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '150ms' }}>
                             <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest font-bold">Risk Landscape</div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {currentAnalysis.riskLandscape?.map((risk, i) => (
                                 <div key={i} className="p-5 rounded-xl bg-rose-950/20 border border-rose-900/30 text-sm text-rose-100/90 flex flex-col items-start gap-3 hover:bg-rose-950/30 hover:border-rose-900/50 transition-colors shadow-sm relative overflow-hidden">
                                   <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/30" />
                                   <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold tracking-widest text-rose-400/80">
                                      <AlertTriangle className="w-3 h-3" /> Risk Vector
                                   </div>
                                   <div className="leading-relaxed">{risk}</div>
                                 </div>
                               ))}
                             </div>
                          </div>

                          <div className="pt-2 text-center">
                            <span className="text-[10px] font-mono text-zinc-600 block border-t border-dashed border-zinc-800/50 pt-4 px-4 uppercase tracking-widest">
                              {currentAnalysis.terminalNote}
                            </span>
                          </div>
                       </TabsContent>

                       <TabsContent value="neural" className="space-y-6 mt-0">
                          {currentAnalysis.intelligenceDossier ? (
                            <div className="space-y-6">
                              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                                <div className="text-[10px] text-zinc-500 uppercase font-mono mb-3">Tactical Milestones</div>
                                <div className="space-y-3">
                                  {currentAnalysis.intelligenceDossier.tacticalMilestones?.map((milestone, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                      <div className="w-5 h-5 rounded border border-zinc-800 bg-black flex items-center justify-center text-[10px] font-mono text-zinc-500">{i+1}</div>
                                      <span className="text-xs text-zinc-400">{milestone}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                                 <div className="text-[10px] text-zinc-500 uppercase font-mono mb-3">Catalyst Chronology</div>
                                 <div className="space-y-4">
                                  {currentAnalysis.intelligenceDossier.catalystChronology?.map((cat, i) => (
                                    <div key={i} className="relative pl-6">
                                      <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full border border-zinc-700 bg-zinc-900" />
                                      {i < currentAnalysis.intelligenceDossier!.catalystChronology.length - 1 && (
                                        <div className="absolute left-[3.5px] top-[14px] w-[1px] h-[calc(100%-8px)] bg-zinc-800" />
                                      )}
                                      <p className="text-[11px] text-zinc-400 leading-none">{cat}</p>
                                    </div>
                                  ))}
                                 </div>
                              </div>
                              
                              <div className="pt-4 border-t border-zinc-800/50">
                                <div className="flex justify-between items-center mb-2">
                                   <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest font-bold">Proof of Intelligence (PoI)</div>
                                   <Badge variant="outline" className="text-[7px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5">SIA-POI-v3</Badge>
                                </div>
                                <div className="p-2 rounded bg-black/50 border border-zinc-800 font-mono text-[9px] text-emerald-500/80 break-all select-all">
                                  {currentAnalysis.intelligenceDossier.rawSignalHash}
                                </div>
                              </div>

                              {currentAnalysis.intelligenceDossier.agentMemory && (
                                <div className="pt-4 border-t border-zinc-800/50">
                                  <div className="text-[10px] text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 p-3 rounded uppercase font-mono">
                                    <div className="font-bold flex items-center gap-2 mb-3">
                                      <Bot className="w-3 h-3" /> Agent Memory Snapshot
                                    </div>
                                    <div className="mb-2 text-[9px] text-zinc-500">PREVIOUS PATTERNS DETECTED:</div>
                                    <ul className="list-disc list-inside space-y-1 mb-3 text-zinc-400 text-xs normal-case">
                                      {currentAnalysis.intelligenceDossier.agentMemory.previousPatternsDetected.map((pat, i) => (
                                        <li key={i}>{pat}</li>
                                      ))}
                                    </ul>
                                    <div className="text-[9px] text-zinc-500 mb-1">STRUCTURAL DEVIATION:</div>
                                    <div className="text-zinc-300 text-xs normal-case italic border-l-2 border-emerald-500/30 pl-2">
                                      {currentAnalysis.intelligenceDossier.agentMemory.structuralDeviation}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/10 text-center space-y-4">
                               <Cpu className="w-8 h-8 text-zinc-800 mx-auto" />
                               <div className="text-zinc-600 font-mono text-xs uppercase tracking-widest">Neural Layer Restricted</div>
                               <p className="text-[10px] text-zinc-700 max-w-[200px] mx-auto uppercase">The target actor type does not meet the entropy threshold for deep neural dossier access.</p>
                            </div>
                          )}
                       </TabsContent>
                    </Tabs>
                    
                    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 animate-in fade-in slide-in-from-bottom-2 duration-700">
                       <div className="text-[10px] text-zinc-500 uppercase font-mono mb-4">
                         {isAgentView ? "Strategic Interpretation Layer" : "Strategic Execution Path"}
                       </div>
                       {!bridgeQuote ? (
                         <Button onClick={handleFetchBridgeQuote} disabled={bridgeLoading} variant="ghost" className="w-full h-10 text-[10px] border border-zinc-800 hover:bg-zinc-800">
                           {bridgeLoading ? "Calculating..." : "Map Cross-Chain Settlement Path"}
                         </Button>
                       ) : (
                         <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 border border-zinc-800 rounded bg-black/40">
                               <div className="text-[8px] text-zinc-600 uppercase">Fee</div>
                               <div className="text-xs text-white">${bridgeQuote.fee ?? "0.15"}</div>
                            </div>
                            <div className="p-2 border border-zinc-800 rounded bg-black/40">
                               <div className="text-[8px] text-zinc-600 uppercase">Yield</div>
                               <div className="text-xs text-blue-400">{(Number(market.volume)/500).toFixed(1)}x</div>
                            </div>
                            <div className="p-2 border border-zinc-800 rounded bg-black/40">
                               <div className="text-[8px] text-zinc-600 uppercase">Time</div>
                               <div className="text-xs text-white">~2m</div>
                            </div>
                         </div>
                       )}
                    </div>

                    {currentReceipt && (
                      <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-400/5 mt-4">
                         <div className="text-[10px] text-yellow-500 uppercase font-mono mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3"/> Settlement Receipt
                         </div>
                         <div className="space-y-1 text-[10px] font-mono">
                            <div className="flex justify-between">
                               <span className="text-zinc-500">TX HASH:</span>
                               <a 
                                 href={`https://stellar.expert/explorer/testnet/tx/${currentReceipt.txHash}`} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="text-blue-400 hover:text-blue-300 transition-colors"
                               >
                                 {currentReceipt.txHash.slice(0, 8)}...{currentReceipt.txHash.slice(-8)}
                               </a>
                            </div>
                            <div className="flex justify-between">
                               <span className="text-zinc-500">PAYER:</span>
                               <span className="text-zinc-300">{currentReceipt.payer === agentStatus?.address ? "Agent Treasury" : `${currentReceipt.payer?.slice(0,6)}...${currentReceipt.payer?.slice(-6)}`}</span>
                            </div>
                            <div className="flex justify-between">
                               <span className="text-zinc-500">RAIL:</span>
                               <span className="text-zinc-300">Stellar x402 (v2)</span>
                            </div>
                            <div className="flex justify-between">
                               <span className="text-zinc-500">AMOUNT:</span>
                               <span className="text-zinc-300">{currentReceipt.amountUsd} USDC</span>
                            </div>
                         </div>
                      </div>
                    )}
                </div>
              );
            })()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
