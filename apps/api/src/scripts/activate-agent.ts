import * as StellarSdk from "@stellar/stellar-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const AGENT_SECRET = process.env.X402_AGENT_STELLAR_PRIVATE_KEY;
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const USDC_CODE = "USDC";

async function activateAgent() {
  if (!AGENT_SECRET) {
    console.error("❌ X402_AGENT_STELLAR_PRIVATE_KEY missing from .env");
    return;
  }

  const kp = StellarSdk.Keypair.fromSecret(AGENT_SECRET);
  const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
  const networkPassphrase = StellarSdk.Networks.TESTNET;

  console.log(`🚀 Activating Agent: ${kp.publicKey()}`);

  try {
    const account = await server.loadAccount(kp.publicKey());
    const usdcAsset = new StellarSdk.Asset(USDC_CODE, USDC_ISSUER);

    // 1. Add Trustline + Swap in one transaction
    console.log("➡️ Building Activation Transaction (Trustline + Swap)...");
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: usdcAsset,
        })
      )
      .addOperation(
        StellarSdk.Operation.pathPaymentStrictSend({
          sendAsset: StellarSdk.Asset.native(),
          sendAmount: "100",
          destination: kp.publicKey(),
          destAsset: usdcAsset,
          destMin: "1.0",
          path: []
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(kp);
    
    console.log("➡️ Submitting to Horizon...");
    const res = await server.submitTransaction(tx);
    console.log("🎉 SUCCESS! Agent is now Trustline-Aligned and Funded.");
    console.log(`🔗 Tx Hash: ${res.hash}`);
  } catch (err: any) {
    console.error("💥 Activation failed:", err?.response?.data || err.message);
  }
}

activateAgent();
