"use client";

import { useWalletAddress } from "@/components/hooks";
import { Balance } from "../Balance";

export const TransferSOLForm = () => {
  const { address, fallback } = useWalletAddress();
  if (!address) return fallback;

  return (
    <div>
      <Balance address={address} variant="card" />
    </div>
  );
};
