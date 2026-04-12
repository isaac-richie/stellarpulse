under# SmartMarket

## Monorepo Layout

```
SmartMarket
├ apps
│  ├ api             Fastify API
│  └ web             Next.js frontend
├ packages
│  ├ polymarket-sdk  Wrapper for Gamma + CLOB + Bridge
│  ├ types           Shared types
│  └ config          Shared config
├ infra
│  ├ docker
│  └ deployment
└ scripts
```

## Quickstart

1. Install deps:
   - `npm install`
2. Configure env:
   - `cp /Users/0xhardhat/SmartMarket/apps/web/.env.example /Users/0xhardhat/SmartMarket/apps/web/.env`
   - `cp /Users/0xhardhat/SmartMarket/apps/api/.env.example /Users/0xhardhat/SmartMarket/apps/api/.env`
3. Start API and web:
   - `npm -w @smartmarket/api run dev`
   - `npm -w @smartmarket/web run dev`

## Agent API (x402 M2M)

This project is analysis-first. Polymarket is a market data source; Stellar x402 is the payment/auth rail.

### Endpoints

- `GET /analysis/quote`
  - Returns current x402 payment requirements.
- `GET /analysis/payment-readiness?address=<stellarAddress>`
  - Checks if account exists and whether USDC trustline is available.
- `POST /analysis/unlock`
  - User/agent unlock with x402 payment proof in header.
- `POST /analysis/unlock-agent-paid`
  - Dedicated machine-to-machine endpoint requiring x402 payment.
- `POST /analysis/unlock-agent`
  - Server-managed auto-pay path (demo/helper mode).

### Receipt payload returned after unlock

```json
{
  "receipt": {
    "id": "uuid",
    "rail": "x402",
    "network": "stellar:testnet",
    "asset": "C...",
    "amountAtomic": "500000",
    "amountUsd": 0.05,
    "payTo": "G...",
    "payer": "G...",
    "txHash": "....",
    "settledAt": "2026-04-09T12:00:00.000Z"
  }
}
```

### Judge-friendly test flow

1. Check readiness:

```bash
curl "http://localhost:4000/analysis/payment-readiness?address=G...."
```

2. Request quote:

```bash
curl "http://localhost:4000/analysis/quote"
```

3. Machine unlock with x402 SDK (Node script):

```ts
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { createEd25519Signer, ExactStellarScheme } from "@x402/stellar";

const signer = createEd25519Signer(process.env.AGENT_SECRET!, "stellar:testnet");
const client = new x402Client().register("stellar:*", new ExactStellarScheme(signer));
const httpClient = new x402HTTPClient(client);

const quoteRes = await fetch("http://localhost:4000/analysis/quote");
const paymentRequired = await quoteRes.json();
const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
const signedHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

const unlockRes = await fetch("http://localhost:4000/analysis/unlock-agent-paid", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(signedHeaders as Record<string, string>)
  },
  body: JSON.stringify({
    market: {
      id: "m1",
      question: "Will BTC close above $100k this year?",
      outcomes: [{ name: "Yes", price: 54 }, { name: "No", price: 46 }]
    }
  })
});

console.log(await unlockRes.json());
```
