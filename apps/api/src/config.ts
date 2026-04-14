import { defaultConfig } from "@smartmarket/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "0.0.0.0",
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini"
  },
  x402: {
    enabled: (process.env.X402_ENABLED ?? "true") !== "false",
    demoBypass: (process.env.X402_DEMO_BYPASS ?? "false") === "true",
    analysisPriceUsd: Number(process.env.X402_ANALYSIS_PRICE_USD ?? 0.05),
    verifierUrl: process.env.X402_VERIFIER_URL ?? "https://x402.org/facilitator",
    network: process.env.X402_NETWORK ?? "stellar:testnet",
    payTo: process.env.X402_PAYTO ?? "",
    asset: process.env.X402_ASSET ?? "USDC",
    assetDecimals: Number(process.env.X402_ASSET_DECIMALS ?? 7),
    resourceBaseUrl: process.env.X402_RESOURCE_BASE_URL ?? `http://localhost:${Number(process.env.PORT ?? 4000)}`,
    maxTimeoutSeconds: Number(process.env.X402_MAX_TIMEOUT_SECONDS ?? 300),
    facilitatorRequestTimeoutMs: Number(process.env.X402_FACILITATOR_TIMEOUT_MS ?? 5000),
    facilitatorRetries: Number(process.env.X402_FACILITATOR_RETRIES ?? 1),
    settleOnUnlock: (process.env.X402_SETTLE_ON_UNLOCK ?? "true") !== "false",
    facilitatorApiKey: process.env.X402_FACILITATOR_API_KEY ?? "",
    agentPrivateKey: process.env.X402_AGENT_STELLAR_PRIVATE_KEY ?? "",
    horizonTestnetUrl: process.env.X402_HORIZON_TESTNET_URL ?? "https://horizon-testnet.stellar.org",
    horizonPubnetUrl: process.env.X402_HORIZON_PUBNET_URL ?? "https://horizon.stellar.org",
    horizonRequestTimeoutMs: Number(process.env.X402_HORIZON_TIMEOUT_MS ?? 3000),
    usdcAssetCode: process.env.X402_STELLAR_USDC_ASSET_CODE ?? "USDC",
    usdcIssuerTestnet: process.env.X402_STELLAR_USDC_ISSUER_TESTNET ?? "",
    usdcIssuerPubnet: process.env.X402_STELLAR_USDC_ISSUER_PUBNET ?? ""
  },
  polymarket: {
    geoblockUrl: process.env.POLYMARKET_GEOBLOCK_URL ?? defaultConfig.polymarket.geoblockUrl,
    bridgeBaseUrl: process.env.POLYMARKET_BRIDGE_BASE_URL ?? defaultConfig.polymarket.bridgeBaseUrl,
    clobBaseUrl: process.env.POLYMARKET_CLOB_BASE_URL ?? defaultConfig.polymarket.clobBaseUrl,
    gammaBaseUrl: process.env.POLYMARKET_GAMMA_BASE_URL ?? defaultConfig.polymarket.gammaBaseUrl,
    dataBaseUrl: process.env.POLYMARKET_DATA_BASE_URL ?? defaultConfig.polymarket.dataBaseUrl
  },
  kalshi: {
    baseUrl: process.env.KALSHI_BASE_URL ?? "https://api.elections.kalshi.com/trade-api/v2"
  }
};
