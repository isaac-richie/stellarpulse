# SmartMarket

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

1. Copy env for the frontend:
   - `cp /Users/0xhardhat/SmartMarket/apps/web/.env.example /Users/0xhardhat/SmartMarket/apps/web/.env`
   - Set `NEXT_PUBLIC_PRIVY_APP_ID` in `/Users/0xhardhat/SmartMarket/apps/web/.env`
2. Install deps:
   - `npm install`
3. Run dev:
   - `npm run dev`
