import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getKalshi } from "../services/kalshi.js";

const querySchema = z.record(z.string()).default({});
const KALSHI_ROUTE_TIMEOUT_MS = Number(process.env.KALSHI_ROUTE_TIMEOUT_MS ?? 9000);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label}_timeout:${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

export async function kalshiRoutes(app: FastifyInstance): Promise<void> {
  app.get("/kalshi/events", async (req) => {
    const query = querySchema.parse(req.query ?? {});
    try {
      const result = await withTimeout(getKalshi("/events", query), KALSHI_ROUTE_TIMEOUT_MS, "kalshi_events");
      return result;
    } catch (error: any) {
      app.log.error({ err: error }, "kalshi_events_failed");
      return { events: [] };
    }
  });

  app.get("/kalshi/markets", async (req) => {
    const query = querySchema.parse(req.query ?? {});
    try {
      return await withTimeout(getKalshi("/markets", query), KALSHI_ROUTE_TIMEOUT_MS, "kalshi_markets");
    } catch (error: any) {
      app.log.error({ err: error }, "kalshi_markets_failed");
      return { markets: [] };
    }
  });
}
