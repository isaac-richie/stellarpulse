# SmartMarket

BNB-native UX that routes trading to Polymarket while enforcing geoblock compliance.

## Structure
- `/Users/0xhardhat/SmartMarket/apps/api` Fastify API for Polymarket Bridge, CLOB, Gamma, and geoblock checks
- `/Users/0xhardhat/SmartMarket/apps/web` Next.js UI scaffold

## Setup
1. Install dependencies
   - `npm install`
2. Copy env templates
   - `cp /Users/0xhardhat/SmartMarket/apps/api/.env.example /Users/0xhardhat/SmartMarket/apps/api/.env`
   - `cp /Users/0xhardhat/SmartMarket/apps/web/.env.example /Users/0xhardhat/SmartMarket/apps/web/.env`
3. Run dev
   - `npm run dev:api`
   - `npm run dev:web`

## Geoblock
- The geoblock endpoint is IP-based. Calling it from the server will check the server IP.
- The UI tries direct client-side geoblock first and falls back to the server endpoint.
- For strict compliance, ensure the user-facing client or edge performs the geoblock check before order placement.

## Polymarket APIs
- Bridge: `GET /bridge/supported-assets`, `POST /bridge/quote`, `POST /bridge/deposit`, `POST /bridge/withdraw`, `GET /bridge/status/:address`
- Gamma: `GET /gamma/markets`, `GET /gamma/events`, `GET /gamma/tags`
- CLOB (public): `GET /clob/price`, `GET /clob/book`, `GET /clob/markets`

## Trading Flow (Non-custodial)
1. Connect wallet (EOA).
2. Create or derive Polymarket API creds (stored locally in the browser).
3. Fetch markets from Gamma to select a token ID.
4. Place orders with the CLOB client using your EOA signature and API creds.

## Bridge Flow
- Quote payload uses `fromAmountBaseUnit`, `fromChainId`, `fromTokenAddress`, `recipientAddress`, `toChainId`, `toTokenAddress`.
- Deposit payload uses `address` (Polymarket wallet).
- Withdraw payload uses `address`, `toChainId`, `toTokenAddress`, `recipientAddr`.

## Notes
- Signature types: `0=EOA`, `1=POLY_PROXY`, `2=GNOSIS_SAFE`. Use GNOSIS_SAFE with a Polymarket proxy wallet address as funder.
- EOA users must set token allowances before trading.
- This is a scaffold. Payloads must match Polymarket Bridge and CLOB API formats.
