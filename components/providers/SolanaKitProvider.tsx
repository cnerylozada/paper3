"use client";

import { solanaClient } from "@/lib/solana";
import { ClientProvider } from "@solana/react";

export function SolanaKitProvider({ children }: { children: React.ReactNode }) {
  return <ClientProvider client={solanaClient}>{children}</ClientProvider>;
}
