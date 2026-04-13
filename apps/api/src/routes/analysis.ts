import { FastifyInstance } from "fastify";
import { encodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";
import { generateMarketAnalysis, type AnalysisMarketInput } from "../services/openai.js";
import {
  buildAnalysisPaymentRequired,
  buildAnalysisPaymentRequirement,
  activateAgentAccount,
  checkStellarPaymentReadiness,
  createAgentPaymentHeader,
  getAgentStellarStatus,
  verifyAndOptionallySettleX402
} from "../services/x402.js";

const marketSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(3),
  category: z.string().optional(),
  description: z.string().optional(),
  volume: z.string().optional(),
  liquidity: z.string().optional(),
  endDate: z.string().optional(),
  outcomes: z.array(z.object({
    name: z.string(),
    price: z.number().min(0).max(100)
  })).optional()
});

const requestSchema = z.object({
  actorType: z.enum(["user", "agent"]).default("user"),
  market: marketSchema
});

const agentRequestSchema = z.object({
  market: marketSchema,
  agentId: z.string().optional()
});

function getPaymentQuote() {
  const required = buildAnalysisPaymentRequired();
  return {
    amountUsd: config.x402.analysisPriceUsd,
    rail: "x402",
    ...required,
    memo: "Unlock premium market analysis"
  };
}

async function respondWithAnalysis(
  reply: { header: (name: string, value: string) => unknown },
  actorType: "user" | "agent",
  market: z.infer<typeof marketSchema>,
  settlement: { proof?: string; payer?: string; network?: string },
  requirement = buildAnalysisPaymentRequirement()
) {
  const settledAt = new Date().toISOString();
  const proof = settlement.proof ?? "verified";
  const network = settlement.network ?? config.x402.network;
  const payer = settlement.payer;
  const amountAtomic = requirement.amount;
  const amountUsd = config.x402.analysisPriceUsd;
  const marketInput: AnalysisMarketInput = {
    id: market.id,
    question: market.question,
    category: market.category,
    description: market.description,
    volume: market.volume,
    liquidity: market.liquidity,
    endDate: market.endDate,
    outcomes: market.outcomes?.map((outcome) => ({
      name: outcome.name,
      price: outcome.price
    }))
  };
  const analysis = await generateMarketAnalysis(marketInput, actorType);
  reply.header(
    "PAYMENT-RESPONSE",
    encodePaymentResponseHeader({
      success: true,
      payer,
      transaction: proof,
      network: network as `${string}:${string}`
    })
  );
  return {
    ok: true,
    marketId: market.id,
    actorType,
    analysis,
    settlement: {
      rail: "x402",
      proof,
      payer,
      network,
      amountUsd,
      settledAt
    },
    receipt: {
      id: randomUUID(),
      rail: "x402",
      network,
      asset: requirement.asset,
      amountAtomic,
      amountUsd,
      payTo: requirement.payTo,
      payer,
      txHash: proof,
      settledAt
    }
  };
}

export async function analysisRoutes(app: FastifyInstance): Promise<void> {
  app.get("/analysis/agent-status", async (req, reply) => {
    try {
      const status = await getAgentStellarStatus();
      return { ok: true, status };
    } catch (error: any) {
      reply.status(500);
      return { ok: false, error: "agent_status_fetch_failed", message: error?.message };
    }
  });

  app.post("/analysis/activate-agent", async (req, reply) => {
    try {
      const result = await activateAgentAccount();
      if (!result.ok) {
        reply.status(400);
        return { ok: false, error: "agent_activation_failed", message: result.message };
      }
      return { ok: true, hash: result.hash };
    } catch (error: any) {
      reply.status(500);
      return { ok: false, error: "internal_error", message: error.message };
    }
  });

  app.get("/analysis/quote", async () => {
    return {
      ok: true,
      quoteId: randomUUID(),
      ...getPaymentQuote()
    };
  });

  app.get("/analysis/payment-readiness", async (req, reply) => {
    const address = String((req.query as { address?: string } | undefined)?.address ?? "").trim();
    if (!address) {
      reply.status(400);
      return { ok: false, error: "missing_address" };
    }
    try {
      const readiness = await checkStellarPaymentReadiness(address);
      return { ok: true, address, ...getPaymentQuote(), readiness };
    } catch (error: any) {
      reply.status(502);
      return {
        ok: false,
        error: "payment_readiness_check_failed",
        message: String(error?.message ?? "unknown_error")
      };
    }
  });

  app.post("/analysis/unlock", async (req, reply) => {
    const payload = requestSchema.safeParse(req.body ?? null);
    if (!payload.success) {
      reply.status(400);
      return { ok: false, error: "invalid_payload", issues: payload.error.issues };
    }

    const requirement = buildAnalysisPaymentRequirement();
    const rawAuth = String(req.headers["authorization"] ?? "");
    const paymentSignature = String(
      req.headers["payment-signature"] ?? 
      req.headers["x-payment"] ?? 
      req.headers["x402-settlement-proof"] ?? 
      (rawAuth.toLowerCase().startsWith("x402 ") ? rawAuth.slice(5) : rawAuth.toLowerCase().startsWith("bearer ") ? rawAuth.slice(7) : rawAuth) ??
      ""
    ).trim();
    const payment = await verifyAndOptionallySettleX402(paymentSignature, requirement);
    if (!payment.ok) {
      reply.status(402);
      const required = buildAnalysisPaymentRequired();
      reply.header("PAYMENT-REQUIRED", encodePaymentRequiredHeader(required));
      return {
        ...required,
        reason: payment.reason ?? "payment_required"
      };
    }

    const { actorType, market } = payload.data;
    return respondWithAnalysis(reply, actorType, market, {
      proof: payment.transaction ?? "verified",
      payer: payment.payer,
      network: payment.network
    }, requirement);
  });

  app.post("/analysis/unlock-agent-paid", async (req, reply) => {
    const payload = agentRequestSchema.safeParse(req.body ?? null);
    if (!payload.success) {
      reply.status(400);
      return { ok: false, error: "invalid_payload", issues: payload.error.issues };
    }
    const required = buildAnalysisPaymentRequired();
    const requirement = required.accepts[0];
    const paymentSignature = String(
      req.headers["payment-signature"] ?? req.headers["x-payment"] ?? req.headers["x402-settlement-proof"] ?? ""
    );
    const payment = await verifyAndOptionallySettleX402(paymentSignature, requirement);
    if (!payment.ok) {
      reply.status(402);
      reply.header("PAYMENT-REQUIRED", encodePaymentRequiredHeader(required));
      return {
        ...required,
        reason: payment.reason ?? "payment_required"
      };
    }

    return respondWithAnalysis(reply, "agent", payload.data.market, {
      proof: payment.transaction ?? "verified",
      payer: payment.payer,
      network: payment.network
    }, requirement);
  });

  app.post("/analysis/unlock-agent", async (req, reply) => {
    const payload = requestSchema.safeParse(req.body ?? null);
    if (!payload.success) {
      reply.status(400);
      return { ok: false, error: "invalid_payload", issues: payload.error.issues };
    }
    try {
      const required = buildAnalysisPaymentRequired();
      const paymentHeader = await createAgentPaymentHeader(required);
      const payment = await verifyAndOptionallySettleX402(paymentHeader, required.accepts[0]);
      if (!payment.ok) {
        reply.status(402);
        reply.header("PAYMENT-REQUIRED", encodePaymentRequiredHeader(required));
        return {
          ...required,
          reason: payment.reason ?? "agent_payment_failed"
        };
      }

      return respondWithAnalysis(reply, "agent", payload.data.market, {
        proof: payment.transaction ?? "agent-auto-payment",
        payer: payment.payer,
        network: payment.network
      });
    } catch (error: any) {
      const message = String(error?.message ?? "unknown_error");
      const lower = message.toLowerCase();

      if (
        lower.includes("trustline entry is missing") ||
        lower.includes("invalid stellar asset address") ||
        lower.includes("arefeessponsored") ||
        lower.includes("unsupported stellar asset")
      ) {
        reply.status(402);
        return {
          ok: false,
          error: "agent_payment_not_ready",
          message,
          hints: [
            "Set X402_NETWORK to stellar:testnet or stellar:pubnet.",
            "For USDC, use X402_ASSET=USDC (auto-mapped to the correct Stellar contract).",
            "Fund the agent account with test USDC and ensure the USDC trustline exists."
          ]
        };
      }

      reply.status(500);
      return { ok: false, error: "agent_unlock_failed", message };
    }
  });
}
