"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ethers } from "ethers";
import { ClobClient, OrderType, Side } from "@polymarket/clob-client";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  ArrowLeft,
  Info,
  TrendingUp,
  ShieldCheck,
  Clock,
  BarChart3,
  CandlestickChart,
  Layers,
  BookOpen,
} from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { TradingChart } from "@/components/charts/TradingChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const CLOB_HOST = "https://clob.polymarket.com";
const POLYGON_CHAIN_ID = 137;

interface MarketDetail {
  id: string;
  title: string;
  category: string;
  outcomes: string[];
  prices: number[];
  tokenIds: string[];
  image?: string;
  endsAt?: string;
  volume24h?: string;
  liquidity?: string;
}

type OrderTypeTab = "market" | "limit";

type SideTab = "buy" | "sell";

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [orderSize, setOrderSize] = useState("10");
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<SideTab>("buy");
  const [orderType, setOrderType] = useState<OrderTypeTab>("market");

  useEffect(() => {
    const load = async () => {
      if (!marketId) return;
      try {
        const res = await fetch(`${API_BASE}/gamma/markets?id=${marketId}`);
        const data = await res.json();
        const m = Array.isArray(data) ? data[0] : data;

        setMarket({
          id: m.id,
          title: m.question,
          category: m.category || "Markets",
          outcomes: m.outcomes || ["Yes", "No"],
          prices: Array.isArray(m.outcomePrices) ? m.outcomePrices.map(Number) : [],
          tokenIds: m.clobTokenIds || [],
          image: m.image || m.icon,
          endsAt: m.endDate ? new Date(m.endDate).toLocaleDateString() : "",
          volume24h: m.volume24h || "$--",
          liquidity: m.liquidity || "$--",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [marketId]);

  const handleSubmit = async (side: Side) => {
    if (!authenticated || !wallets[0]) return;
    try {
      setTradeStatus("Initializing...");
      const provider = await wallets[0].getEthereumProvider();
      const web3Provider = new ethers.BrowserProvider(provider);
      const signer = await web3Provider.getSigner();

      const tokenId = market?.tokenIds[selectedOutcome];
      if (!tokenId) throw new Error("Token ID mismatch");

      const client = new ClobClient(CLOB_HOST, POLYGON_CHAIN_ID, signer as any);
      const creds = await client.createOrDeriveApiKey();
      const authed = new ClobClient(CLOB_HOST, POLYGON_CHAIN_ID, signer as any, creds);

      await authed.createAndPostOrder(
        {
          tokenID: tokenId,
          price: market?.prices[selectedOutcome] ?? 0.5,
          side: side,
          size: Number(orderSize),
        },
        {},
        OrderType.GTC
      );

      setTradeStatus("Trade submitted");
    } catch (err: any) {
      setTradeStatus(`Error: ${err.message}`);
    }
  };

  if (loading || !market) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-[oklch(0.78_0.16_82)] border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const normalizedPrices = market.prices.length >= 2 ? market.prices : [0.5, 0.5];
  const chartTokenId = market.tokenIds?.[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-20">
        <div className="pt-6 pb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to markets
          </button>
        </div>

        {/* Header */}
        <div className="surface-card rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            {market.image ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)]">
                <img src={market.image} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)]" />
            )}
            <div className="flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{market.category}</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{market.title}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
            <div className="surface-card rounded-xl p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Yes price</div>
              <div className="text-lg font-bold text-foreground mt-1">{normalizedPrices[0].toFixed(2)}¢</div>
              <div className="text-xs text-[oklch(0.68_0.18_155)] flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +4.2%
              </div>
            </div>
            <div className="surface-card rounded-xl p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">24h change</div>
              <div className="text-lg font-bold text-foreground mt-1">+4.2%</div>
            </div>
            <div className="surface-card rounded-xl p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Liquidity</div>
              <div className="text-lg font-bold text-foreground mt-1">{market.liquidity}</div>
            </div>
            <div className="surface-card rounded-xl p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Volume</div>
              <div className="text-lg font-bold text-foreground mt-1">{market.volume24h}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart */}
          <div className="lg:col-span-8 space-y-6">
            <div className="surface-card rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Market chart</div>
                  <div className="text-lg font-semibold text-foreground mt-1">{normalizedPrices[0].toFixed(2)}¢</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[oklch(0.22_0.04_82)] text-[oklch(0.78_0.16_82)] border border-[oklch(0.78_0.16_82/0.4)]">
                    <CandlestickChart className="w-3.5 h-3.5" /> Candles
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[oklch(0.16_0.014_255)] text-muted-foreground border border-[oklch(0.22_0.015_255)]">
                    <Layers className="w-3.5 h-3.5" /> Depth
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[oklch(0.16_0.014_255)] text-muted-foreground border border-[oklch(0.22_0.015_255)]">
                    <BookOpen className="w-3.5 h-3.5" /> Book
                  </button>
                </div>
              </div>

              <div className="mt-4 h-[360px]">
                {chartTokenId ? (
                  <TradingChart tokenId={chartTokenId} height={360} />
                ) : (
                  <div className="h-full w-full rounded-xl bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] flex items-center justify-center text-xs text-muted-foreground">
                    Chart unavailable
                  </div>
                )}
              </div>
            </div>

            <div className="surface-card rounded-2xl p-6">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Market information</div>
              <p className="text-sm text-muted-foreground mt-2">
                This market resolves to "Yes" if the target event occurs before the resolution date. Trading is executed
                atomically on the Polygon network via shared order books.
              </p>
            </div>
          </div>

          {/* Trade Panel */}
          <div className="lg:col-span-4">
            <div className="surface-card rounded-2xl p-6 sticky top-24 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest">Trade</h3>
                <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.68_0.18_155)]" /> Live
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedOutcome(0)}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    selectedOutcome === 0
                      ? "bg-[oklch(0.68_0.18_155/0.12)] border-[oklch(0.68_0.18_155/0.5)] text-[oklch(0.68_0.18_155)]"
                      : "bg-[oklch(0.16_0.014_255)] border-[oklch(0.22_0.015_255)] text-muted-foreground"
                  )}
                >
                  <span className="text-[10px] font-bold block mb-1">YES</span>
                  <span className="text-xl font-bold">{normalizedPrices[0].toFixed(2)}¢</span>
                </button>
                <button
                  onClick={() => setSelectedOutcome(1)}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    selectedOutcome === 1
                      ? "bg-[oklch(0.58_0.2_25/0.12)] border-[oklch(0.58_0.2_25/0.5)] text-[oklch(0.58_0.2_25)]"
                      : "bg-[oklch(0.16_0.014_255)] border-[oklch(0.22_0.015_255)] text-muted-foreground"
                  )}
                >
                  <span className="text-[10px] font-bold block mb-1">NO</span>
                  <span className="text-xl font-bold">{normalizedPrices[1].toFixed(2)}¢</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSideTab("buy")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-semibold border",
                    sideTab === "buy"
                      ? "bg-[oklch(0.22_0.04_82)] text-[oklch(0.78_0.16_82)] border-[oklch(0.78_0.16_82/0.4)]"
                      : "bg-[oklch(0.16_0.014_255)] text-muted-foreground border-[oklch(0.22_0.015_255)]"
                  )}
                >
                  Buy
                </button>
                <button
                  onClick={() => setSideTab("sell")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-semibold border",
                    sideTab === "sell"
                      ? "bg-[oklch(0.22_0.04_82)] text-[oklch(0.78_0.16_82)] border-[oklch(0.78_0.16_82/0.4)]"
                      : "bg-[oklch(0.16_0.014_255)] text-muted-foreground border-[oklch(0.22_0.015_255)]"
                  )}
                >
                  Sell
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrderType("market")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-semibold border",
                    orderType === "market"
                      ? "bg-[oklch(0.18_0.014_255)] text-foreground border-[oklch(0.28_0.018_255)]"
                      : "bg-[oklch(0.16_0.014_255)] text-muted-foreground border-[oklch(0.22_0.015_255)]"
                  )}
                >
                  Market
                </button>
                <button
                  onClick={() => setOrderType("limit")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-semibold border",
                    orderType === "limit"
                      ? "bg-[oklch(0.18_0.014_255)] text-foreground border-[oklch(0.28_0.018_255)]"
                      : "bg-[oklch(0.16_0.014_255)] text-muted-foreground border-[oklch(0.22_0.015_255)]"
                  )}
                >
                  Limit
                </button>
              </div>

              <Input
                label="Amount (USDC)"
                placeholder="10"
                value={orderSize}
                onChange={(e) => setOrderSize(e.target.value)}
              />

              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setOrderSize(String(amt))}
                    className="py-2 rounded-lg text-xs font-semibold bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] text-muted-foreground hover:text-foreground"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full h-11"
                  onClick={() => handleSubmit(sideTab === "buy" ? Side.BUY : Side.SELL)}
                  disabled={tradeStatus?.includes("...")}
                >
                  {sideTab === "buy" ? "Buy" : "Sell"} Position
                </Button>
              </div>

              {tradeStatus && (
                <div className="p-3 bg-[oklch(0.16_0.014_255)] rounded-lg border border-[oklch(0.22_0.015_255)] flex items-center gap-3">
                  <Info size={14} className="text-[oklch(0.78_0.16_82)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {tradeStatus}
                  </span>
                </div>
              )}

              <footer className="pt-2 border-t border-[oklch(0.22_0.015_255)] space-y-2 text-[10px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Brokerage Fee</span>
                  <span className="text-foreground">0.00%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Network Fee</span>
                  <span className="text-foreground">Gasless (Relayed)</span>
                </div>
                <div className="p-3 bg-[oklch(0.22_0.04_82/0.2)] rounded-lg border border-[oklch(0.22_0.04_82/0.4)]">
                  <p className="text-[10px] text-[oklch(0.78_0.16_82)] font-medium leading-relaxed">
                    Orders are matched against existing liquidity on the Polymarket CLOB.
                  </p>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
