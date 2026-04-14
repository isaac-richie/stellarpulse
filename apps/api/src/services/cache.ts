import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let redisClient: Redis | null = null;

const getClient = () => {
  if (!redisClient) {
    // If we're in Vercel production and no REDIS_URL is provided, or it's just 'localhost', 
    // we should proceed without Redis to avoid connection hangs.
    const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
    const isLocalhost = REDIS_URL.includes("localhost") || REDIS_URL.includes("127.0.0.1");

    if (isVercel && isLocalhost) {
      console.warn("[cache] Skipping Redis initialization in Vercel environment with localhost URL.");
      return null;
    }

    try {
      redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 0, // Fail fast if connection is lost
        enableReadyCheck: false,
        lazyConnect: true,       // Don't connect until first command
        connectTimeout: 2000,    // 2s connection timeout
        commandTimeout: 2000,    // 2s command timeout
        retryStrategy: (times) => {
          // Only retry a few times during initialization, then stop to prevent hangs
          if (times > 3) return null;
          return Math.min(times * 100, 2000);
        }
      });

      redisClient.on("error", (err) => {
        console.warn("[cache] Redis connection error:", err.message);
      });
    } catch (err) {
      console.error("[cache] Failed to initialize Redis client:", err);
      return null;
    }
  }
  return redisClient;
};

export const buildCacheKey = (prefix: string, query: Record<string, string | number | boolean | undefined> = {}) => {
  const params = new URLSearchParams();
  Object.entries(query)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (value === undefined) return;
      params.set(key, String(value));
    });
  const suffix = params.toString();
  return suffix ? `${prefix}?${suffix}` : prefix;
};

export const getJsonCache = async <T>(key: string): Promise<T | null> => {
  try {
    const client = getClient();
    if (!client) return null; // Fallback for failed initialization

    const cached = await client.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (err) {
    return null;
  }
};

export const setJsonCache = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  try {
    const client = getClient();
    if (!client) return; // Fallback for failed initialization

    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // ignore cache failures
  }
};
