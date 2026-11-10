"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

export const PrivySVMProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <PrivyProvider
    appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
    config={{
      loginMethods: ["google"],
      appearance: {
        landingHeader: "Log in to Paper3",
        loginMessage: "Tokenize your intellectual property",
      },
      embeddedWallets: {
        solana: {
          createOnLogin: "users-without-wallets",
        },
      },
      // Privy's wallet modal (used by `signAndSendTransaction`) simulates and submits the
      // transaction itself, so it needs its own RPC connection for every chain we sign on.
      // It can't reuse the Kit client in `lib/solana.ts`; it only reads this config.
      // Without an entry for the chain, Privy throws "No RPC configuration found for chain ...".
      // Pass the same chain when signing (`chain: "solana:devnet"`), otherwise Privy defaults to mainnet.
      // Both `rpc` (HTTP) and `rpcSubscriptions` (WebSocket) are required by Privy's types.
      solana: {
        rpcs: {
          "solana:devnet": {
            rpc: createSolanaRpc("https://api.devnet.solana.com"),
            rpcSubscriptions: createSolanaRpcSubscriptions(
              "wss://api.devnet.solana.com",
            ),
          },
        },
      },
    }}
  >
    {children}
  </PrivyProvider>
);
