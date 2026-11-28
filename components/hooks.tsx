"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useEffect, useState } from "react";
import { getUserIdByWallet } from "@/server/users";

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

// The id of the logged in user (the one in the dashboard url), null while it loads
export const useUserId = () => {
  const { wallet } = useWalletAddress();
  const [userId, setUserId] = useState<string | null>(null);
  const address = wallet?.address;

  useEffect(() => {
    if (!address) return;
    getUserIdByWallet(address).then(setUserId, console.error);
  }, [address]);

  return address ? userId : null;
};
