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
  tokenIds?: string[]
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
  outcomes?: string[] | string
  outcomePrices?: number[] | string[]
  outcome_prices?: number[] | string[]
  clobTokenIds?: string[] | string
  clob_token_ids?: string[] | string
  createdAt?: string
  startDate?: string
}

export interface GammaEventRaw {
  id: string
  title: string
  description?: string
  image?: string
  icon?: string
  category?: string
  volume?: number | string
  liquidity?: number | string
  endDate?: string
  endDateIso?: string
  active?: boolean
  closed?: boolean
  new?: boolean
  featured?: boolean
  slug?: string
  tags?: { id: string; label: string; slug: string }[]
  markets?: GammaMarketRaw[]
  createdAt?: string
  startDate?: string
}

const GAMMA_API = "https://gamma-api.polymarket.com"
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

function formatVolume(v: number | string): string {
  const n = typeof v === "string" ? parseFloat(v) : v
  if (isNaN(n)) return "$0"
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function parseOutcomes(raw: GammaMarketRaw): PolymarketOutcome[] {
  const rawOutcomes = raw.outcomes
  const rawPrices = raw.outcomePrices ?? raw.outcome_prices
  try {
    const outcomes = Array.isArray(rawOutcomes) ? rawOutcomes : rawOutcomes ? JSON.parse(rawOutcomes) : null
    const prices = Array.isArray(rawPrices) ? rawPrices : rawPrices ? JSON.parse(rawPrices as any) : null
    if (outcomes && prices && outcomes.length === prices.length) {
      return outcomes.map((name: string, idx: number) => ({
        name,
        price: parseFloat((Number(prices[idx]) * 100).toFixed(1)),
      }))
    }
  } catch {
    // fall through to tokens
  }
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

function parseTokenIds(raw: GammaMarketRaw): string[] {
  const rawIds = raw.clobTokenIds ?? raw.clob_token_ids
  if (!rawIds) return []
  if (Array.isArray(rawIds)) return rawIds.map(String)
  try {
    const parsed = JSON.parse(rawIds)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export async function fetchPolymarketMarkets(
  category?: string,
  limit = 24,
  sortBy = "volume",
  offset = 0,
  search?: string
): Promise<PolymarketMarket[]> {
  try {
    const params = new URLSearchParams({
      active: "true",
      closed: "false",
      limit: Math.max(limit * 4, 48).toString(),
      offset: Math.max(offset * 4, 0).toString(),
      order:
        sortBy === "newest"
          ? "createdAt"
          : sortBy === "ending"
          ? "endDate"
          : sortBy === "trending"
          ? "volume_24hr"
          : "volume_24hr",
      ascending: sortBy === "newest" ? "false" : sortBy === "ending" ? "true" : "false",
    })
    if (search) {
      params.set("search", search)
      // broaden limit for search to improve match rate
      params.set("limit", Math.max(limit * 8, 120).toString())
      params.set("offset", "0")
    }

    if (category && category !== "all") {
      const categoryMap: Record<string, string> = {
        politics: "Politics",
        sports: "Sports",
        crypto: "Crypto",
        iran: "Iran",
        finance: "Finance",
        geopolitics: "Geopolitics",
        tech: "Tech",
        culture: "Culture",
        economy: "Economy",
        "weather & science": "Weather & Science",
        mentions: "Mentions",
        elections: "Elections",
        "science & tech": "Science & Tech",
        "business & finance": "Business & Finance",
      }
      const mapped = categoryMap[category.toLowerCase()] ?? category
      params.set("tag", mapped)
    }

    let res = await fetch(`${API_BASE}/gamma/events?${params.toString()}`, {
      headers: { Accept: "application/json" },
    })
    if (!res.ok) {
      // Some Gamma deployments reject volume_24hr; retry with volume
      const retryParams = new URLSearchParams(params)
      if (retryParams.get("order") === "volume_24hr") {
        retryParams.set("order", "volume")
      }
      res = await fetch(`${API_BASE}/gamma/events?${retryParams.toString()}`, {
        headers: { Accept: "application/json" },
      })
    }
    if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`)

    const events: GammaEventRaw[] = await res.json()
    const mappedCategory = category && category !== "all"
      ? (() => {
        const categoryMap: Record<string, string> = {
          politics: "Politics",
          sports: "Sports",
          crypto: "Crypto",
          iran: "Iran",
          finance: "Finance",
          geopolitics: "Geopolitics",
          tech: "Tech",
          culture: "Culture",
          economy: "Economy",
          "weather & science": "Weather & Science",
          mentions: "Mentions",
          elections: "Elections",
          "science & tech": "Science & Tech",
          "business & finance": "Business & Finance",
        }
        return categoryMap[category.toLowerCase()] ?? category
      })()
      : null

    const now = Date.now()
    const deduped: GammaMarketRaw[] = []
    for (const event of events) {
      const eventTags = event.tags?.map((t) => t.label) ?? []
      if (
        mappedCategory &&
        !eventTags.some((t) => t.toLowerCase() === mappedCategory.toLowerCase())
      ) {
        continue
      }
      const markets = event.markets ?? []
      const primary =
        markets.find((m) => (m.active ?? true) && !m.closed) ?? markets[0]
      if (!primary) continue
      const endDate = primary.endDate ?? primary.end_date_iso ?? event.endDate
      if (endDate) {
        const endMs = new Date(endDate).getTime()
        if (!Number.isNaN(endMs) && endMs < now) continue
      }
      deduped.push({
        ...primary,
        question: primary.question ?? event.title,
        category: primary.category ?? event.category,
        tags: event.tags ?? primary.tags,
      })
    }

    const filteredBySearch = search
      ? deduped.filter((m) => {
          const q = search.toLowerCase()
          const question = (m.question ?? "").toLowerCase()
          const category = (m.category ?? "").toLowerCase()
          const slug = (m.slug ?? "").toLowerCase()
          const tags = (m.tags ?? []).map((t) => t.label ?? "").join(" ").toLowerCase()
          const outcomes = Array.isArray(m.outcomes)
            ? m.outcomes.join(" ").toLowerCase()
            : typeof m.outcomes === "string"
            ? m.outcomes.toLowerCase()
            : ""
          return (
            question.includes(q) ||
            category.includes(q) ||
            tags.includes(q) ||
            slug.includes(q) ||
            outcomes.includes(q)
          )
        })
      : deduped

    return filteredBySearch.slice(0, limit).map((m) => ({
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
      tokenIds: parseTokenIds(m),
      active: m.active ?? !m.closed,
      new: m.new ?? false,
      featured: m.featured ?? false,
      slug: m.slug ?? m.id,
      conditionId: m.conditionId,
      tags: m.tags?.map((t) => t.label) ?? [],
      createdAt: m.createdAt ?? m.startDate,
    }))
  } catch (err) {
    console.error("[smartmarket] Polymarket fetch error:", err)
    throw err
  }
}
