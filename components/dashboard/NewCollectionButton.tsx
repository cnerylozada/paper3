"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWalletAddress } from "../hooks";

// The collections of a student live under their wallet address
export const NewCollectionButton = () => {
  const { wallet } = useWalletAddress();

  if (!wallet) return null;

  return (
    <Button
      nativeButton={false}
      render={<Link href={`/dashboard/${wallet.address}/collections/create`} />}
      className="self-start"
    >
      <Plus />
      New collection
    </Button>
  );
};
