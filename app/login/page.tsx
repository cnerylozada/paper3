"use client";

import { Logo } from "@/components/Logo";
import { ConnectWalletButton } from "@/components/mainHeader/ConnectWalletButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center gap-4">
          <Logo className="h-12" />
          <CardTitle className="text-xl">Log in to continue</CardTitle>
          <CardDescription>
            Tokenize your intellectual property. Log in with Google and we
            create a Solana wallet for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <ConnectWalletButton />
          <p className="text-xs text-muted-foreground">
            Secured by Privy · Solana devnet
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
