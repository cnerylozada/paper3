"use client";

import { useClient } from "@solana/react";
import { address } from "@solana/kit";
import { Button } from "@/components/ui/button";
import { AppClient } from "@/lib/solana";
import { useWalletAddress } from "../hooks";

export const Read = () => {
  const { wallet, noWalletFallback } = useWalletAddress();
  const client = useClient<AppClient>();

  if (!wallet) return noWalletFallback;

  const onLogFavorites = async () => {
    // The favorites PDA is derived from the signer that created it
    const [favoritesPda] = await client.favorites.pdas.favorites({
      signer: address(wallet.address),
    });

    // Fetch and decode the account with the generated plugin
    const { data } =
      await client.favorites.accounts.favorites.fetch(favoritesPda);
    console.log("Favorites", favoritesPda, data);
  };

  return <Button onClick={onLogFavorites}>Log my favorites</Button>;
};
