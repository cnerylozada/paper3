"use client";

import { address } from "@solana/kit";
import {
  useConnectedWallet,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { AppClient } from "@/lib/solana";

// `address` is null until a wallet is connected. While null, render `fallback`:
// nothing during auto-reconnect, a "connect your wallet" hint otherwise.
export const useWalletAddress = () => {
  const client = useClient<AppClient>();
  const status = useWalletStatus(client);
  const connected = useConnectedWallet(client);

  return {
    address: connected ? address(connected.account.address) : null,
    fallback:
      status === "pending" ? null : (
        <p className="text-sm text-muted-foreground">
          Connect your wallet to continue.
        </p>
      ),
  };
};
