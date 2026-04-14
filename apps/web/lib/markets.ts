import { fetchKalshiMarkets } from "./kalshi"
import { fetchPolymarketMarkets, type PolymarketMarket } from "./polymarket"

const PROVIDER_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_MARKETS_TIMEOUT_MS ?? 12000)

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), timeoutMs)
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timer))
  })
}

function volumeToNumber(volume: string): number {
  const normalized = volume.replace(/\$/g, "").trim().toUpperCase()
  if (!normalized) return 0
  if (normalized.endsWith("M")) return Number.parseFloat(normalized) * 1_000_000
  if (normalized.endsWith("K")) return Number.parseFloat(normalized) * 1_000
  return Number.parseFloat(normalized)
}

function dedupeMarkets(markets: PolymarketMarket[]) {
  const seen = new Set<string>()
  const out: PolymarketMarket[] = []
  for (const market of markets) {
    const key = `${market.question.toLowerCase().trim()}::${(market.endDate ?? "").slice(0, 10)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(market)
  }
  return out
}

export async function fetchMarkets(
  category?: string,
  limit = 24,
  sortBy = "trending",
  offset = 0,
  search?: string
): Promise<PolymarketMarket[]> {
  const includeKalshi = (process.env.NEXT_PUBLIC_ENABLE_KALSHI ?? "true") !== "false"
  const requests = [
    withTimeout(fetchPolymarketMarkets(category, limit, sortBy, offset, search), PROVIDER_TIMEOUT_MS, []),
    includeKalshi
      ? withTimeout(fetchKalshiMarkets(category ?? "all", limit, sortBy, offset, search), PROVIDER_TIMEOUT_MS, [])
      : Promise.resolve([])
  ]

  const [polyResult, kalshiResult] = await Promise.allSettled(requests)
  const poly = polyResult.status === "fulfilled" ? polyResult.value : []
  const kalshi = kalshiResult.status === "fulfilled" ? kalshiResult.value : []

  const merged = dedupeMarkets([...poly, ...kalshi])
  merged.sort((a, b) => volumeToNumber(b.volume) - volumeToNumber(a.volume))

  return merged.slice(0, limit)
}
