import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getGamma } from "../services/polymarket.js";
import { buildCacheKey, getJsonCache, setJsonCache } from "../services/cache.js";

const gammaQuerySchema = z.record(z.string()).default({});
const GAMMA_ROUTE_TIMEOUT_MS = Number(process.env.GAMMA_ROUTE_TIMEOUT_MS ?? 9000);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label}_timeout:${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

export async function gammaRoutes(app: FastifyInstance): Promise<void> {
  app.get("/gamma/markets", async (req) => {
    const query = gammaQuerySchema.parse(req.query ?? {});
    const cacheKey = buildCacheKey("gamma:markets", query);
    const cached = await getJsonCache(cacheKey);
    if (cached) return cached;
    try {
      const markets = await withTimeout(getGamma("/markets", query), GAMMA_ROUTE_TIMEOUT_MS, "gamma_markets");
      await setJsonCache(cacheKey, markets, 30);
      return markets;
    } catch (error: any) {
      app.log.error({ err: error }, "gamma_markets_failed");
      return [];
    }
  });

  app.get("/gamma/events", async (req) => {
    const query = gammaQuerySchema.parse(req.query ?? {});
    try {
      return await withTimeout(getGamma("/events", query), GAMMA_ROUTE_TIMEOUT_MS, "gamma_events");
    } catch (error: any) {
      app.log.error({ err: error }, "gamma_events_failed");
      return [];
    }
  });

  app.get("/gamma/tags", async (req) => {
    const query = gammaQuerySchema.parse(req.query ?? {});
    const cacheKey = buildCacheKey("gamma:tags", query);
    const cached = await getJsonCache(cacheKey);
    if (cached) return cached;
    try {
      const tags = await withTimeout(getGamma("/tags", query), GAMMA_ROUTE_TIMEOUT_MS, "gamma_tags");
      await setJsonCache(cacheKey, tags, 60 * 60);
      return tags;
    } catch (error: any) {
      app.log.error({ err: error }, "gamma_tags_failed");
      return [];
    }
  });
}
