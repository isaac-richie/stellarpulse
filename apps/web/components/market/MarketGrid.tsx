"use client";

import React from "react";
import { MarketCard } from "./MarketCard";
import { Card } from "@/components/ui/card";

interface MarketGridProps {
    markets: any[];
    loading: boolean;
    onMarketSelect: (market: any) => void;
    onQuickYes?: (market: any) => void;
    onQuickNo?: (market: any) => void;
}

export const MarketGrid = ({ markets, loading, onMarketSelect, onQuickYes, onQuickNo }: MarketGridProps) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="h-[320px] bg-bg-elevated animate-pulse border-white/5" />
                ))}
            </div>
        );
    }

    if (markets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Activity size={24} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">No active markets found in this category.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {markets.map((market) => (
                <MarketCard
                    key={market.id}
                    id={market.id}
                    title={market.title}
                    category={market.category}
                    yesPrice={market.yes}
                    volume={market.volume}
                    endsAt={market.endsAt}
                    image={market.image}
                    onClick={() => onMarketSelect(market)}
                    onYes={() => onQuickYes?.(market)}
                    onNo={() => onQuickNo?.(market)}
                />
            ))}
        </div>
    );
};

const Activity = ({ size, className }: { size: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);
