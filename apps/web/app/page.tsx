"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { ClobClient, OrderType, Side } from "@polymarket/clob-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const POLYMARKET_GEOBLOCK_URL = "https://polymarket.com/api/geoblock";
const CLOB_HOST = "https://clob.polymarket.com";
const POLYGON_CHAIN_ID = 137;
const CREDS_STORAGE_KEY = "smartmarket_api_creds";

type GammaMarket = {
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
};

type MarketCard = {
  id: string;
  title: string;
  category: string;
  yes: number;
  volume: string;
  liquidity: string;
  delta: string;
  outcomes: string[];
  tokenIds: string[];
};

type LastTradePriceResponse = Record<string, { price: string } | string | number>;

type GeoblockResponse = {
  blocked?: boolean;
  country?: string;
  region?: string;
  message?: string;
};

type ApiCreds = {
  apiKey: string;
  secret: string;
  passphrase: string;
};

const formatMoney = (value?: number) => {
  if (!value && value !== 0) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(2)}`;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const parsePrices = (value?: number[] | string[]) => {
  if (!value) return [];
  return value.map((entry) => {
    const numeric = typeof entry === "string" ? Number(entry) : entry;
    return Number.isFinite(numeric) ? numeric : 0.5;
  });
};

export default function HomePage() {
  const [cards, setCards] = useState<MarketCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketCard | null>(null);
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<number>(0);
  const [lastPrices, setLastPrices] = useState<Record<string, string>>({});
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [geoblock, setGeoblock] = useState<GeoblockResponse | null>(null);
  const [geoblockError, setGeoblockError] = useState<string | null>(null);

  const [walletAddress, setWalletAddress] = useState<string>("");
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [apiCreds, setApiCreds] = useState<ApiCreds | null>(null);
  const [signatureType, setSignatureType] = useState<number>(0);
  const [funderAddress, setFunderAddress] = useState<string>("");
  const [nonceInput, setNonceInput] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [orderSide, setOrderSide] = useState<Side>(Side.BUY);
  const [orderPrice, setOrderPrice] = useState<string>("0.5");
  const [orderSize, setOrderSize] = useState<string>("1");

  useEffect(() => {
    const stored = localStorage.getItem(CREDS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ApiCreds;
        if (parsed.apiKey && parsed.secret && parsed.passphrase) {
          setApiCreds(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (apiCreds) {
      localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(apiCreds));
    }
  }, [apiCreds]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/gamma/markets?limit=12&active=true`);
        if (!res.ok) throw new Error("Failed to load markets");
        const data = (await res.json()) as GammaMarket[];
        const markets = Array.isArray(data) ? data : [];

        const mapped = markets.map((market, index): MarketCard => {
          const outcomePrices = parsePrices(market.outcomePrices ?? market.outcome_prices);
          const yesPrice = clamp(Number(outcomePrices[0] ?? 0.5));
          const category = market.category ?? market.tags?.[0] ?? "Markets";
          const outcomes = market.outcomes ?? ["Yes", "No"];
          const tokenIds = market.clobTokenIds ?? market.clob_token_ids ?? [];

          return {
            id: market.id ?? `${index}`,
            title: market.question ?? "Untitled market",
            category,
            yes: yesPrice,
            volume: formatMoney(market.volume ?? undefined),
            liquidity: formatMoney(market.liquidity ?? undefined),
            delta: "Live",
            outcomes,
            tokenIds
          };
        });

        setCards(mapped);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(POLYMARKET_GEOBLOCK_URL);
        if (!res.ok) throw new Error("geoblock_failed");
        const data = (await res.json()) as GeoblockResponse;
        setGeoblock(data);
      } catch {
        setGeoblockError("Geoblock check failed.");
      }
    };

    check();
  }, []);

  const heroStats = useMemo(() => {
    if (!cards.length) return "Loading live markets";
    return `${cards.length} live markets • ${cards[0].liquidity} avg liquidity`;
  }, [cards]);

  const openTradeDrawer = async (market: MarketCard) => {
    setSelectedMarket(market);
    setSelectedOutcomeIndex(0);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setLastPrices({});

    if (!market.tokenIds.length) {
      setDrawerLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/clob/last-trades-prices`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token_ids: market.tokenIds })
      });
      if (!res.ok) throw new Error("Failed to load last trade prices");
      const data = (await res.json()) as LastTradePriceResponse;
      const mapped: Record<string, string> = {};

      market.tokenIds.forEach((tokenId) => {
        const entry = data[tokenId];
        if (entry && typeof entry === "object" && "price" in entry) {
          mapped[tokenId] = String((entry as { price: string }).price);
        } else if (entry !== undefined) {
          mapped[tokenId] = String(entry);
        }
      });

      setLastPrices(mapped);
    } catch {
      setLastPrices({});
    } finally {
      setDrawerLoading(false);
    }
  };

  const connectWallet = async () => {
    setActionError(null);
    if (!window.ethereum) {
      setActionError("No EVM wallet detected. Install MetaMask or a compatible wallet.");
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    await provider.send("eth_requestAccounts", []);
    const signerInstance = provider.getSigner();
    const address = await signerInstance.getAddress();
    setSigner(signerInstance);
    setWalletAddress(address);
    if (!funderAddress) setFunderAddress(address);
  };

  const disconnectWallet = () => {
    setSigner(null);
    setWalletAddress("");
  };

  const createOrDeriveCreds = async () => {
    setActionError(null);
    setActionSuccess(null);
    if (!signer) {
      setActionError("Connect a wallet first.");
      return;
    }
    try {
      const client = new ClobClient(CLOB_HOST, POLYGON_CHAIN_ID, signer);
      const nonce = nonceInput ? Number(nonceInput) : undefined;
      const creds = await client.createOrDeriveApiKey(nonce);
      setApiCreds(creds as ApiCreds);
      setActionSuccess("API key ready.");
    } catch (err) {
      setActionError(`API key error: ${(err as Error).message}`);
    }
  };

  const clearCreds = () => {
    setApiCreds(null);
    localStorage.removeItem(CREDS_STORAGE_KEY);
  };

  const placeOrder = async () => {
    setActionError(null);
    setActionSuccess(null);

    if (geoblock?.blocked) {
      setActionError("Trading disabled due to geoblock.");
      return;
    }
    if (!signer) {
      setActionError("Connect a wallet first.");
      return;
    }
    if (!apiCreds) {
      setActionError("Create API credentials first.");
      return;
    }
    if (!selectedMarket) {
      setActionError("Select a market.");
      return;
    }
    const tokenId = selectedMarket.tokenIds[selectedOutcomeIndex];
    if (!tokenId) {
      setActionError("Missing token id for this outcome.");
      return;
    }

    try {
      const client = new ClobClient(
        CLOB_HOST,
        POLYGON_CHAIN_ID,
        signer,
        apiCreds,
        signatureType,
        funderAddress || undefined
      );

      const response = await client.createAndPostOrder(
        {
          tokenID: tokenId,
          price: Number(orderPrice),
          side: orderSide,
          size: Number(orderSize)
        },
        {},
        OrderType.GTC
      );

      setActionSuccess(`Order posted: ${response?.orderID ?? "ok"}`);
    } catch (err) {
      setActionError(`Order error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="container">
      <nav className="nav fade-in">
        <div className="nav-brand">
          <span>SmartMarket</span>
          <span className="nav-badge">Mainnet</span>
        </div>
        <div className="nav-links">
          <span>Markets</span>
          <span>Liquidity</span>
          <span>Portfolio</span>
          <span>Insights</span>
        </div>
        <div className="nav-actions">
          {geoblock?.blocked ? <span className="nav-badge">Blocked</span> : null}
          {walletAddress ? (
            <button className="secondary" onClick={disconnectWallet}>
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </button>
          ) : (
            <button onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
      </nav>

      <section className="hero">
        <div className="fade-in">
          <h1>Premium Prediction Liquidity, Routed Anywhere.</h1>
          <p>
            A BNB-native experience that taps global prediction liquidity with institutional-grade
            execution. Live pricing, deep books, and real-time settlement transparency.
          </p>
          <div className="hero-actions">
            <button>Explore Markets</button>
            <button className="secondary">View Risk Engine</button>
          </div>
        </div>
        <div className="ticker fade-in">
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Liquidity Pulse</div>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>{heroStats}</div>
          </div>
          <div className="badge">Live</div>
        </div>
      </section>

      {error ? (
        <div className="card" style={{ marginTop: 28 }}>
          <h2>Market Feed Error</h2>
          <p>{error}</p>
        </div>
      ) : null}

      {geoblockError ? (
        <div className="card" style={{ marginTop: 20 }}>
          <h2>Geoblock</h2>
          <p>{geoblockError}</p>
        </div>
      ) : null}

      <section className="grid stagger" style={{ marginTop: 32 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="card">
                <div className="row">
                  <span className="badge">Loading</span>
                </div>
                <h2>Fetching market...</h2>
                <p>YES price: —</p>
                <div className="progress">
                  <span style={{ width: "40%" }} />
                </div>
              </div>
            ))
          : cards.map((market) => (
              <div key={market.id} className="card">
                <div className="row">
                  <span className="badge">{market.category}</span>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>{market.delta}</span>
                </div>
                <h2>{market.title}</h2>
                <p>YES price: {(market.yes * 100).toFixed(0)}%</p>
                <div className="progress">
                  <span style={{ width: `${market.yes * 100}%` }} />
                </div>
                <div className="row" style={{ marginTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Volume</div>
                    <div style={{ fontWeight: 600 }}>{market.volume}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Liquidity</div>
                    <div style={{ fontWeight: 600 }}>{market.liquidity}</div>
                  </div>
                  <button className="secondary" onClick={() => openTradeDrawer(market)}>Trade</button>
                </div>
              </div>
            ))}
      </section>

      <footer className="footer">
        <div>SmartMarket Protocol • Premium Prediction Infrastructure</div>
        <div>Liquidity routed, compliance enforced, outcomes settled on-chain.</div>
      </footer>

      {drawerOpen && selectedMarket ? (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="badge">{selectedMarket.category}</div>
                <h2 style={{ margin: "10px 0" }}>{selectedMarket.title}</h2>
                <p>Live pricing and execution routed from global liquidity.</p>
              </div>
              <button className="secondary" onClick={() => setDrawerOpen(false)}>Close</button>
            </div>

            <div className="drawer-grid">
              {selectedMarket.outcomes.map((outcome, index) => {
                const tokenId = selectedMarket.tokenIds[index];
                const last = tokenId ? lastPrices[tokenId] : undefined;
                return (
                  <div key={`${selectedMarket.id}-${outcome}`} className="drawer-card">
                    <div className="row">
                      <span className="badge">{outcome}</span>
                      <span style={{ color: "var(--accent)" }}>{last ? `${Number(last) * 100}%` : "—"}</span>
                    </div>
                    <p>Token ID</p>
                    <div style={{ fontSize: 12, wordBreak: "break-all" }}>{tokenId ?? "Not available"}</div>
                    <div className="row" style={{ marginTop: 12 }}>
                      <button onClick={() => { setSelectedOutcomeIndex(index); setOrderSide(Side.BUY); }}>
                        Buy
                      </button>
                      <button className="secondary" onClick={() => { setSelectedOutcomeIndex(index); setOrderSide(Side.SELL); }}>
                        Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="drawer-form">
              <h3>Place Order</h3>
              <div className="form-grid">
                <label>Outcome</label>
                <select value={String(selectedOutcomeIndex)} onChange={(e) => setSelectedOutcomeIndex(Number(e.target.value))}>
                  {selectedMarket.outcomes.map((outcome, index) => (
                    <option key={`${selectedMarket.id}-opt-${outcome}`} value={index}>
                      {outcome}
                    </option>
                  ))}
                </select>
                <label>Side</label>
                <select value={orderSide} onChange={(e) => setOrderSide(e.target.value as Side)}>
                  <option value={Side.BUY}>Buy</option>
                  <option value={Side.SELL}>Sell</option>
                </select>
                <label>Price</label>
                <input value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} />
                <label>Size</label>
                <input value={orderSize} onChange={(e) => setOrderSize(e.target.value)} />
                <label>Signature Type</label>
                <select value={String(signatureType)} onChange={(e) => setSignatureType(Number(e.target.value))}>
                  <option value="0">EOA</option>
                  <option value="1">POLY_PROXY</option>
                  <option value="2">GNOSIS_SAFE</option>
                </select>
                <label>Funder Address (optional)</label>
                <input value={funderAddress} onChange={(e) => setFunderAddress(e.target.value)} />
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <button onClick={placeOrder} disabled={geoblock?.blocked || !apiCreds || !signer}>
                  Place Order
                </button>
                <button className="secondary" onClick={connectWallet}>Connect</button>
              </div>
            </div>

            <div className="drawer-form">
              <h3>API Credentials</h3>
              <div className="form-grid">
                <label>Nonce (optional)</label>
                <input value={nonceInput} onChange={(e) => setNonceInput(e.target.value)} />
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="secondary" onClick={createOrDeriveCreds}>Create/Derive</button>
                <button className="secondary" onClick={clearCreds}>Clear</button>
              </div>
            </div>

            {actionError ? <div className="notice error">{actionError}</div> : null}
            {actionSuccess ? <div className="notice success">{actionSuccess}</div> : null}

            <div style={{ marginTop: 18, color: "var(--muted)", fontSize: 12 }}>
              {drawerLoading ? "Loading last trade prices..." : "Prices sourced from CLOB last trades."}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
