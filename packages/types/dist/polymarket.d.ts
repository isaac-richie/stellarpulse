export type GammaMarket = {
    id?: string;
    question?: string;
    active?: boolean;
    volume?: number;
    liquidity?: number;
    tags?: string[];
    category?: string;
    outcomePrices?: number[] | string[];
    outcome_prices?: number[] | string[];
    outcomes?: string[];
    clobTokenIds?: string[];
    clob_token_ids?: string[];
    enableOrderBook?: boolean;
    enable_order_book?: boolean;
    image?: string;
    image_url?: string;
    imageUrl?: string;
    icon?: string;
    icon_url?: string;
    endDate?: string;
    end_date?: string;
    volume_24hr?: number | string;
    volume_24h?: number | string;
};
export type GammaEvent = {
    id?: string;
    title?: string;
    category?: string;
    tags?: string[];
    active?: boolean;
    closed?: boolean;
    markets?: GammaMarket[];
};
export type GeoblockResponse = {
    blocked?: boolean;
    country?: string;
    region?: string;
    message?: string;
};
export type BridgeSupportedAsset = {
    chainId: number;
    tokenAddress: string;
    symbol: string;
    decimals: number;
    minDeposit?: string;
};
export type BridgeSupportedAssetsResponse = {
    supportedAssets?: BridgeSupportedAsset[];
};
export type BridgeQuoteRequest = {
    fromChainId: number;
    fromTokenAddress: string;
    toChainId: number;
    toTokenAddress: string;
    amount: string;
};
export type BridgeQuoteResponse = {
    estimatedOutput?: string;
    fee?: string;
    etaSeconds?: number;
};
export type BridgeDepositRequest = {
    address: string;
};
export type BridgeWithdrawRequest = {
    address: string;
    toChainId: number;
    toTokenAddress: string;
    recipientAddr: string;
};
export type BridgeStatusResponse = {
    status?: string;
    message?: string;
};
export type PolymarketConfig = {
    geoblockUrl: string;
    bridgeBaseUrl: string;
    clobBaseUrl: string;
    gammaBaseUrl: string;
    dataBaseUrl: string;
};
export type OrderValidationRequest = {
    price: number;
    size: number;
    tokenId: string;
    side: "buy" | "sell";
    signature?: {
        address?: string;
        signature?: string;
        timestamp?: string;
        nonce?: string;
    };
};
export type OrderValidationResponse = {
    ok: boolean;
    error?: string;
    message?: string;
    bestPrice?: number | null;
    bestSize?: number;
};
//# sourceMappingURL=polymarket.d.ts.map