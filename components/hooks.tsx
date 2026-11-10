"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

export const useWalletAddress = () => {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets[0];

  return {
    wallet: !ready || !authenticated || !wallet ? null : wallet,
    noWalletFallback: (
      <p className="text-sm text-muted-foreground">
        Connect your wallet to continue.
      </p>
    ),
  };
};
