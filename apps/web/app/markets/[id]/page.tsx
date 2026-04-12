"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, ShieldCheck, TrendingUp } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { TradingChart } from "@/components/charts/TradingChart";
import { Button } from "@/components/ui/button";
import { AnalysisUnlockModal } from "@/components/analysis-unlock-modal";
import type { PolymarketMarket } from "@/lib/polymarket";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

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
  description?: string;
}

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisOpen, setAnalysisOpen] = useState(false);

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
          description: m.description,
          category: m.category || "Events",
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

  const normalizedPrices = useMemo(() => (market?.prices?.length ?? 0) >= 2 ? market!.prices : [0.5, 0.5], [market]);
  const chartTokenId = market?.tokenIds?.[0];

  const analysisMarket: PolymarketMarket | null = market
    ? {
        id: market.id,
        question: market.title,
        category: market.category,
        description: market.description,
        volume: market.volume24h ?? "$--",
        liquidity: market.liquidity ?? "$--",
        endDate: market.endsAt ?? "",
        image: market.image,
        icon: market.image,
        outcomes: [
          { name: market.outcomes?.[0] ?? "Yes", price: (normalizedPrices[0] ?? 0.5) * 100 },
          { name: market.outcomes?.[1] ?? "No", price: (normalizedPrices[1] ?? 0.5) * 100 },
        ],
        tokenIds: market.tokenIds,
        active: true,
        new: false,
        featured: false,
        slug: market.id,
      }
    : null;

  if (loading || !market) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-[oklch(0.78_0.16_82)] border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-20">
        <div className="pt-6 pb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to events
          </button>
        </div>

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
                <TrendingUp className="w-3 h-3" /> Live consensus
              </div>
            </div>
            <div className="surface-card rounded-xl p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">24h change</div>
              <div className="text-lg font-bold text-foreground mt-1">Live</div>
            </div>
            <div className="surface-card rounded-xl p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Liquidity</div>
              <div className="text-lg font-bold text-foreground mt-1">{market.liquidity}</div>
            </div>
            <div className="surface-card rounded-xl p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Closes</div>
              <div className="text-lg font-bold text-foreground mt-1">{market.endsAt || "—"}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="surface-card rounded-2xl p-6">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Event chart</div>
              <div className="text-lg font-semibold text-foreground mt-1">{normalizedPrices[0].toFixed(2)}¢</div>

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
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Event information</div>
              <p className="text-sm text-muted-foreground mt-2">
                Analysis-only mode: we surface live event context and probability signals, then unlock structured AI analysis after x402 payment.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="surface-card rounded-2xl p-6 sticky top-24 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest">Analysis</h3>
                <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.68_0.18_155)]" /> x402
                </div>
              </div>

              <div className="rounded-xl border border-[oklch(0.22_0.015_255)] bg-[oklch(0.16_0.014_255)] p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">No order execution here.</p>
                <p className="text-xs text-muted-foreground">
                  This page is optimized for paid event intelligence only.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Unlock in seconds after payment verification
                </div>
              </div>

              <Button className="w-full h-11 gap-2" onClick={() => setAnalysisOpen(true)}>
                <ShieldCheck className="w-4 h-4" />
                Unlock Detailed Analysis
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <AnalysisUnlockModal open={analysisOpen} market={analysisMarket} onOpenChange={setAnalysisOpen} />
    </div>
  );
}
