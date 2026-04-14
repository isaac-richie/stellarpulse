import "dotenv/config";
import serverless from "serverless-http";
import { buildServer } from "../src/server.js";

let cachedHandler: ReturnType<typeof serverless> | null = null;
let handlerInitPromise: Promise<ReturnType<typeof serverless>> | null = null;

const INIT_TIMEOUT_MS = Number(process.env.SERVER_INIT_TIMEOUT_MS ?? 8000);

function isAllowedOrigin(origin: string | undefined): origin is string {
  if (!origin) return false;
  return /^https:\/\/.*\.vercel\.app$/.test(origin) || /^http:\/\/localhost:\d+$/.test(origin);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label}_timeout:${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => clearTimeout(timer));
  });
}

async function getHandler() {
  if (cachedHandler) return cachedHandler;
  if (handlerInitPromise) return handlerInitPromise;

  handlerInitPromise = (async () => {
    console.log("[server] Starting server initialization...");
    const start = Date.now();
    
    const app = buildServer();
    try {
      await withTimeout(app.ready(), INIT_TIMEOUT_MS, "fastify_ready");
      console.log(`[server] Ready in ${Date.now() - start}ms`);
    } catch (err) {
      console.error("[server] Failed to initialize Fastify:", err);
      throw err;
    }

    // Fastify instances are compatible at runtime; cast keeps Vercel's TS builder happy.
    cachedHandler = serverless(app as any);
    return cachedHandler;
  })()
    .finally(() => {
      handlerInitPromise = null;
    });

  return handlerInitPromise;
}

export default async function handler(req: any, res: any) {
  const origin = typeof req?.headers?.origin === "string" ? req.headers.origin : undefined;

  // Keep preflight resilient even when Fastify initialization fails.
  if (req?.method === "OPTIONS") {
    if (isAllowedOrigin(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,PAYMENT-SIGNATURE,X-PAYMENT,payment-signature,x-payment");
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const lambdaHandler = await getHandler();
    return lambdaHandler(req, res);
  } catch (err: any) {
    console.error("[server] Handler initialization failed:", err);

    if (isAllowedOrigin(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 503;
    res.end(JSON.stringify({
      ok: false,
      error: "server_initialization_failed",
      message: String(err?.message ?? "unknown_error")
    }));
  }
}
