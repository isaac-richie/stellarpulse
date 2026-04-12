const StellarSdk = require('@stellar/stellar-sdk');
const fetch = require('node-fetch');

const secret = 'SCGRW3IPZKIKBFU62UJUOG7A6AGETPAU55BJAZOMXZ3XPKYHTWVAG5VG';
const keypair = StellarSdk.Keypair.fromSecret(secret);
const address = keypair.publicKey();
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

async function fund() {
  console.log(`Funding Agent: ${address}`);

  // 1. Friendbot
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
    await res.json();
    console.log('Friendbot: XLM Injected.');
  } catch (e) {
    console.log('Friendbot: Likely already funded.');
  }

  // 2. Load Account
  const account = await server.loadAccount(address);
  const usdcAsset = new StellarSdk.Asset(
    'USDC',
    'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
  );

  // Check if trustline exists
  const hasTrustline = account.balances.some(b => b.asset_code === 'USDC');

  const txBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  });

  if (!hasTrustline) {
    console.log('Adding USDC Trustline...');
    txBuilder.addOperation(StellarSdk.Operation.changeTrust({ asset: usdcAsset }));
  }

  // 3. Swap 1000 XLM for USDC
  console.log('Swapping 1000 XLM for USDC...');
  txBuilder.addOperation(
    StellarSdk.Operation.pathPaymentStrictSend({
      sendAsset: StellarSdk.Asset.native(),
      sendAmount: '1000',
      destination: address,
      destAsset: usdcAsset,
      destMin: '1', // At least 1 USDC
      path: [],
    })
  );

  const tx = txBuilder.setTimeout(30).build();
  tx.sign(keypair);

  try {
    const result = await server.submitTransaction(tx);
    console.log('Success! Agent funded and ready for demo.');
    
    // Check final balance
    const finalAccount = await server.loadAccount(address);
    const usdc = finalAccount.balances.find(b => b.asset_code === 'USDC');
    console.log(`Final Agent Balance: ${usdc?.balance ?? '0'} USDC`);
  } catch (err) {
    console.error('Funding failed:', err.data?.extras?.result_codes || err.message);
  }
}

fund();
