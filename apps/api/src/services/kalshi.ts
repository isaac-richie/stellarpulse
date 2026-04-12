import { config } from "../config.js";

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
  const res = await fetch(url, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) {
    throw new Error(`kalshi_request_failed:${res.status}`);
  }
  return res.json();
}
