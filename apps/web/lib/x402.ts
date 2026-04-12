import { wrapFetchWithPayment, x402Client } from "@x402/fetch"
import { ExactStellarScheme } from "@x402/stellar"
import { getAddress, requestAccess, signAuthEntry, signTransaction } from "@stellar/freighter-api"

async function getFreighterAddress() {
  const access = await requestAccess() as any
  if (access?.error) {
    throw new Error(access.error.message || "Freighter access denied")
  }
  const accessAddr = typeof access === "string" ? access : access?.address
  if (accessAddr) return accessAddr

  const addr = await getAddress() as any
  if (addr?.error) {
    throw new Error(addr.error.message || "Unable to read Freighter address")
  }
  
  const finalAddr = typeof addr === "string" ? addr : addr?.address
  if (!finalAddr) {
    throw new Error("Unable to read Freighter address")
  }
  return finalAddr
}

export async function createFreighterPaymentFetch() {
  const address = await getFreighterAddress()
  const signer = {
    address,
    signAuthEntry: async (
      authEntry: string,
      opts?: { networkPassphrase?: string; address?: string }
    ) => {
      try {
        const result = await signAuthEntry(authEntry, {
          networkPassphrase: opts?.networkPassphrase ?? "Test SDF Network ; September 2015",
          accountToSign: opts?.address ?? address,
        } as any) as any

        if (result?.error) {
          throw new Error(result.error.message || "Freighter returned an error")
        }

        const signedAuthEntry = typeof result === "string" ? result : result?.signedAuthEntry
        if (!signedAuthEntry) {
          throw new Error("No signature returned from Freighter")
        }

        return {
          signedAuthEntry,
          signerAddress: opts?.address ?? address,
        }
      } catch (err: any) {
         throw new Error(err?.message || "Freighter failed to sign auth entry")
      }
    },
  }

  const client = new x402Client().register("stellar:*", new ExactStellarScheme(signer as any))
  return wrapFetchWithPayment(fetch, client)
}

import * as StellarSdk from "@stellar/stellar-sdk"

export async function addUsdcTrustline() {
  const address = await getFreighterAddress()
  const network = "TESTNET"
  const networkPassphrase = "Test SDF Network ; September 2015"
  const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org")

  // USDC Testnet (User Wallet Match)
  const usdcAsset = new StellarSdk.Asset(
    "USDC",
    "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
  )

  const account = await server.loadAccount(address)
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: usdcAsset,
      })
    )
    .setTimeout(30)
    .build()

  const xdr = transaction.toXDR()
  console.log("Stellar: Initiating Signature Handshake [testnet]")
  const signedResult = await signTransaction(xdr, {
    networkPassphrase: "Test SDF Network ; September 2015",
    address,
  }) as any

  if (signedResult?.error) {
    throw new Error(signedResult.error.message || "Freighter failed to sign trustline transaction")
  }

  const signedXdr = typeof signedResult === "string" ? signedResult : signedResult?.signedTransaction
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
  const response = await server.submitTransaction(tx)
  return response
}

export async function connectFreighterWallet() {
  return getFreighterAddress()
}

export async function swapXlmForUsdc() {
  const address = await getFreighterAddress()
  const network = "TESTNET"
  const networkPassphrase = "Test SDF Network ; September 2015"
  const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org")

  const usdcAsset = new StellarSdk.Asset(
    "USDC",
    "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
  )

  const account = await server.loadAccount(address)
  
  // Swap 100 XLM for USDC (PathPaymentStrictSend)
  // This ensures the demo is self-funding even with 0 USDC
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: StellarSdk.Asset.native(),
        sendAmount: "100",
        destination: address,
        destAsset: usdcAsset,
        destMin: "0.1",
        path: []
      })
    )
    .setTimeout(30)
    .build()

  const xdr = transaction.toXDR()
  const signedResult = await signTransaction(xdr, {
    networkPassphrase: "Test SDF Network ; September 2015",
    address,
  }) as any

  if (signedResult?.error) {
    throw new Error(signedResult.error.message || "Freighter failed to sign swap")
  }

  const signedXdr = typeof signedResult === "string" ? signedResult : signedResult?.signedTransaction
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
  return server.submitTransaction(tx)
}
