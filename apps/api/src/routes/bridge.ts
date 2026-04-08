import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupportedAssets, getStatus, postDeposit, postQuote, postWithdraw } from "../services/polymarket.js";

const anyJsonSchema = z.unknown();

export async function bridgeRoutes(app: FastifyInstance): Promise<void> {
  app.get("/bridge/supported-assets", async () => getSupportedAssets());

  app.post("/bridge/quote", async (req, reply) => {
    const body = anyJsonSchema.parse(req.body ?? null);
    if (!body) {
      reply.status(400);
      return { error: "missing_body" };
    }
    return postQuote(body as any);
  });

  app.post("/bridge/deposit", async (req, reply) => {
    const body = anyJsonSchema.parse(req.body ?? null);
    if (!body) {
      reply.status(400);
      return { error: "missing_body" };
    }
    return postDeposit(body as any);
  });

  app.post("/bridge/withdraw", async (req, reply) => {
    const body = anyJsonSchema.parse(req.body ?? null);
    if (!body) {
      reply.status(400);
      return { error: "missing_body" };
    }
    return postWithdraw(body as any);
  });

  app.get<{ Params: { address: string } }>("/bridge/status/:address", async (req) => {
    return getStatus(req.params.address);
  });
}
