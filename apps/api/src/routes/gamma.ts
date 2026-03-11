import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getGamma } from "../services/polymarket.js";

const gammaQuerySchema = z.record(z.string()).default({});

export async function gammaRoutes(app: FastifyInstance): Promise<void> {
  app.get("/gamma/markets", async (req) => {
    const query = gammaQuerySchema.parse(req.query ?? {});
    return getGamma("/markets", query);
  });

  app.get("/gamma/events", async (req) => {
    const query = gammaQuerySchema.parse(req.query ?? {});
    return getGamma("/events", query);
  });

  app.get("/gamma/tags", async (req) => {
    const query = gammaQuerySchema.parse(req.query ?? {});
    return getGamma("/tags", query);
  });
}
