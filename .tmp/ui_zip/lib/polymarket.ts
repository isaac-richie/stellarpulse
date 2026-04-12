// Polymarket Gamma API integration
// Docs: https://docs.polymarket.com

export interface PolymarketMarket {
  id: string
  question: string
  description?: string
  image?: string
  icon?: string
  category?: string
  volume: string
  liquidity: string
  endDate: string
  outcomes: PolymarketOutcome[]
  active: boolean
  new: boolean
  featured: boolean
  slug: string
  conditionId?: string
  tags?: string[]
  createdAt?: string
}

export interface PolymarketOutcome {
  name: string
  price: number
}

export interface GammaMarketRaw {
  id: string
  question: string
  description?: string
  image?: string
  icon?: string
  category?: string
  volume: number | string
  liquidity: number | string
  endDate?: string
  end_date_iso?: string
  closed?: boolean
  active?: boolean
  new?: boolean
  featured?: boolean
  slug?: string
  conditionId?: string
  tokens?: { outcome: string; price: number }[]
  tags?: { id: string; label: string; slug: string }[]
  createdAt?: string
  startDate?: string
}

const GAMMA_API = "https://gamma-api.polymarket.com"

function formatVolume(v: number | string): string {
  const n = typeof v === "string" ? parseFloat(v) : v
  if (isNaN(n)) return "$0"
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function parseOutcomes(raw: GammaMarketRaw): PolymarketOutcome[] {
  if (raw.tokens && raw.tokens.length > 0) {
    return raw.tokens.map((t) => ({
      name: t.outcome,
      price: parseFloat((t.price * 100).toFixed(1)),
    }))
  }
  // Fallback binary
  return [
    { name: "Yes", price: 50 },
    { name: "No", price: 50 },
  ]
}

export async function fetchPolymarketMarkets(
  category?: string,
  limit = 24,
  sortBy = "volume"
): Promise<PolymarketMarket[]> {
  try {
    const params = new URLSearchParams({
      active: "true",
      closed: "false",
      limit: limit.toString(),
      order: sortBy === "newest" ? "createdAt" : sortBy === "ending" ? "endDate" : "volume",
      ascending: sortBy === "newest" ? "false" : sortBy === "ending" ? "true" : "false",
    })

    if (category && category !== "all") {
      // Map UI category IDs to Polymarket category names
      const categoryMap: Record<string, string> = {
        politics: "Politics",
        crypto: "Crypto",
        tech: "Science & Tech",
        sports: "Sports",
        world: "World",
        climate: "Climate",
        science: "Science",
        finance: "Business & Finance",
      }
      const mapped = categoryMap[category]
      if (mapped) params.set("tag", mapped)
    }

    const res = await fetch(`${GAMMA_API}/markets?${params.toString()}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    })

    if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`)

    const data: GammaMarketRaw[] = await res.json()

    return data.slice(0, limit).map((m) => ({
      id: m.id,
      question: m.question,
      description: m.description,
      image: m.image,
      icon: m.icon,
      category: m.category ?? m.tags?.[0]?.label ?? "General",
      volume: formatVolume(m.volume),
      liquidity: formatVolume(m.liquidity),
      endDate: m.endDate ?? m.end_date_iso ?? "",
      outcomes: parseOutcomes(m),
      active: m.active ?? !m.closed,
      new: m.new ?? false,
      featured: m.featured ?? false,
      slug: m.slug ?? m.id,
      conditionId: m.conditionId,
      tags: m.tags?.map((t) => t.label) ?? [],
      createdAt: m.createdAt ?? m.startDate,
    }))
  } catch (err) {
    console.error("[v0] Polymarket fetch error:", err)
    return getMockMarkets()
  }
}

// Fallback mock data for when API is unavailable
function getMockMarkets(): PolymarketMarket[] {
  return [
    {
      id: "1",
      question: "Will Bitcoin exceed $150,000 before end of 2025?",
      category: "Crypto",
      volume: "$28.4M",
      liquidity: "$3.2M",
      endDate: "2025-12-31",
      outcomes: [{ name: "Yes", price: 67 }, { name: "No", price: 33 }],
      active: true, new: false, featured: true, slug: "btc-150k-2025",
      tags: ["Bitcoin", "Crypto"],
    },
    {
      id: "2",
      question: "Will the Federal Reserve cut rates in Q1 2025?",
      category: "Finance",
      volume: "$12.7M",
      liquidity: "$1.8M",
      endDate: "2025-03-31",
      outcomes: [{ name: "Yes", price: 38 }, { name: "No", price: 62 }],
      active: true, new: false, featured: false, slug: "fed-rate-cut-q1-2025",
      tags: ["Finance", "Fed"],
    },
    {
      id: "3",
      question: "Will SpaceX Starship complete an orbital flight in 2025?",
      category: "Technology",
      volume: "$4.1M",
      liquidity: "$890K",
      endDate: "2025-06-30",
      outcomes: [{ name: "Yes", price: 82 }, { name: "No", price: 18 }],
      active: true, new: true, featured: false, slug: "starship-orbital-2025",
      tags: ["Science", "SpaceX"],
    },
    {
      id: "4",
      question: "Will Ethereum ETF approve spot trading by mid-2025?",
      category: "Crypto",
      volume: "$19.3M",
      liquidity: "$4.5M",
      endDate: "2025-06-30",
      outcomes: [{ name: "Yes", price: 91 }, { name: "No", price: 9 }],
      active: true, new: false, featured: true, slug: "eth-spot-etf-2025",
      tags: ["Ethereum", "ETF"],
    },
    {
      id: "5",
      question: "Will the 2026 FIFA World Cup have 48 teams?",
      category: "Sports",
      volume: "$2.8M",
      liquidity: "$340K",
      endDate: "2026-06-01",
      outcomes: [{ name: "Yes", price: 97 }, { name: "No", price: 3 }],
      active: true, new: false, featured: false, slug: "fifa-wc-2026-48-teams",
      tags: ["Sports", "FIFA"],
    },
    {
      id: "6",
      question: "Will AI achieve AGI milestone before 2026?",
      category: "Technology",
      volume: "$6.9M",
      liquidity: "$1.1M",
      endDate: "2025-12-31",
      outcomes: [{ name: "Yes", price: 22 }, { name: "No", price: 78 }],
      active: true, new: true, featured: true, slug: "agi-2026",
      tags: ["AI", "Science"],
    },
    {
      id: "7",
      question: "Will BNB Chain surpass Ethereum in total DEX volume in 2025?",
      category: "Crypto",
      volume: "$8.4M",
      liquidity: "$920K",
      endDate: "2025-12-31",
      outcomes: [{ name: "Yes", price: 31 }, { name: "No", price: 69 }],
      active: true, new: true, featured: false, slug: "bnb-surpass-eth-dex-2025",
      tags: ["BNB", "DeFi"],
    },
    {
      id: "8",
      question: "Will global temperature rise exceed 1.5°C by 2025 annual average?",
      category: "Climate",
      volume: "$1.7M",
      liquidity: "$280K",
      endDate: "2026-01-15",
      outcomes: [{ name: "Yes", price: 74 }, { name: "No", price: 26 }],
      active: true, new: false, featured: false, slug: "temp-1-5c-2025",
      tags: ["Climate"],
    },
    {
      id: "9",
      question: "Will Kamala Harris run for President in 2028?",
      category: "Politics",
      volume: "$5.2M",
      liquidity: "$710K",
      endDate: "2027-12-31",
      outcomes: [{ name: "Yes", price: 48 }, { name: "No", price: 52 }],
      active: true, new: false, featured: false, slug: "harris-2028-run",
      tags: ["Politics", "US Election"],
    },
    {
      id: "10",
      question: "Will the NBA introduce a 4-point line by 2026?",
      category: "Sports",
      volume: "$980K",
      liquidity: "$120K",
      endDate: "2026-09-01",
      outcomes: [{ name: "Yes", price: 14 }, { name: "No", price: 86 }],
      active: true, new: true, featured: false, slug: "nba-4pt-line-2026",
      tags: ["Sports", "NBA"],
    },
    {
      id: "11",
      question: "Will Solana process 1M TPS mainnet by end of 2025?",
      category: "Crypto",
      volume: "$3.4M",
      liquidity: "$450K",
      endDate: "2025-12-31",
      outcomes: [{ name: "Yes", price: 19 }, { name: "No", price: 81 }],
      active: true, new: false, featured: false, slug: "solana-1m-tps-2025",
      tags: ["Solana", "Crypto"],
    },
    {
      id: "12",
      question: "Will GPT-5 release publicly before June 2025?",
      category: "Technology",
      volume: "$7.8M",
      liquidity: "$1.4M",
      endDate: "2025-06-01",
      outcomes: [{ name: "Yes", price: 56 }, { name: "No", price: 44 }],
      active: true, new: false, featured: true, slug: "gpt5-before-june-2025",
      tags: ["AI", "OpenAI"],
    },
  ]
}
