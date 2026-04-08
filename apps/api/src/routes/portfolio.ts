import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getData } from "../services/polymarket.js";

const paramsSchema = z.object({
  address: z.string().min(1)
});

const querySchema = z.object({
  limit: z.string().optional()
});

export async function portfolioRoutes(app: FastifyInstance): Promise<void> {
  app.get("/portfolio/:address", async (req, reply) => {
    const params = paramsSchema.safeParse(req.params ?? {});
    if (!params.success) {
      reply.status(400);
      return { error: "invalid_address" };
    }
    const query = querySchema.parse(req.query ?? {});
    const limit = query.limit ? Number(query.limit) : 50;

    const [positions, closedPositions, value, trades] = await Promise.all([
      getData("/positions", { user: params.data.address }),
      getData("/closed-positions", { user: params.data.address }),
      getData("/value", { user: params.data.address }),
      getData("/trades", { user: params.data.address, limit })
    ]);

    return {
      address: params.data.address,
      positions,
      closedPositions,
      value,
      trades
    };
  });
}
