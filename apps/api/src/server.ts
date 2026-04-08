import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { bridgeRoutes } from "./routes/bridge.js";
import { clobRoutes } from "./routes/clob.js";
import { gammaRoutes } from "./routes/gamma.js";
import { geoblockRoutes } from "./routes/geoblock.js";
import { healthRoutes } from "./routes/health.js";
import { orderRoutes } from "./routes/orders.js";
import { portfolioRoutes } from "./routes/portfolio.js";
import { wsRoutes } from "./routes/ws.js";

export function buildServer() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true
  });
  app.register(websocket);

  app.register(healthRoutes);
  app.register(geoblockRoutes);
  app.register(bridgeRoutes);
  app.register(gammaRoutes);
  app.register(clobRoutes);
  app.register(orderRoutes);
  app.register(portfolioRoutes);
  app.register(wsRoutes);

  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    reply.status(500).send({ error: "internal_error" });
  });

  return app;
}
