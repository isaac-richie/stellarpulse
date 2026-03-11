import { config } from "../config.js";

export type HttpMethod = "GET" | "POST";

type RequestOptions = {
  headers?: Record<string, string>;
  body?: unknown;
};

async function requestJson<T>(url: string, method: HttpMethod, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(options.headers ?? {}),
      "content-type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstream error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

function toQueryString(query: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getGeoblockStatus(): Promise<unknown> {
  return requestJson(config.polymarket.geoblockUrl, "GET");
}

export async function getSupportedAssets(): Promise<unknown> {
  const url = `${config.polymarket.bridgeBaseUrl}/supported-assets`;
  return requestJson(url, "GET");
}

export async function postQuote(payload: unknown): Promise<unknown> {
  const url = `${config.polymarket.bridgeBaseUrl}/quote`;
  return requestJson(url, "POST", { body: payload });
}

export async function postDeposit(payload: unknown): Promise<unknown> {
  const url = `${config.polymarket.bridgeBaseUrl}/deposit`;
  return requestJson(url, "POST", { body: payload });
}

export async function postWithdraw(payload: unknown): Promise<unknown> {
  const url = `${config.polymarket.bridgeBaseUrl}/withdraw`;
  return requestJson(url, "POST", { body: payload });
}

export async function getStatus(address: string): Promise<unknown> {
  const url = `${config.polymarket.bridgeBaseUrl}/status/${address}`;
  return requestJson(url, "GET");
}

export async function getGamma(path: string, query: Record<string, string | number | boolean | undefined> = {}): Promise<unknown> {
  const url = `${config.polymarket.gammaBaseUrl}${path}${toQueryString(query)}`;
  return requestJson(url, "GET");
}

export async function getClobPublic(path: string, query: Record<string, string | number | boolean | undefined> = {}): Promise<unknown> {
  const url = `${config.polymarket.clobBaseUrl}${path}${toQueryString(query)}`;
  return requestJson(url, "GET");
}

export async function postClobPublic(path: string, payload: unknown): Promise<unknown> {
  const url = `${config.polymarket.clobBaseUrl}${path}`;
  return requestJson(url, "POST", { body: payload });
}

export async function clobAuth(path: string, headers: Record<string, string>): Promise<unknown> {
  const url = `${config.polymarket.clobBaseUrl}${path}`;
  return requestJson(url, "GET", { headers });
}

export async function clobCreateApiKey(headers: Record<string, string>): Promise<unknown> {
  const url = `${config.polymarket.clobBaseUrl}/auth/api-key`;
  return requestJson(url, "POST", { headers });
}
