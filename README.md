# StellarPulse

StellarPulse is a pay-per-insight intelligence terminal built on Stellar.
It turns raw prediction-market signals into structured analysis for both humans and autonomous agents.

## What It Does

- Ingests live market/event data from Polymarket and Kalshi.
- Generates structured intelligence briefs (analysis-focused, not prediction-focused).
- Gates premium analysis behind Stellar x402 payment verification.
- Supports two consumption modes:
  - Human analyst view.
  - Agent process view with machine-readable dossier fields.
- Exposes agent treasury and settlement telemetry (budget, spend, payment count).

## Why It Exists

Most market interfaces show probabilities but not context. StellarPulse focuses on context, structural drivers, information asymmetry, and risk, then monetizes that intelligence on-demand via micropayments instead of subscriptions.

## Current Status (Honest Snapshot)

Implemented:
- End-to-end unlock flow with x402-style payment requirement and settlement verification.
- Freighter wallet flow for user-side payment unlocks.
- Agent-mode unlock path (server-side signing with configured agent key).
- Structured AI output for both user and agent views.
- Live agent ledger/profile endpoints backed by Stellar Horizon.
- Next.js frontend terminal experience with dual-mode analysis views.

Not fully implemented / not production-hard yet:
- No full cryptographic Proof-of-Intelligence verification product yet (only receipt/hash fields).
- No true multi-agent orchestration backend yet (current AI generation is structured single-pass generation).
- Some routes are passthrough wrappers over external APIs.
- Infrastructure deployment manifests are minimal/placeholders.
- No root lint script currently.

## Monorepo Structure

```text
Stellarpulse/
├─ apps/
│  ├─ api/         # Fastify backend (x402 verification, analysis generation, market proxies)
│  └─ web/         # Next.js frontend (terminal UI, unlock modal, agent HUD)
├─ packages/
│  ├─ polymarket-sdk/  # typed client wrapper
│  ├─ config/          # shared defaults
│  └─ types/           # shared types
├─ infra/
│  ├─ docker/
│  └─ deployment/
└─ scripts/
```

## Key Flows

### 1) User Unlock (Human)

1. User opens event and requests analysis unlock.
2. Frontend fetch is wrapped with x402 payment handling.
3. Backend validates/settles payment via facilitator.
4. On success, backend returns structured dossier + settlement receipt.

Primary endpoint:
- `POST /analysis/unlock`

### 2) Agent Unlock (Machine)

1. Agent mode requests unlock.
2. Backend creates payment header using configured agent Stellar private key.
3. Backend validates/settles payment via facilitator.
4. Returns machine-oriented dossier fields and settlement metadata.

Primary endpoint:
- `POST /analysis/unlock-agent`

### 3) Agent Economic HUD

Frontend polls:
- `GET /analysis/agent-status`
- `GET /agent/ledger`

Displays:
- account readiness
- USDC/XLM balances
- daily spend vs configured budget
- settlement counts

## API Surface (Main)

Health:
- `GET /health`

Analysis + Payment:
- `GET /analysis/quote`
- `GET /analysis/payment-readiness?address=...`
- `POST /analysis/unlock`
- `POST /analysis/unlock-agent`
- `POST /analysis/unlock-agent-paid`
- `GET /analysis/agent-status`
- `POST /analysis/activate-agent`
- `POST /analysis/catalyst`

Agent telemetry:
- `GET /agent/profile`
- `GET /agent/ledger`
- `GET /agent/health`

Market/bridge/proxy endpoints:
- `GET /gamma/markets`, `GET /gamma/events`, `GET /gamma/tags`
- `GET /clob/price`, `GET /clob/book`, etc.
- `GET /bridge/supported-assets`, `POST /bridge/quote`, `POST /bridge/deposit`, `POST /bridge/withdraw`
- `GET /portfolio/:address`
- `GET /kalshi/events`, `GET /kalshi/markets`

## Tech Stack

- Stellar ecosystem: Freighter, Horizon, x402 tooling
- Frontend: Next.js 16, React, Tailwind
- Backend: Fastify, TypeScript
- AI: OpenAI chat completions with strict JSON schema response format
- Data: Polymarket APIs, Kalshi API

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- Freighter wallet (for user unlock flow)
- Stellar testnet account with trustline/funds for full payment testing

### Install

```bash
npm install
```

### Configure env files

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

### Required/important backend env vars

In `apps/api/.env`:

```env
PORT=4000
HOST=0.0.0.0
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5

X402_ENABLED=true
X402_DEMO_BYPASS=false
X402_ANALYSIS_PRICE_USD=0.05
X402_VERIFIER_URL=https://x402.org/facilitator
X402_NETWORK=stellar
X402_PAYTO=
X402_ASSET=USDC
X402_ASSET_DECIMALS=7
X402_RESOURCE_BASE_URL=http://localhost:4000
X402_MAX_TIMEOUT_SECONDS=300
X402_SETTLE_ON_UNLOCK=true
X402_FACILITATOR_API_KEY=
X402_AGENT_STELLAR_PRIVATE_KEY=
```

Notes:
- `X402_PAYTO` must be configured for real payment settlement.
- `X402_AGENT_STELLAR_PRIVATE_KEY` is required for `/analysis/unlock-agent`.
- If `OPENAI_API_KEY` is not set, backend falls back to static template analysis.

### Frontend env

In `apps/web/.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Run

Terminal A:
```bash
npm -w @smartmarket/api run dev
```

Terminal B:
```bash
npm -w @smartmarket/web run dev
```

Or from root:
```bash
npm run dev
```

## Build & Test

Build all workspaces:
```bash
npm run build
```

Run API tests:
```bash
npm -w @smartmarket/api run test
```

Note:
- There is currently no root `npm run lint` script.

## Demo Script (2-5 minutes)

1. Start API and web.
2. Open `http://localhost:3000`.
3. Pick any event card.
4. Open unlock modal.
5. In User mode:
   - Connect Freighter.
   - Check readiness hints.
   - Unlock analysis.
6. In Agent mode:
   - View agent treasury/ledger state.
   - Trigger agent unlock.
7. Observe returned dossier structure and payment receipt metadata.

## What Uses Real Data vs Mock/Fallback

Real/external:
- Polymarket/Kalshi fetches
- Stellar Horizon account/ledger reads
- x402 facilitator verification/settlement (when configured)

Fallback/mock-ish behavior:
- AI dossier generation falls back to template content when OpenAI key is missing or AI call fails.
- Some bridge/catalyst/order-validation routes are thin wrappers and not full execution engines.

## Known Risks / Gaps

- External API dependency risk (Polymarket/Kalshi/Horizon/facilitator availability).
- Payment config sensitivity (`payTo`, network/asset issuer setup).
- Limited backend test coverage beyond core API test.
- Branding/package naming inconsistency remains in code (`smartmarket` workspace names).

## Roadmap

- Add full PoI verification system (signed hash + independent verifier).
- Implement true multi-agent orchestration pipeline.
- Expand integration tests for payment and unlock reliability.
- Add lint/format CI gates.
- Harden auth/rate limiting and production deployment manifests.

## License

No explicit license file is currently included.
Add a `LICENSE` before production/open distribution.
