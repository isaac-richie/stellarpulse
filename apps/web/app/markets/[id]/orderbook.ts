export type OrderbookEntry = {
  price: number;
  size: number;
  total?: number;
};

export type OrderbookSnapshot = {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
};

const parseNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const parseSide = (side: unknown): OrderbookEntry[] => {
  if (!Array.isArray(side)) return [];
  return side
    .map((entry) => {
      if (Array.isArray(entry)) {
        const [price, size] = entry;
        return {
          price: parseNumber(price),
          size: parseNumber(size)
        };
      }
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        return {
          price: parseNumber(record.price ?? record.p),
          size: parseNumber(record.size ?? record.s)
        };
      }
      return { price: 0, size: 0 };
    })
    .filter((entry) => entry.price > 0 && entry.size > 0);
};

export const parseOrderbook = (payload: unknown): OrderbookSnapshot => {
  const data = payload as { bids?: unknown; asks?: unknown } | undefined;
  return {
    bids: parseSide(data?.bids).slice(0, 12),
    asks: parseSide(data?.asks).slice(0, 12)
  };
};
