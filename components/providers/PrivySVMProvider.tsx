"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

export const PrivySVMProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <PrivyProvider
    appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
    config={{
      embeddedWallets: {
        solana: {
          createOnLogin: "users-without-wallets",
        },
      },
      appearance: { walletChainType: "ethereum-and-solana" },
      externalWallets: { solana: { connectors: toSolanaWalletConnectors() } },
    }}
  >
    {children}
  </PrivyProvider>
);
