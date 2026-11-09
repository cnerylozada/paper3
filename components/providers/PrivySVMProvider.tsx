"use client";

import { PrivyProvider } from "@privy-io/react-auth";

// Auth layer: Google login only. Each user gets a Privy embedded Solana wallet on login,
// so they can sign transactions without installing a wallet extension.
export const PrivySVMProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <PrivyProvider
    appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
    config={{
      loginMethods: ["google"],
      embeddedWallets: {
        solana: {
          createOnLogin: "users-without-wallets",
        },
      },
    }}
  >
    {children}
  </PrivyProvider>
);
