import { Keypair, Asset, TransactionBuilder, Networks, BASE_FEE, Operation, Horizon } from "@stellar/stellar-sdk";

async function run() {
  const secret = "SCGRW3IPZKIKBFU62UJUOG7A6AGETPAU55BJAZOMXZ3XPKYHTWVAG5VG";
  const keypair = Keypair.fromSecret(secret);
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  
  console.log("Loading account:", keypair.publicKey());
  
  try {
    console.log("Requesting XLM from Friendbot (in case account is new/empty)...");
    await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
  } catch (e) {
    // ignore
  }

  const account = await server.loadAccount(keypair.publicKey());
  
  const usdcAsset = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
  
  // Check if trustline already exists
  const hasTrustline = account.balances.some(
    (b: any) => b.asset_code === "USDC" && b.asset_issuer === "GA2BYV7QJ75ZAZXQBEDX5CAYXIRMXELJYRK5O6IHF2RLCDKVQU2ZSKBU"
  );

  if (hasTrustline) {
    console.log("Account already has USDC trustline!");
    return;
  }

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: usdcAsset }))
    .setTimeout(30)
    .build();
    
  tx.sign(keypair);
  
  console.log("Submitting transaction to add USDC trustline...");
  const res = await server.submitTransaction(tx);
  console.log("Success! Trustline added. TxHash:", res.hash);
}

run().catch(console.error);
