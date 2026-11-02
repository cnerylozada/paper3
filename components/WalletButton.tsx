"use client";

import { useEffect, useState } from "react";
import { Check, Copy, LogOut, Wallet } from "lucide-react";
import { Balance } from "@/components/Balance";
import { Button } from "@/components/ui/button";
import { AppClient } from "@/lib/solana";
import { PHANTOM_WALLET_NAME, shortenAddress } from "@/components/utils";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { address as toAddress } from "@solana/kit";
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
  const [copied, setCopied] = useState(false);

  // Reset the "copied" check mark after a moment
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  if (status === "pending") return null; // wait out auto-reconnect

  if (connected) {
    const address = toAddress(connected.account.address);

    return (
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 py-1 pr-1 pl-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={connected.wallet.icon}
          alt={connected.wallet.name}
          className="size-4 rounded-sm"
        />
        <Balance address={address} />
        <span className="h-4 w-px bg-border" />
        <span className="px-1 font-mono text-sm" title={address}>
          {shortenAddress(address)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copy address"
          title="Copy address"
          onClick={async () => {
            await navigator.clipboard.writeText(address);
            setCopied(true);
          }}
        >
          {copied ? <Check className="text-green-500" /> : <Copy />}
        </Button>
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
  }

  return (
    <Button
      disabled={!phantom || connect.isRunning}
      onClick={() => phantom && connect.dispatch(phantom)}
    >
      <Wallet />
      Connect Phantom
    </Button>
  );
};
