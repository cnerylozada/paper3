"use client";

import { AppClient } from "@/lib/solana";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";

export const WalletPanel = () => {
  const client = useClient<AppClient>();
  const status = useWalletStatus(client);
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);

  if (status === "pending") return null; // wait out auto-reconnect

  if (connected) {
    return (
      <div>
        <p>{connected.account.address}</p>
        <button onClick={() => disconnect.dispatch()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {wallets.map((wallet) => (
        <div key={wallet.name}>
          <button
            disabled={connect.isRunning}
            onClick={() => connect.dispatch(wallet)}
          >
            Connect {wallet.name}
          </button>
        </div>
      ))}
    </div>
  );
};
