import { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => ({ ok: true, service: "api", status: "up" }));
  app.get("/health", async () => ({ ok: true }));
  app.get("/favicon.ico", async (_req, reply) => {
    reply.code(204).send();
  });
}
