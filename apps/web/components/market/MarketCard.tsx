"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Volume2, Calendar, Activity } from "lucide-react";
import { PriceChart } from "@/components/charts/PriceChart";

interface MarketCardProps {
    id: string;
    title: string;
    category: string;
    yesPrice: number;
    volume: string;
    endsAt: string;
    image?: string;
    onClick: () => void;
    onYes?: () => void;
    onNo?: () => void;
}

// Mock sparkline data - in a real app this would come from the API
const MOCK_TREND = [
    { time: "1", price: 0.45 },
    { time: "2", price: 0.47 },
    { time: "3", price: 0.46 },
    { time: "4", price: 0.48 },
    { time: "5", price: 0.52 },
    { time: "6", price: 0.51 },
    { time: "7", price: 0.54 },
];

export const MarketCard = ({
    title,
    category,
    yesPrice,
    volume,
    endsAt,
    image,
    onClick,
    onYes,
    onNo
}: MarketCardProps) => {
    const pct = Math.round(yesPrice * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
            className="cursor-pointer h-full"
        >
            <Card className="p-5 h-full flex flex-col gap-4 overflow-hidden relative group">
                {/* Subtle trend line in the background */}
                <div className="absolute top-0 right-0 left-0 h-24 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                    <PriceChart data={MOCK_TREND} color={pct > 50 ? "#10b981" : "#6366f1"} height={96} />
                </div>

                <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Badge variant="neutral" className="bg-white/5 text-ink-secondary border-white/10 group-hover:border-accent-primary/30 transition-colors">
                                {category}
                            </Badge>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-success uppercase tracking-tighter">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                Live
                            </div>
                        </div>
                        <h3 className="text-sm font-semibold leading-relaxed line-clamp-2 text-ink-primary group-hover:text-accent-primary transition-colors">
                            {title}
                        </h3>
                    </div>
                    {image && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-border-strong bg-bg-surface flex-shrink-0 relative group-hover:border-accent-primary/50 transition-colors">
                            <img src={image} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 flex flex-col gap-4 border-t border-white/[0.04]">
                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Odds</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold font-outfit text-white">{pct}%</span>
                                <span className="text-[10px] font-medium text-success">
                                    <TrendingUp size={10} className="inline mr-0.5" />
                                    +2.4%
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Volume</span>
                            <span className="text-xs font-mono font-medium text-ink-primary">{volume}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            size="sm"
                            className="w-full bg-success/10 text-success border-success/20 hover:bg-success hover:text-white shadow-none"
                            onClick={(event) => {
                                event.stopPropagation();
                                onYes?.();
                            }}
                        >
                            Yes
                        </Button>
                        <Button
                            size="sm"
                            className="w-full bg-error/10 text-error border-error/20 hover:bg-error hover:text-white shadow-none"
                            onClick={(event) => {
                                event.stopPropagation();
                                onNo?.();
                            }}
                        >
                            No
                        </Button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-ink-muted font-medium">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>Ends {endsAt}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Volume2 size={12} />
                            <span>Polymarket</span>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
