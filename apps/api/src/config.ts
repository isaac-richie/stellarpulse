import { defaultConfig } from "@smartmarket/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "0.0.0.0",
  polymarket: {
    geoblockUrl: process.env.POLYMARKET_GEOBLOCK_URL ?? defaultConfig.polymarket.geoblockUrl,
    bridgeBaseUrl: process.env.POLYMARKET_BRIDGE_BASE_URL ?? defaultConfig.polymarket.bridgeBaseUrl,
    clobBaseUrl: process.env.POLYMARKET_CLOB_BASE_URL ?? defaultConfig.polymarket.clobBaseUrl,
    gammaBaseUrl: process.env.POLYMARKET_GAMMA_BASE_URL ?? defaultConfig.polymarket.gammaBaseUrl,
    dataBaseUrl: process.env.POLYMARKET_DATA_BASE_URL ?? defaultConfig.polymarket.dataBaseUrl
  }
};
