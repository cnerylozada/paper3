"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWalletAddress } from "../hooks";

export const WelcomeUser = () => {
  const { wallet, noWalletFallback } = useWalletAddress();
  const { user } = usePrivy();

  if (!wallet) return noWalletFallback;

  // Google login: the name and email live in `user.google`
  const name = user?.google?.name;
  const email = user?.google?.email ?? user?.email?.address;

  return (
    <div>
      <h1 className="text-xl font-semibold">Welcome{name && `, ${name}`}</h1>
      {email && <p className="text-sm text-muted-foreground">{email}</p>}
    </div>
  );
};
