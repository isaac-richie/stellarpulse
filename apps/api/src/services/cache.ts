import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let redisClient: Redis | null = null;

const getClient = () => {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true
    });
    redisClient.on("error", () => {
      // swallow errors to keep API responsive
    });
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
    const cached = await client.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
};

export const setJsonCache = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  try {
    const client = getClient();
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // ignore cache failures
  }
};
