"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Wallet, AlertCircle } from "lucide-react";
import { ethers } from "ethers";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type PortfolioResponse = {
  address: string;
  positions?: any[];
  closedPositions?: any[];
  value?: any;
  trades?: any[];
};

export default function PortfolioPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setError("No wallet found. Install MetaMask or compatible wallet.");
        return;
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setWalletAddress(await signer.getAddress());
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Wallet connection failed");
    }
  };

  const loadPortfolio = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/portfolio/${walletAddress}`);
      if (!res.ok) throw new Error("Failed to load portfolio");
      const payload = (await res.json()) as PortfolioResponse;
      setData(payload);
    } catch (err: any) {
      setError(err.message ?? "Portfolio load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  const summary = useMemo(() => {
    const value = data?.value ?? {};
    return {
      total: value.total ?? value.usdc ?? value.balance ?? "—",
      unrealized: value.unrealized_pnl ?? value.pnl ?? "—",
      realized: value.realized_pnl ?? "—",
    };
  }, [data]);

  const getLabel = (pos: any) => {
    return pos?.market ?? pos?.question ?? pos?.event ?? pos?.condition_id ?? "Position";
  };

  const getStatus = (pos: any) => {
    if (pos?.settled || pos?.resolved) return "Settled";
    if (pos?.status) return String(pos.status);
    if (pos?.resolution) return "Resolved";
    return "Open";
  };

  const formatNumber = (value: any) => {
    if (value === undefined || value === null) return "—";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value);
    return numeric.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-10 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Portfolio</h1>
            <p className="text-sm text-muted-foreground mt-1">Positions, P/L, and settlement status</p>
          </div>
          <Button
            variant="secondary"
            onClick={loadPortfolio}
            className="gap-2"
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {loading ? "Refreshing" : "Refresh"}
          </Button>
        </div>

        {!walletAddress ? (
          <div className="surface-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.18_0.014_255)] border border-[oklch(0.22_0.015_255)] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connect your wallet to view positions.</p>
              <Button variant="secondary" onClick={connectWallet} className="mt-3">
                Connect Wallet
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="surface-card rounded-2xl p-6 flex items-center gap-3 text-[oklch(0.58_0.2_25)]">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : null}

        {data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <div className="surface-card rounded-2xl p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Value</div>
              <p className="text-2xl font-bold mt-2 text-foreground">{summary.total}</p>
              <p className="text-xs text-muted-foreground mt-2">Unrealized P/L {summary.unrealized}</p>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Open Positions</div>
              <p className="text-2xl font-bold mt-2 text-foreground">{data.positions?.length ?? 0}</p>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Closed Positions</div>
              <p className="text-2xl font-bold mt-2 text-foreground">{data.closedPositions?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Realized P/L {summary.realized}</p>
            </div>
          </div>
        ) : null}

        {data?.positions?.length ? (
          <div className="surface-card rounded-2xl p-6 mt-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Open Positions</h3>
            <div className="space-y-2 text-sm">
              {data.positions.map((pos, idx) => (
                <div key={`pos-${idx}`} className="grid grid-cols-5 gap-3 border-b border-[oklch(0.22_0.015_255)] pb-2 text-muted-foreground">
                  <span className="col-span-2 text-foreground">{getLabel(pos)}</span>
                  <span>{formatNumber(pos.size ?? pos.position_size)}</span>
                  <span>{formatNumber(pos.avg_entry_price ?? pos.entry_price)}</span>
                  <span className="text-right">{getStatus(pos)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {data?.closedPositions?.length ? (
          <div className="surface-card rounded-2xl p-6 mt-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Closed Positions</h3>
            <div className="space-y-2 text-sm">
              {data.closedPositions.map((pos, idx) => (
                <div key={`cpos-${idx}`} className="grid grid-cols-5 gap-3 border-b border-[oklch(0.22_0.015_255)] pb-2 text-muted-foreground">
                  <span className="col-span-2 text-foreground">{getLabel(pos)}</span>
                  <span>{formatNumber(pos.size ?? pos.position_size)}</span>
                  <span>{formatNumber(pos.exit_price ?? pos.avg_exit_price)}</span>
                  <span className="text-right">{getStatus(pos)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {data?.trades?.length ? (
          <div className="surface-card rounded-2xl p-6 mt-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Recent Trades</h3>
            <div className="space-y-2 text-sm">
              {data.trades.map((trade, idx) => (
                <div key={`trade-${idx}`} className="grid grid-cols-5 gap-3 border-b border-[oklch(0.22_0.015_255)] pb-2 text-muted-foreground">
                  <span className="col-span-2 text-foreground">{trade.market ?? trade.condition_id ?? "Trade"}</span>
                  <span>{trade.side ?? "—"}</span>
                  <span>{formatNumber(trade.price)}</span>
                  <span className="text-right">{formatNumber(trade.size ?? trade.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
