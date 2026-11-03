"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppClient } from "@/lib/solana";
import { PHANTOM_WALLET_NAME } from "@/components/utils";
import { useConnect, useWallets } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";

export const ConnectWalletButton = () => {
  const client = useClient<AppClient>();

  const phantom = useWallets(client).find(
    (w) => w.name === PHANTOM_WALLET_NAME,
  );
  const connect = useConnect(client);

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
