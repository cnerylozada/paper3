"use client";

import { address } from "@solana/kit";
import {
  useConnectedWallet,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { AppClient } from "@/lib/solana";

export const useWalletAddress = () => {
  const client = useClient<AppClient>();
  const status = useWalletStatus(client);
  const connected = useConnectedWallet(client);

  return {
    walletAddress: connected ? address(connected.account.address) : null,
    noWalletFallback:
      status === "pending" ? null : (
        <p className="text-sm text-muted-foreground">
          Connect your wallet to continue.
        </p>
      ),
  };
};
