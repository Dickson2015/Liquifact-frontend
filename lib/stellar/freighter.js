import { requestAccess, signTransaction as freighterSign, getNetwork } from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "./network.js";

/** True when a Freighter-compatible wallet injected its API into the page. */
export function isFreighterAvailable() {
  return typeof window !== "undefined" && Boolean(window.FreighterApi ?? window.freighterApi);
}

/**
 * Ask the wallet for access. Resolves to the investor's address.
 * Throws with a human-readable message on rejection or missing wallet.
 */
export async function connectFreighter() {
  if (!isFreighterAvailable()) {
    throw new Error("No Stellar wallet found. Install Freighter to fund on-chain.");
  }
  const { address, error } = await requestAccess();
  if (error) throw new Error(error.message || "Wallet access was rejected.");
  if (!address) throw new Error("Wallet did not return an address.");
  return address;
}

/**
 * Sign a transaction XDR with Freighter and return the signed XDR.
 * Throws when the wallet is on the wrong network.
 */
export async function signTransactionXdr(xdr, { address, networkPassphrase = NETWORK_PASSPHRASE } = {}) {
  const net = await getNetwork().catch(() => null);
  if (net?.networkPassphrase && net.networkPassphrase !== networkPassphrase) {
    throw new Error(`Freighter is on the wrong network. Switch it to ${networkPassphrase}.`);
  }
  const res = await freighterSign(xdr, { address, networkPassphrase });
  if (res?.error) throw new Error(res.error.message || "Transaction signing was rejected.");
  if (!res?.signedTxXdr) throw new Error("Wallet did not return a signed transaction.");
  return res.signedTxXdr;
}
