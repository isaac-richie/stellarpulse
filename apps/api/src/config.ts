export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "0.0.0.0",
  polymarket: {
    geoblockUrl: process.env.POLYMARKET_GEOBLOCK_URL ?? "https://polymarket.com/api/geoblock",
    bridgeBaseUrl: process.env.POLYMARKET_BRIDGE_BASE_URL ?? "https://bridge.polymarket.com",
    clobBaseUrl: process.env.POLYMARKET_CLOB_BASE_URL ?? "https://clob.polymarket.com",
    gammaBaseUrl: process.env.POLYMARKET_GAMMA_BASE_URL ?? "https://gamma-api.polymarket.com"
  }
};
