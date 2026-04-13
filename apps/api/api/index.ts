import "dotenv/config";
import serverless from "serverless-http";
import { buildServer } from "../src/server.js";

let cachedHandler: ReturnType<typeof serverless> | null = null;

async function getHandler() {
  if (cachedHandler) return cachedHandler;

  const app = buildServer();
  await app.ready();
  cachedHandler = serverless(app);
  return cachedHandler;
}

export default async function handler(req: any, res: any) {
  const lambdaHandler = await getHandler();
  return lambdaHandler(req, res);
}
