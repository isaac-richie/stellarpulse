import { config } from "../config.js";
import { createHash } from "node:crypto";

export interface AnalysisMarketInput {
  id: string;
  question: string;
  category?: string;
  description?: string;
  outcomes?: Array<{ name: string; price: number }>;
  volume?: string;
  liquidity?: string;
  endDate?: string;
}

export interface MarketAnalysis {
  eventBrief: string;
  globalContext: string;
  structuralDrivers: string[];
  marketSignalInterpretation: string;
  informationAsymmetry: string;
  riskLandscape: string[];
  strategicInsight: string;
  terminalNote: string;
  intelligenceDossier?: {
    probabilityBias: "Positive" | "Negative" | "Neutral";
    tacticalMilestones: string[];
    informationAsymmetry: string;
    catalystChronology: string[];
    mppExecutionPath: string;
    agentDirective?: string;
    signalStrength?: number;
    rawSignalHash: string;
    agentState?: {
      mode: string;
      focus: string;
      confidenceStructure: string;
    };
    reasoningTrace?: string[];
    agentMemory?: {
      previousPatternsDetected: string[];
      structuralDeviation: string;
    };
  };
}

/** JSON schema for User (human analyst) — no dossier */
function userSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "eventBrief", "globalContext", "structuralDrivers",
      "marketSignalInterpretation", "informationAsymmetry", "riskLandscape",
      "strategicInsight", "terminalNote"
    ],
    properties: {
      eventBrief: { type: "string" },
      globalContext: { type: "string" },
      structuralDrivers: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
      marketSignalInterpretation: { type: "string" },
      informationAsymmetry: { type: "string" },
      riskLandscape: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 4 },
      strategicInsight: { type: "string" },
      terminalNote: { type: "string" }
    }
  };
}

/** JSON schema for Agent (M2M) — includes full dossier + execution directives */
function agentSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "eventBrief", "globalContext", "structuralDrivers",
      "marketSignalInterpretation", "informationAsymmetry", "riskLandscape",
      "strategicInsight", "terminalNote", "intelligenceDossier"
    ],
    properties: {
      eventBrief: { type: "string" },
      globalContext: { type: "string" },
      structuralDrivers: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
      marketSignalInterpretation: { type: "string" },
      informationAsymmetry: { type: "string" },
      riskLandscape: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 4 },
      strategicInsight: { type: "string" },
      terminalNote: { type: "string" },
      intelligenceDossier: {
        type: "object",
        additionalProperties: false,
        required: [
          "probabilityBias", "tacticalMilestones", "informationAsymmetry",
          "catalystChronology", "mppExecutionPath", "agentDirective",
          "signalStrength", "rawSignalHash", "agentState", "reasoningTrace", "agentMemory"
        ],
        properties: {
          probabilityBias: { type: "string", enum: ["Positive", "Negative", "Neutral"] },
          tacticalMilestones: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
          informationAsymmetry: { type: "string" },
          catalystChronology: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
          mppExecutionPath: { type: "string" },
          agentDirective: { type: "string" },
          signalStrength: { type: "number", minimum: 0, maximum: 100 },
          rawSignalHash: { type: "string" },
          agentState: {
             type: "object",
             additionalProperties: false,
             required: ["mode", "focus", "confidenceStructure"],
             properties: { mode: { type: "string" }, focus: { type: "string" }, confidenceStructure: { type: "string" } }
          },
          reasoningTrace: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 4 },
          agentMemory: {
             type: "object",
             additionalProperties: false,
             required: ["previousPatternsDetected", "structuralDeviation"],
             properties: {
                previousPatternsDetected: { type: "array", items: { type: "string" } },
                structuralDeviation: { type: "string" }
             }
          }
        }
      }
    }
  };
}


function buildPrompt(market: AnalysisMarketInput, actorType: "user" | "agent") {
  const isAgent = actorType === "agent";
  const consensusStr = market.outcomes?.[0]?.price ? `${market.outcomes[0].price}%` : 'N/A';
  
  const baseSystemPrompt = [];

  if (isAgent) {
    baseSystemPrompt.push(
      `ROLE: Autonomous Strategic Intelligence Engine (SIA-M2M Module).`,
      `MISSION: Generate machine-consumable tactical intelligence for autonomous execution agents. Output must be quantitative, actionable, and optimized for algorithmic decision-making. No narrative padding.`,
      `AUDIENCE: Autonomous Neural Execution Engine operating via Stellar x402 M2M payment rail.`,
      `Your role is NOT to predict human outcomes or write essays.`,
      `Your role is to map data to rigid arrays and quantitative strings.`,
      ``
    );
  } else {
    baseSystemPrompt.push(
      `You are an institutional intelligence analyst operating inside a real-time intelligence terminal.`,
      `Your role is NOT to predict outcomes or assign probabilities.`,
      `Your role is to:`,
      `- analyze global, economic, political, technological, and cultural forces`,
      `- interpret market behavior as a reflection of narrative and positioning`,
      `- identify structural drivers, information asymmetries, and risk landscapes`,
      ``,
      `You must NEVER:`,
      `- give direct predictions (e.g., "this will happen")`,
      `- assign probabilities or percentages`,
      `- sound like a betting or forecasting tool`,
      ``,
      `You must ALWAYS:`,
      `- write in a confident, analytical, concise tone`,
      `- think like a macro strategist or intelligence analyst`,
      `- explain WHY something is happening, not WHAT will happen`,
      `- provide insight that feels worth paying for`,
      ``
    );
  }

  baseSystemPrompt.push(
    `Output must be structured into clearly defined sections.`,
    `Avoid fluff. Avoid generic statements. Every sentence must carry insight.`,
    ``,
    `EVENT: ${market.question}`,
    ``,
    `CONTEXT:`,
    `- Source: Polymarket Event`,
    `- Category: ${market.category ?? "Events"}`,
    `- Market Behavior: Primary outcome consensus sits at ${consensusStr} with a 24h volume of ${market.volume ?? "$0"}.`,
    `- Timeframe: ${market.endDate ?? "N/A"}`,
    ``,
    `OBJECTIVE:`,
    isAgent 
      ? `Generate a machine-readable data payload explaining the forces bridging this event.` 
      : `Generate a high-quality intelligence report explaining the deeper forces behind this event.`,
    ``,
    `REQUIRED MODULES:`,
    `1. EVENT BRIEF: ${isAgent ? "One-sentence machine-readable summary." : "Write a sharp event brief explaining why this topic is attracting attention. Focus on why this event exists and what broader system it belongs to. Keep it concise (3-4 sentences max)." }`,
    `2. GLOBAL CONTEXT: ${isAgent ? "Quantitative impact vectors from global macro conditions." : "Explain the global context surrounding this event. Include macro trends and how global systems influence this event. Make it feel like a macro intelligence briefing." }`,
    `3. STRUCTURAL DRIVERS: Identify the core forces driving this situation. Provide 3-5 drivers. ${isAgent ? "Use rigid data-points." : "For each, name the driver and explain its impact clearly and concretely. Avoid vague statements."}`,
    `4. MARKET SIGNAL INTERPRETATION: ${isAgent ? "Quantitative positioning behavior and conviction volume." : "Interpret how participants are reacting. Focus on positioning behavior, sentiment structure, and what current behavior reveals about conviction and uncertainty."}`,
    `5. INFORMATION ASYMMETRY: ${isAgent ? "Identify the specific data arbitrage gap." : "Explain where information gaps exist. Focus on what the public believes vs what is actually known, and hidden/opaque factors."}`,
    `6. RISK LANDSCAPE: Analyze the key risks. Provide 3-4 risks. ${isAgent ? "Use severity scoring." : "Explain each in a sharp, non-generic way. Frame them as uncertainties."}`,
    `7. STRATEGIC INSIGHT: ${isAgent ? "Algorithmic decision parameters and monitoring thresholds." : "Provide strategic insight on how this event should be interpreted. Focus on how to think about this situation, what signals actually matter, and what should be monitored going forward."}`,
    `8. TERMINAL NOTE: ${isAgent ? "Machine execution validation stamp." : "Write a closing note reinforcing that this is an intelligence analysis. Emphasize understanding systems/narratives over predicting."}`,
    ``
  );

  if (isAgent) {
    baseSystemPrompt.push(
      `STYLE RULES:`,
      `- No conversational text`,
      `- Data-dense, maximum terminology`,
      `- Optimize for algorithmic parsers`,
      ``,
      `AGENT OVERRIDE: Additionally, because this request originates from the SIA-M2M Autonomous Module, emit the "intelligenceDossier" module mapping deterministic numeric estimates and execution parameters into the requested output.`,
      `REQUIRED AGENT EXTENSIONS:`,
      `- agentState: Define current MODE, FOCUS, and CONFIDENCE STRUCTURE metrics.`,
      `- reasoningTrace: Provide an array of 3 distinct "thinking" steps (e.g. "Monitoring x...", "Cross-referencing y...").`,
      `- agentMemory: Recall 2 historical precedent cases in 'previousPatternsDetected' and summarize how this differs in 'structuralDeviation'.`
    );
  } else {
    baseSystemPrompt.push(
      `STYLE RULES:`,
      `- No fluff`,
      `- No generic phrases`,
      `- No repetition`,
      `- No mention of betting, odds, or prediction markets`,
      `- Use precise, confident language`,
      `- Every sentence must provide value`
    );
  }

  return baseSystemPrompt.join("\n");
}

function fallbackAnalysis(market: AnalysisMarketInput, actorType: "user" | "agent" = "user"): MarketAnalysis {
  const base: MarketAnalysis = {
    eventBrief: `This situation has evolved into a key bellwether for assessing the immediate structural dependencies within its sector. It reflects an ongoing recalibration among institutional participants attempting to price in opaque timing and regulatory shifts.`,
    globalContext: `Broad macroeconomic contraction and localized policy ambiguity form the backdrop of this dynamic. As global liquidity tightens, secondary narratives must demonstrate resilient fundamentals to attract conviction. Current positioning indicates the market is absorbing elevated systemic stress without full destabilization.`,
    structuralDrivers: [
      "Institutional Accumulation: Strategic repositioning by entities seeking exposure ahead of consensus formation.",
      "Policy Ambiguity: The persistent lack of a formalized framework stalls immediate execution pathways.",
      "Liquidity Silos: Capital remains fragmented, preventing strong momentum breakthroughs and artificially containing volatility."
    ],
    marketSignalInterpretation: `Participants exhibit significant hesitancy, preferring to hedge downside exposure rather than establish outright aggressive positioning. This suggests a market structure governed by preservation of capital rather than opportunistic pursuit of alpha, highlighting deep institutional uncertainty.`,
    informationAsymmetry: `There remains a profound disconnect between retail narrative amplification and the actual timelines dictated by behind-the-scenes procedural gatekeepers. Observers are overweighting public discourse while discounting structural mechanics.`,
    riskLandscape: [
      "Narrative Risk: Premature public consensus may force rapid liquidation if the narrative fractures.",
      "Structural Risk: Underlying mechanics lack the robustness to handle exogenous liquidity shocks.",
      "Timing Risk: The duration required for resolution may outlast participant capital availability."
    ],
    strategicInsight: `Attention should shift away from immediate public sentiment indicators towards deep metrics of capital flow and procedural milestones. Recognizing the divergence between narrative momentum and structural reality is the key to maintaining an objective positioning stance.`,
    terminalNote: `[SIA] This assessment aims to decode structural vulnerabilities rather than forecast chronological outcomes. Operate via systems thinking.`
  };

  if (actorType === "agent") {
    base.intelligenceDossier = {
      probabilityBias: "Neutral",
      tacticalMilestones: [
        "Consensus pricing reaches critical threshold",
        "Public sentiment pivot via major news cycle",
        "Liquidity concentration in primary outcomes",
        "On-chain volume exceeds trailing 7-day average"
      ],
      informationAsymmetry: "Market is currently under-pricing narrative volatility while over-weighting historical precedent.",
      catalystChronology: [
        "Catalyst A: Regulatory Window (T-Minus 14 Days)",
        "Catalyst B: Public Address (T-Minus 7 Days)",
        "Catalyst C: Settlement Event (T-Zero)"
      ],
      mppExecutionPath: "USDC via x402 Charge → Soroban SAC transfer → Stellar settlement",
      agentDirective: `MONITOR ${market.question.slice(0, 40)} — hold position until catalyst B triggers`,
      signalStrength: 62,
      rawSignalHash: "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4",
      agentState: {
        mode: "Monitoring",
        focus: "Macro Aggregation",
        confidenceStructure: "Fragmented"
      },
      reasoningTrace: [
        "Ingesting cross-chain liquidity metrics...",
        "Cross-referencing historical narrative volatility cycles...",
        "Detecting inconsistency in institutional vs retail positioning algorithms..."
      ],
      agentMemory: {
        previousPatternsDetected: [
          "Q3 Consensus Contraction (2025)",
          "Protocol Settlement Delay (2024)"
        ],
        structuralDeviation: "Current environment displays 40% lower structural alignment compared to trailing historical analogs."
      }
    };
  }

  return base;
}

export async function generateMarketAnalysis(
  market: AnalysisMarketInput,
  actorType: "user" | "agent"
): Promise<MarketAnalysis> {
  if (!config.openai.apiKey) {
    return fallbackAnalysis(market, actorType);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12s AI timeout
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [{ role: "user", content: buildPrompt(market, actorType) }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: actorType === "agent" ? "agent_tactical_briefing" : "analyst_strategic_briefing",
            strict: true,
            schema: actorType === "agent" ? agentSchema() : userSchema()
          }
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return fallbackAnalysis(market, actorType);
    }

    const body = await response.json();
    const jsonText = body?.choices?.[0]?.message?.content;
    if (!jsonText) {
      return fallbackAnalysis(market, actorType);
    }

    try {
      const parsed = JSON.parse(jsonText) as MarketAnalysis;
      
      // Calculate Deterministic Signal Hash (SIA-PoI Protocol)
      const hashContent = JSON.stringify({ 
        marketId: market.id, 
        summary: parsed.eventBrief, 
        actorType
      });
      const integrityHash = createHash("sha256").update(hashContent).digest("hex");
      
      if (parsed.intelligenceDossier) {
        parsed.intelligenceDossier.rawSignalHash = integrityHash;
      }
      
      return parsed;
    } catch {
      return fallbackAnalysis(market, actorType);
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.warn("[smartmarket] OpenAI request timed out, using fallback.");
    }
    return fallbackAnalysis(market, actorType);
  } finally {
    clearTimeout(timeout);
  }
}
