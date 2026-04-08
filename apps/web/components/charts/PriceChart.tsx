"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface PriceChartProps {
    data: { time: string; price: number }[];
    color?: string;
    height?: number;
    showAxes?: boolean;
}

export const PriceChart = ({
    data,
    color = "#6366f1",
    height = 60,
    showAxes = false
}: PriceChartProps) => {
    return (
        <div style={{ width: "100%", height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    {showAxes && (
                        <>
                            <XAxis dataKey="time" hide />
                            <YAxis hide />
                        </>
                    )}
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-bg-surface border border-white/10 rounded px-2 py-1 text-[10px] shadow-xl">
                                        <div className="font-bold text-white">${payload[0].value}</div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
