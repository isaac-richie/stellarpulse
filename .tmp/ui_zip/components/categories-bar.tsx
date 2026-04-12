"use client"

import { useState } from "react"
import {
  Globe,
  Landmark,
  Cpu,
  Coins,
  Flame,
  Trophy,
  CloudLightning,
  Microscope,
  BarChart2,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

export const categories = [
  { id: "all", label: "All Markets", icon: Flame, count: 3847 },
  { id: "politics", label: "Politics", icon: Landmark, count: 412 },
  { id: "crypto", label: "Crypto", icon: Coins, count: 893 },
  { id: "tech", label: "Technology", icon: Cpu, count: 267 },
  { id: "sports", label: "Sports", icon: Trophy, count: 1104 },
  { id: "world", label: "World Events", icon: Globe, count: 389 },
  { id: "climate", label: "Climate", icon: CloudLightning, count: 156 },
  { id: "science", label: "Science", icon: Microscope, count: 98 },
  { id: "finance", label: "Finance", icon: BarChart2, count: 528 },
]

const sortOptions = [
  { id: "volume", label: "Highest Volume" },
  { id: "liquidity", label: "Most Liquid" },
  { id: "newest", label: "Newest" },
  { id: "ending", label: "Ending Soon" },
  { id: "trending", label: "Trending" },
]

interface CategoriesBarProps {
  selected: string
  onSelect: (id: string) => void
  sortBy: string
  onSortChange: (id: string) => void
}

export function CategoriesBar({
  selected,
  onSelect,
  sortBy,
  onSortChange,
}: CategoriesBarProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const currentSort = sortOptions.find((s) => s.id === sortBy) ?? sortOptions[0]

  return (
    <div className="sticky top-16 z-40 bg-[oklch(0.11_0.012_260/0.92)] backdrop-blur-xl border-b border-[oklch(0.22_0.015_255)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-3 overflow-x-auto no-scrollbar">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {categories.map((cat) => {
              const isActive = selected === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border",
                    isActive
                      ? "bg-[oklch(0.22_0.04_82)] border-[oklch(0.78_0.16_82/0.5)] text-[oklch(0.78_0.16_82)] shadow-[0_0_12px_oklch(0.78_0.16_82/0.15)]"
                      : "bg-[oklch(0.16_0.014_255)] border-[oklch(0.22_0.015_255)] text-[oklch(0.55_0.01_90)] hover:border-[oklch(0.28_0.018_255)] hover:text-[oklch(0.75_0.01_90)]"
                  )}
                >
                  <cat.icon className={cn("w-3.5 h-3.5", isActive ? "text-[oklch(0.78_0.16_82)]" : "text-[oklch(0.45_0.01_90)]")} />
                  {cat.label}
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-md",
                      isActive
                        ? "bg-[oklch(0.78_0.16_82/0.2)] text-[oklch(0.78_0.16_82)]"
                        : "bg-[oklch(0.22_0.015_255)] text-[oklch(0.4_0.01_90)]"
                    )}
                  >
                    {cat.count.toLocaleString()}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="h-7 w-px bg-[oklch(0.22_0.015_255)] flex-shrink-0 hidden sm:block" />

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] text-[oklch(0.65_0.01_90)] text-xs font-medium hover:border-[oklch(0.78_0.16_82/0.35)] hover:text-foreground transition-all duration-200"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span className="hidden sm:inline">{currentSort.label}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", sortOpen && "rotate-180")} />
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] rounded-xl shadow-2xl overflow-hidden z-50">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { onSortChange(opt.id); setSortOpen(false) }}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors duration-150",
                        sortBy === opt.id
                          ? "bg-[oklch(0.22_0.04_82)] text-[oklch(0.78_0.16_82)]"
                          : "text-[oklch(0.65_0.01_90)] hover:bg-[oklch(0.2_0.014_255)] hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters */}
            <button
              onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200",
                filterOpen
                  ? "bg-[oklch(0.22_0.04_82)] border-[oklch(0.78_0.16_82/0.5)] text-[oklch(0.78_0.16_82)]"
                  : "bg-[oklch(0.16_0.014_255)] border-[oklch(0.22_0.015_255)] text-[oklch(0.65_0.01_90)] hover:border-[oklch(0.78_0.16_82/0.35)] hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="border-t border-[oklch(0.22_0.015_255)] py-3 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Min Volume:</span>
              {["$1K", "$10K", "$100K", "$1M"].map((v) => (
                <button
                  key={v}
                  className="px-2.5 py-1 rounded-md bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] text-[oklch(0.55_0.01_90)] hover:border-[oklch(0.78_0.16_82/0.4)] hover:text-foreground transition-all font-mono"
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Status:</span>
              {["Active", "Closing Soon", "Resolved"].map((s) => (
                <button
                  key={s}
                  className="px-2.5 py-1 rounded-md bg-[oklch(0.16_0.014_255)] border border-[oklch(0.22_0.015_255)] text-[oklch(0.55_0.01_90)] hover:border-[oklch(0.78_0.16_82/0.4)] hover:text-foreground transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
