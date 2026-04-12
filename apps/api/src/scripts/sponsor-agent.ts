import * as StellarSdk from "@stellar/stellar-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const SERVICE_URL = "https://stellar-sponsored-agent-account.onrender.com";
const AGENT_SECRET = process.env.X402_AGENT_STELLAR_PRIVATE_KEY;

async function sponsorAgent() {
  if (!AGENT_SECRET) {
    console.error("❌ X402_AGENT_STELLAR_PRIVATE_KEY missing from .env");
    return;
  }

  const kp = StellarSdk.Keypair.fromSecret(AGENT_SECRET);
  const public_key = kp.publicKey();
  console.log(`🚀 Starting sponsorship for Agent: ${public_key}`);

  try {
    // 1. Create sponsorship transaction
    console.log("➡️ Requesting sponsorship from service...");
    const createRes = await fetch(`${SERVICE_URL}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_key }),
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      console.error("❌ Sponsorship request failed:", createData);
      return;
    }

    const { xdr, network_passphrase } = createData;
    console.log("✅ Sponsorship XDR received.");

    // 2. Sign the transaction
    console.log("✍️ Signing transaction with agent keys...");
    const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, network_passphrase);
    tx.sign(kp);
    const signedXdr = tx.toXDR();

    // 3. Submit
    console.log("➡️ Submitting signed transaction to service...");
    const submitRes = await fetch(`${SERVICE_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xdr: signedXdr }),
    });

    const submitData = await submitRes.json();
    if (!submitRes.ok) {
      console.error("❌ Submission failed:", submitData);
      return;
    }

    console.log("🎉 SUCCESS! Agent is now sponsored and trustline-ready.");
    console.log("🔗 View on Stellar Expert:", submitData.explorer_url);
  } catch (error) {
    console.error("💥 Unexpected error:", error);
  }
}

sponsorAgent();
