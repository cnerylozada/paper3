"use client";

import { PrivyProvider } from "@privy-io/react-auth";

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
    }}
  >
    {children}
  </PrivyProvider>
);
