import { config } from "../config.js";

const KALSHI_TIMEOUT_MS = Number(process.env.KALSHI_REQUEST_TIMEOUT_MS ?? 8000);

function buildUrl(path: string, query: Record<string, string | number | boolean | undefined> = {}) {
  const base = config.kalshi.baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function getKalshi(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {}
): Promise<unknown> {
  const url = buildUrl(path, query);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), KALSHI_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`kalshi_request_timeout:${KALSHI_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    throw new Error(`kalshi_request_failed:${res.status}`);
  }
  return res.json();
}
