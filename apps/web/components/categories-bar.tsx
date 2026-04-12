"use client"

import { useEffect, useMemo, useState } from "react"
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
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

type CategoryItem = {
  id: string
  label: string
  icon: LucideIcon
  count?: number
}

const polymarketCategories: CategoryItem[] = [
  { id: "all", label: "All", icon: Flame },
  { id: "Politics", label: "Politics", icon: Landmark },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "Crypto", label: "Crypto", icon: Coins },
  { id: "Iran", label: "Iran", icon: Globe },
  { id: "Finance", label: "Finance", icon: BarChart2 },
  { id: "Geopolitics", label: "Geopolitics", icon: Globe },
  { id: "Tech", label: "Tech", icon: Cpu },
  { id: "Culture", label: "Culture", icon: Sparkles },
  { id: "Economy", label: "Economy", icon: BarChart2 },
  { id: "Weather & Science", label: "Weather & Science", icon: CloudLightning },
  { id: "Health", label: "Health", icon: Microscope },
  { id: "Breaking News", label: "Breaking News", icon: Flame },
  { id: "Mentions", label: "Mentions", icon: Microscope },
  { id: "Elections", label: "Elections", icon: Landmark },
]


interface CategoriesBarProps {
  selected: string
  onSelect: (id: string) => void
  sortBy: string
  onSortChange: (id: string) => void
}

type GammaTag = {
  id?: string | number
  slug?: string
  label?: string
  name?: string
  count?: number
}

export function CategoriesBar({
  selected,
  onSelect,
  sortBy: _sortBy,
  onSortChange: _onSortChange,
}: CategoriesBarProps) {
  // sort/filter UI removed
  const [tags, setTags] = useState<GammaTag[]>([])

  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await fetch(`${API_BASE}/gamma/tags`)
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data)) {
          setTags(data)
        }
      } catch {
        // ignore
      }
    }
    loadTags()
  }, [])

  const categories = useMemo(() => {
    if (!tags.length) return polymarketCategories
    const byLabel = new Map(
      tags.map((tag) => [
        (tag.label ?? tag.name ?? "").toLowerCase(),
        tag.count,
      ])
    )
    return polymarketCategories.map((cat) => ({
      ...cat,
      count: byLabel.get(cat.label.toLowerCase()),
    }))
  }, [tags])

  // sort/filter UI removed

  return (
    <div className="sticky top-16 z-40 bg-[oklch(0.11_0.012_260/0.92)] backdrop-blur-xl border-b border-[oklch(0.22_0.015_255)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {categories.map((cat) => {
              const isActive = selected === cat.id
              const Icon = cat.icon
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
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[oklch(0.78_0.16_82)]" : "text-[oklch(0.45_0.01_90)]")} />
                  {cat.label}
                  {typeof cat.count === "number" && (
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
                  )}
                </button>
              )
            })}
          </div>

        </div>

        {/* sort & filters removed */}
      </div>
    </div>
  )
}
