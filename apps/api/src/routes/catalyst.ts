import { FastifyInstance } from "fastify";
import { z } from "zod";
import { findCatalysts } from "../services/catalyst.js";

const catalystSchema = z.object({
  news: z.string().min(3)
});

export async function catalystRoutes(app: FastifyInstance): Promise<void> {
  app.post("/analysis/catalyst", async (req, reply) => {
    try {
      const { news } = catalystSchema.parse(req.body);
      const results = await findCatalysts(news);
      return { success: true, catalysts: results };
    } catch (err) {
      reply.status(400);
      return { success: false, error: "Invalid request payload" };
    }
  });
}
