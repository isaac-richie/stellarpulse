import { x402Client, x402HTTPClient } from "@x402/core/client";
import { Keypair, Horizon } from "@stellar/stellar-sdk";
import {
  createEd25519Signer,
  ExactStellarScheme,
  USDC_PUBNET_ADDRESS,
  USDC_TESTNET_ADDRESS,
  validateStellarAssetAddress
} from "@x402/stellar";
import { config } from "../config.js";

export interface X402PaymentRequirement {
  scheme: "exact";
  network: `${string}:${string}`;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}

export interface X402PaymentRequired {
  x402Version: 2;
  error: "payment_required";
  resource: {
    url: string;
    description: string;
    mimeType: string;
  };
  accepts: X402PaymentRequirement[];
}

export interface X402VerifyResult {
  ok: boolean;
  reason?: string;
  payer?: string;
  transaction?: string;
  network?: string;
}

export interface StellarReadiness {
  ready: boolean;
  checks: {
    accountExists: boolean;
    trustlineExists: boolean | "unknown";
  };
  hints: string[];
}

function normalizeStellarNetwork(raw: string): "stellar:testnet" | "stellar:pubnet" {
  const value = raw.trim().toLowerCase();
  if (value === "stellar" || value === "testnet" || value === "stellar:testnet") {
    return "stellar:testnet";
  }
  if (value === "mainnet" || value === "pubnet" || value === "stellar:pubnet") {
    return "stellar:pubnet";
  }
  throw new Error(`Unknown Stellar network: ${raw}`);
}

function normalizeAssetAddress(
  rawAsset: string,
  network: "stellar:testnet" | "stellar:pubnet"
): string {
  const value = rawAsset.trim();
  if (validateStellarAssetAddress(value)) return value;

  if (value.toUpperCase() === "USDC") {
    return network === "stellar:pubnet" ? USDC_PUBNET_ADDRESS : USDC_TESTNET_ADDRESS;
  }

  throw new Error(`Unsupported Stellar asset "${rawAsset}". Use a Stellar contract address (C...) or "USDC".`);
}

function getHorizonBaseUrl(network: "stellar:testnet" | "stellar:pubnet") {
  return network === "stellar:testnet" ? config.x402.horizonTestnetUrl : config.x402.horizonPubnetUrl;
}

function getUsdcIssuer(network: "stellar:testnet" | "stellar:pubnet") {
  return network === "stellar:testnet" ? config.x402.usdcIssuerTestnet : config.x402.usdcIssuerPubnet;
}

function toAtomicAmount(amount: number, decimals: number) {
  return Math.round(amount * 10 ** decimals).toString();
}

function facilitatorHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (config.x402.facilitatorApiKey) {
    headers.Authorization = `Bearer ${config.x402.facilitatorApiKey}`;
  }
  return headers;
}

export async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`fetch_timeout:${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function postFacilitator(
  path: "/verify" | "/settle",
  payload: Record<string, unknown>,
  attempts = Math.max(1, config.x402.facilitatorRetries)
): Promise<{ status: number; data: any }> {
  try {
    const res = await fetchWithTimeout(`${config.x402.verifierUrl}${path}`, {
      method: "POST",
      headers: facilitatorHeaders(),
      body: JSON.stringify(payload)
    }, config.x402.facilitatorRequestTimeoutMs);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err: any) {
    if (err.message?.includes("fetch_timeout")) {
      return { status: 408, data: { error: "request_timeout" } };
    }
    // Handle transient network errors by retrying a bounded number of times.
    const isTransientSocketDrop = typeof err?.message === "string" && err.message.includes("other side closed");
    const isTransientFetchTypeError = err?.name === "TypeError";
    if (attempts > 1 && (isTransientSocketDrop || isTransientFetchTypeError)) {
      console.warn(`[x402] Facilitator socket dropped (${err.message}). Retrying...`);
      return postFacilitator(path, payload, attempts - 1);
    }
    throw err;
  }
}

export function buildAnalysisPaymentRequirement(): X402PaymentRequirement {
  const network = normalizeStellarNetwork(config.x402.network);
  const asset = normalizeAssetAddress(config.x402.asset, network);
  return {
    scheme: "exact",
    network,
    asset,
    amount: toAtomicAmount(config.x402.analysisPriceUsd, config.x402.assetDecimals),
    payTo: config.x402.payTo,
    maxTimeoutSeconds: config.x402.maxTimeoutSeconds,
    extra: {
      areFeesSponsored: true,
      amountUsd: config.x402.analysisPriceUsd,
      assetDecimals: config.x402.assetDecimals
    }
  };
}

export function buildAnalysisPaymentRequired(): X402PaymentRequired {
  return {
    x402Version: 2,
    error: "payment_required",
    resource: {
      url: `${config.x402.resourceBaseUrl}/analysis/unlock`,
      description: "Unlock premium market analysis",
      mimeType: "application/json"
    },
    accepts: [buildAnalysisPaymentRequirement()]
  };
}

export function parsePaymentHeader(rawHeader: string | undefined): Record<string, unknown> | null {
  if (!rawHeader) return null;
  const trimmed = rawHeader.trim();
  if (!trimmed) return null;

  const attempts = [trimmed];
  try {
    attempts.push(Buffer.from(trimmed, "base64").toString("utf8"));
  } catch {
    // ignore
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      // continue
    }
  }
  return null;
}

export async function verifyAndOptionallySettleX402(
  paymentHeader: string | undefined,
  requirement: X402PaymentRequirement
): Promise<X402VerifyResult> {
  if (!config.x402.enabled) {
    return { ok: true, reason: "x402_disabled" };
  }
  if (config.x402.demoBypass) {
    if (paymentHeader?.startsWith("demo:")) return { ok: true, reason: "demo_bypass" };
    return { ok: false, reason: "missing_or_invalid_demo_proof" };
  }
  if (!config.x402.payTo) return { ok: false, reason: "x402_payto_not_configured" };

  const paymentPayload = parsePaymentHeader(paymentHeader);
  if (!paymentPayload) return { ok: false, reason: "invalid_payment_header" };

  const x402Version = Number(paymentPayload.x402Version ?? 2);
  const request = { x402Version, paymentPayload, paymentRequirements: requirement };

  const verified = await postFacilitator("/verify", request);
  if (verified.status !== 200 || !verified.data?.isValid) {
    return {
      ok: false,
      reason: String(verified.data?.invalidReason ?? verified.data?.error ?? "verification_failed")
    };
  }

  if (!config.x402.settleOnUnlock) {
    return { ok: true, payer: typeof verified.data?.payer === "string" ? verified.data.payer : undefined };
  }

  const settled = await postFacilitator("/settle", request);
  if (settled.status !== 200 || !settled.data?.success) {
    return {
      ok: false,
      reason: String(settled.data?.errorReason ?? settled.data?.error ?? "settlement_failed")
    };
  }

  return {
    ok: true,
    payer: typeof settled.data?.payer === "string" ? settled.data.payer : undefined,
    transaction: typeof settled.data?.transaction === "string" ? settled.data.transaction : undefined,
    network: typeof settled.data?.network === "string" ? settled.data.network : undefined
  };
}

export async function createAgentPaymentHeader(
  paymentRequired: X402PaymentRequired
): Promise<string> {
  if (!config.x402.agentPrivateKey) {
    throw new Error("x402_agent_private_key_missing");
  }

  const network = normalizeStellarNetwork(config.x402.network);
  const signer = createEd25519Signer(
    config.x402.agentPrivateKey,
    network
  );
  const client = new x402Client().register("stellar:*", new ExactStellarScheme(signer));
  const httpClient = new x402HTTPClient(client);
  const payload = await httpClient.createPaymentPayload(paymentRequired);
  const headers = httpClient.encodePaymentSignatureHeader(payload);
  return headers["PAYMENT-SIGNATURE"] ?? headers["X-PAYMENT"] ?? "";
}

export async function checkStellarPaymentReadiness(address: string): Promise<StellarReadiness> {
  const network = normalizeStellarNetwork(config.x402.network);
  const horizonBase = getHorizonBaseUrl(network).replace(/\/+$/, "");
  const accountRes = await fetchWithTimeout(`${horizonBase}/accounts/${address}`, {
    headers: { Accept: "application/json" }
  }, config.x402.horizonRequestTimeoutMs);

  if (accountRes.status === 404) {
    return {
      ready: false,
      checks: { accountExists: false, trustlineExists: "unknown" },
      hints: [
        "Account not found on the Stellar Testnet.",
        "Action: Use the Stellar Faucet (Friendbot) to initialize this address.",
        "Action: Click 'Add Trustline' in the analysis terminal."
      ]
    };
  }

  if (!accountRes.ok) {
    throw new Error(`horizon_account_lookup_failed:${accountRes.status}`);
  }

  const account = await accountRes.json();
  const balances: any[] = Array.isArray(account?.balances) ? account.balances : [];
  const usdcIssuer = getUsdcIssuer(network);
  const usdcCode = config.x402.usdcAssetCode;

  if (!usdcIssuer) {
    return {
      ready: true,
      checks: { accountExists: true, trustlineExists: "unknown" },
      hints: [
        "USDC issuer is not configured on the server.",
        "Trustline check skipped; payment may still fail if USDC trustline is missing."
      ]
    };
  }

  const usdcBalanceEntry = balances.find((balance) => (
    balance?.asset_type !== "native"
      && String(balance?.asset_code ?? "").toUpperCase() === usdcCode.toUpperCase()
      && String(balance?.asset_issuer ?? "") === usdcIssuer
  ));

  const hasTrustline = !!usdcBalanceEntry;
  const balance = parseFloat(usdcBalanceEntry?.balance ?? "0");
  const hasFunds = balance >= config.x402.analysisPriceUsd;

  const hints: string[] = [];
  if (!hasTrustline) {
    hints.push(`Action Required: Explicitly add the ${usdcCode} trustline via the terminal 'Add Trustline' button.`);
  } else if (!hasFunds) {
    hints.push(`Action Required: Insufficient ${usdcCode} balance. You need at least ${config.x402.analysisPriceUsd} USDC.`);
    hints.push(`Action Required: Use the terminal's 'Fast-Funding' feature to swap XLM for USDC instantly.`);
  }

  return {
    ready: hasTrustline && hasFunds,
    checks: { accountExists: true, trustlineExists: hasTrustline },
    hints
  };
}

export async function getAgentStellarStatus(): Promise<{
  address: string;
  balances: any[];
  network: string;
  ready: boolean;
  usdcIssuer?: string;
  usdcAssetCode?: string;
}> {
  if (!config.x402.agentPrivateKey) {
    throw new Error("agent_private_key_missing");
  }

  const network = normalizeStellarNetwork(config.x402.network);
  const usdcIssuer = getUsdcIssuer(network);
  const usdcAssetCode = config.x402.usdcAssetCode;
  const keypair = Keypair.fromSecret(config.x402.agentPrivateKey);
  const address = keypair.publicKey();
  
  try {
    const horizonBase = getHorizonBaseUrl(network).replace(/\/+$/, "");
    const res = await fetchWithTimeout(`${horizonBase}/accounts/${address}`, {
      headers: { Accept: "application/json" }
    }, config.x402.horizonRequestTimeoutMs);
    if (!res.ok) {
      return { address, balances: [], network, ready: false, usdcIssuer, usdcAssetCode };
    }
    const account = await res.json();
    const balances: any[] = Array.isArray(account?.balances) ? account.balances : [];
    const hasTrustline = !!usdcIssuer && balances.some((balance) => (
      balance?.asset_type !== "native"
        && String(balance?.asset_code ?? "").toUpperCase() === usdcAssetCode.toUpperCase()
        && String(balance?.asset_issuer ?? "") === usdcIssuer
    ));
    const usdcBalance = hasTrustline
      ? parseFloat(
        balances.find((balance) => (
          balance?.asset_type !== "native"
            && String(balance?.asset_code ?? "").toUpperCase() === usdcAssetCode.toUpperCase()
            && String(balance?.asset_issuer ?? "") === usdcIssuer
        ))?.balance ?? "0"
      )
      : 0;
    const ready = !!hasTrustline && usdcBalance >= config.x402.analysisPriceUsd;
    return {
      address,
      balances,
      network,
      ready,
      usdcIssuer,
      usdcAssetCode
    };
  } catch {
    return { address, balances: [], network, ready: false, usdcIssuer, usdcAssetCode };
  }
}

export async function activateAgentAccount(): Promise<{ ok: boolean; hash?: string; message?: string }> {
  if (!config.x402.agentPrivateKey) {
    throw new Error("agent_private_key_missing");
  }

  const network = normalizeStellarNetwork(config.x402.network);
  const networkPassphrase = network === "stellar:testnet" 
    ? "Test SDF Network ; September 2015" 
    : "Public Global Stellar Network ; September 2015";
  
  const keypair = Keypair.fromSecret(config.x402.agentPrivateKey);
  const horizonBase = getHorizonBaseUrl(network).replace(/\/+$/, "");
  const server = new Horizon.Server(horizonBase);

  const usdcIssuer = getUsdcIssuer(network);
  const usdcCode = config.x402.usdcAssetCode;
  if (!usdcIssuer) throw new Error("usdc_issuer_not_configured");

  try {
    const account = await server.loadAccount(keypair.publicKey());
    const usdcAsset = new (StellarSdk as any).Asset(usdcCode, usdcIssuer);

    // Build Atomic Trust + Swap
    const transaction = new (StellarSdk as any).TransactionBuilder(account, {
      fee: "1000",
      networkPassphrase,
    })
      .addOperation((StellarSdk as any).Operation.changeTrust({
        asset: usdcAsset,
      }))
      .addOperation((StellarSdk as any).Operation.pathPaymentStrictSend({
        sendAsset: (StellarSdk as any).Asset.native(),
        sendAmount: "100",
        destination: keypair.publicKey(),
        destAsset: usdcAsset,
        destMin: "1.0",
        path: []
      }))
      .setTimeout(30)
      .build();

    transaction.sign(keypair);
    const res = await server.submitTransaction(transaction);
    return { ok: true, hash: res.hash };
  } catch (err: any) {
    console.error("Agent Activation Error:", err?.response?.data || err.message);
    return { 
      ok: false, 
      message: err?.response?.data?.extras?.result_codes?.operations?.join(",") || err.message 
    };
  }
}

import * as StellarSdk from "@stellar/stellar-sdk";
