import { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { getAgentStellarStatus } from "../services/x402.js";
import { Keypair } from "@stellar/stellar-sdk";

interface HorizonPayment {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  from: string;
  to: string;
  amount: string;
}

interface LedgerEntry {
  id: string;
  type: "debit" | "credit";
  amount: string;
  asset: string;
  counterparty: string;
  txHash: string;
  timestamp: string;
  memo?: string;
}

/**
 * Agent Economic HUD routes
 * Provides real-time agent treasury data and transaction ledger
 */
export async function agentRoutes(app: FastifyInstance): Promise<void> {

  // Full agent economic profile for the HUD
  app.get("/agent/profile", async (_req, reply) => {
    try {
      const status = await getAgentStellarStatus();

      // Parse balances into a clean format
      const balances = (status.balances ?? []).map((b: any) => ({
        asset: b.asset_type === "native" ? "XLM" : (b.asset_code ?? "UNKNOWN"),
        issuer: b.asset_issuer ?? null,
        balance: b.balance ?? "0",
        type: b.asset_type ?? "unknown"
      }));

      // Calculate total USDC balance
      const usdcBalance = balances
        .filter((b: any) => b.asset === "USDC")
        .reduce((sum: number, b: any) => sum + parseFloat(b.balance), 0);

      const xlmBalance = balances
        .filter((b: any) => b.asset === "XLM")
        .reduce((sum: number, b: any) => sum + parseFloat(b.balance), 0);

      return {
        ok: true,
        agent: {
          address: status.address,
          network: status.network,
          ready: status.ready,
          balances,
          treasury: {
            usdc: usdcBalance.toFixed(7),
            xlm: xlmBalance.toFixed(7),
          },
          config: {
            analysisPriceUsd: config.x402.analysisPriceUsd,
            maxBudgetPerDay: Number(process.env.AGENT_MAX_BUDGET_PER_DAY ?? 5.0),
            autoFundEnabled: (process.env.AGENT_AUTO_FUND ?? "false") === "true",
          },
        },
      };
    } catch (error: any) {
      reply.status(500);
      return { ok: false, error: "agent_profile_failed", message: error?.message };
    }
  });

  // Agent transaction ledger from Horizon
  app.get("/agent/ledger", async (req, reply) => {
    const limit = Math.min(Number((req.query as any)?.limit ?? 25), 50);

    if (!config.x402.agentPrivateKey) {
      reply.status(400);
      return { ok: false, error: "agent_not_configured" };
    }

    try {
      const keypair = Keypair.fromSecret(config.x402.agentPrivateKey);
      const address = keypair.publicKey();
      const network = config.x402.network.includes("testnet") ? "testnet" : "pubnet";
      const horizonBase = network === "testnet"
        ? config.x402.horizonTestnetUrl
        : config.x402.horizonPubnetUrl;

      // Fetch recent payments from Horizon
      const paymentsRes = await fetch(
        `${horizonBase.replace(/\/+$/, "")}/accounts/${address}/payments?limit=${limit}&order=desc`,
        { headers: { Accept: "application/json" } }
      );

      if (!paymentsRes.ok) {
        throw new Error(`horizon_payments_failed:${paymentsRes.status}`);
      }

      const paymentsData = await paymentsRes.json();
      const records: HorizonPayment[] = paymentsData?._embedded?.records ?? [];

      // Transform into ledger entries
      const ledger: LedgerEntry[] = records
        .filter((r) => r.type === "payment" || r.type === "path_payment_strict_send" || r.type === "path_payment_strict_receive")
        .map((r) => {
          const isDebit = r.from === address;
          return {
            id: r.id,
            type: isDebit ? "debit" as const : "credit" as const,
            amount: r.amount,
            asset: r.asset_type === "native" ? "XLM" : (r.asset_code ?? "UNKNOWN"),
            counterparty: isDebit ? r.to : r.from,
            txHash: r.transaction_hash,
            timestamp: r.created_at,
          };
        });

      // Calculate daily spend (last 24h debits in USDC)
      const now = Date.now();
      const oneDayAgo = now - 86400000;
      const dailySpend = ledger
        .filter((e) => e.type === "debit" && e.asset === "USDC" && new Date(e.timestamp).getTime() > oneDayAgo)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const totalSettlements = ledger.filter((e) => e.type === "debit" && e.asset === "USDC").length;

      return {
        ok: true,
        address,
        network,
        ledger,
        stats: {
          dailySpendUsdc: dailySpend.toFixed(4),
          totalSettlements,
          maxBudgetPerDay: Number(process.env.AGENT_MAX_BUDGET_PER_DAY ?? 5.0),
          budgetUtilization: Math.min(100, (dailySpend / Number(process.env.AGENT_MAX_BUDGET_PER_DAY ?? 5.0)) * 100).toFixed(1),
        },
      };
    } catch (error: any) {
      reply.status(502);
      return { ok: false, error: "ledger_fetch_failed", message: error?.message };
    }
  });

  // Agent health check (lightweight)
  app.get("/agent/health", async () => {
    const hasKey = !!config.x402.agentPrivateKey;
    let address = "";
    if (hasKey) {
      try {
        address = Keypair.fromSecret(config.x402.agentPrivateKey).publicKey();
      } catch { /* ignore */ }
    }
    return {
      ok: hasKey,
      address,
      network: config.x402.network,
      pricePerUnlock: config.x402.analysisPriceUsd,
    };
  });
}
