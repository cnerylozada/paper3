"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Balance } from "@/components/Balance";
import { CopyAddress } from "@/components/CopyAddress";
import { Button } from "@/components/ui/button";
import { address } from "@solana/kit";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

export const HeaderActions = () => {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets[0];

  if (!ready) return null;
  if (!authenticated || !wallet)
    return (
      <Button nativeButton={false} render={<Link href="/login" />}>
        Login
      </Button>
    );

  return (
    <>
      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href="/dashboard" />}
      >
        Dashboard
      </Button>
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 py-1 pr-1 pl-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wallet.standardWallet.icon}
          alt={wallet.standardWallet.name}
          className="size-4 rounded-sm"
        />
        <Balance address={address(wallet.address)} />
        <span className="h-4 w-px bg-border" />
        <CopyAddress value={wallet.address} />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Disconnect"
          title="Disconnect"
          onClick={() => logout()}
        >
          <LogOut />
        </Button>
      </div>
    </>
  );
};
