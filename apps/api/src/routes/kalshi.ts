import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getKalshi } from "../services/kalshi.js";

const querySchema = z.record(z.string()).default({});

export async function kalshiRoutes(app: FastifyInstance): Promise<void> {
  app.get("/kalshi/events", async (req) => {
    const query = querySchema.parse(req.query ?? {});
    return getKalshi("/events", query);
  });

  app.get("/kalshi/markets", async (req) => {
    const query = querySchema.parse(req.query ?? {});
    return getKalshi("/markets", query);
  });
}
