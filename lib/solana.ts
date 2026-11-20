import { createClient } from "@solana/kit";
import { solanaDevnetRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { systemProgram } from "@solana-program/system";
import { tokenProgram } from "@solana-program/token";
import { favoritesProgram } from "./programs/favorites/generated";

export const solanaClient = createClient()
  // Wallet support: discovers installed wallets (Phantom, Solflare, ...), handles connect/disconnect,
  // and sets the connected wallet as both `client.payer` (pays fees) and `client.identity` (signs).
  // Must come before the RPC plugin, which requires a payer on the client.
  .use(walletSigner({ chain: "solana:devnet" }))
  // RPC connection to https://api.devnet.solana.com: adds `client.rpc`, transaction
  // planning/sending (`client.sendTransaction`), and devnet airdrop support.
  .use(solanaDevnetRpc())
  // System Program helpers under `client.system` (e.g. transfer SOL, create accounts).
  .use(systemProgram())
  // SPL Token Program helpers (e.g. createMint, mintToATA, transferToATA).
  .use(tokenProgram())
  .use(favoritesProgram());

export type AppClient = Awaited<typeof solanaClient>;
