import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { analysisRoutes } from "./routes/analysis.js";
import { bridgeRoutes } from "./routes/bridge.js";
import { clobRoutes } from "./routes/clob.js";
import { gammaRoutes } from "./routes/gamma.js";
import { geoblockRoutes } from "./routes/geoblock.js";
import { healthRoutes } from "./routes/health.js";
import { kalshiRoutes } from "./routes/kalshi.js";
import { orderRoutes } from "./routes/orders.js";
import { portfolioRoutes } from "./routes/portfolio.js";
import { wsRoutes } from "./routes/ws.js";
import { catalystRoutes } from "./routes/catalyst.js";
import { agentRoutes } from "./routes/agent.js";

export function buildServer() {
  const app = Fastify({ logger: true });
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

  app.register(cors, {
    origin: [
      "https://stellarpulse-web.vercel.app",
      "https://stellarpulse-api.vercel.app",
      "https://stellarpulse.vercel.app"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "PAYMENT-SIGNATURE",
      "X-PAYMENT",
      "payment-signature",
      "x-payment",
      "Access-Control-Expose-Headers",
      "access-control-expose-headers"
    ],
    exposedHeaders: [
      "PAYMENT-REQUIRED",
      "PAYMENT-RESPONSE",
      "X-PAYMENT-RESPONSE",
      "payment-required",
      "payment-response",
      "x-payment-response"
    ]
  });
  if (!isVercel) {
    app.register(websocket);
  }

  app.register(healthRoutes);
  app.register(kalshiRoutes);
  app.register(analysisRoutes);
  app.register(geoblockRoutes);
  app.register(bridgeRoutes);
  app.register(gammaRoutes);
  app.register(clobRoutes);
  app.register(orderRoutes);
  app.register(portfolioRoutes);
  if (!isVercel) {
    app.register(wsRoutes);
  } else {
    app.get("/ws/orderbook", async (_req, reply) => {
      reply.status(501);
      return { ok: false, error: "websocket_not_supported_on_vercel" };
    });
  }
  app.register(catalystRoutes);
  app.register(agentRoutes);

  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    reply.status(500).send({ error: "internal_error" });
  });

  return app;
}
