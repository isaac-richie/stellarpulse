import "dotenv/config";
import serverless from "serverless-http";
import { buildServer } from "../src/server.js";

let cachedHandler: ReturnType<typeof serverless> | null = null;

async function getHandler() {
  if (cachedHandler) return cachedHandler;

  console.log("[server] Starting server initialization...");
  const start = Date.now();
  
  const app = buildServer();
  try {
    await app.ready();
    console.log(`[server] Ready in ${Date.now() - start}ms`);
  } catch (err) {
    console.error("[server] Failed to initialize Fastify:", err);
    throw err;
  }

  // Fastify instances are compatible at runtime; cast keeps Vercel's TS builder happy.
  cachedHandler = serverless(app as any);
  return cachedHandler;
}

export default async function handler(req: any, res: any) {
  const lambdaHandler = await getHandler();
  return lambdaHandler(req, res);
}
