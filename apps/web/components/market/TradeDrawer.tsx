"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, Wallet, History, Info, TrendingUp } from "lucide-react";

interface TradeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    market: {
        title: string;
        outcomes: string[];
        prices: number[];
    } | null;
    children: React.ReactNode;
}

export const TradeDrawer = ({ isOpen, onClose, market, children }: TradeDrawerProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-full max-w-md bg-bg-surface border-l border-white/5 z-[101] flex flex-col shadow-2xl"
                    >
                        <div className="p-6 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent-primary/10 rounded-lg text-accent-primary">
                                    <TrendingUp size={20} />
                                </div>
                                <h2 className="text-xl font-bold font-outfit">Trade Terminal</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors text-ink-muted hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {market && (
                                <div className="space-y-4">
                                    <header className="space-y-1">
                                        <Badge variant="neutral" className="mb-2">Prediction Event</Badge>
                                        <h3 className="text-lg font-bold leading-tight">{market.title}</h3>
                                    </header>

                                    <div className="grid grid-cols-2 gap-3">
                                        {market.outcomes.map((outcome, idx) => (
                                            <Card key={idx} variant="surface" hover={false} className="p-4 bg-bg-elevated/40 border-white/5">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted block mb-1">
                                                    {outcome}
                                                </span>
                                                <div className="text-xl font-bold font-outfit">
                                                    {Math.round((market.prices[idx] ?? 0.5) * 100)}%
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {children}
                            </div>
                        </div>

                        <div className="p-6 bg-bg-elevated/50 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-ink-muted">
                                    <Wallet size={14} />
                                    <span>Settlement: USDC</span>
                                </div>
                                <div className="flex items-center gap-2 text-accent-primary font-bold">
                                    <Info size={14} />
                                    <span>Polygon Mainnet</span>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};


