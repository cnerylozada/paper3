"use client";

import { LogOut, Wallet } from "lucide-react";
import { Balance } from "@/components/Balance";
import { CopyAddress } from "@/components/CopyAddress";
import { Button } from "@/components/ui/button";
import { AppClient } from "@/lib/solana";
import { PHANTOM_WALLET_NAME } from "@/components/utils";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { address } from "@solana/kit";
import { useClient } from "@solana/react";

export const WalletButton = () => {
  const client = useClient<AppClient>();

  const status = useWalletStatus(client);
  const phantom = useWallets(client).find(
    (w) => w.name === PHANTOM_WALLET_NAME,
  );
  const connected = useConnectedWallet(client);

  const connect = useConnect(client);
  const disconnect = useDisconnect(client);

  if (status === "pending") return null;

  if (!connected) {
    return (
      <Button
        disabled={!phantom || connect.isRunning}
        onClick={() => phantom && connect.dispatch(phantom)}
      >
        <Wallet />
        Connect Phantom
      </Button>
    );
  }

  const walletAddress = address(connected.account.address);
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/40 py-1 pr-1 pl-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={connected.wallet.icon}
        alt={connected.wallet.name}
        className="size-4 rounded-sm"
      />
      <Balance address={walletAddress} />
      <span className="h-4 w-px bg-border" />
      <CopyAddress value={walletAddress} />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Disconnect"
        title="Disconnect"
        onClick={() => disconnect.dispatch()}
      >
        <LogOut />
      </Button>
    </div>
  );
};
