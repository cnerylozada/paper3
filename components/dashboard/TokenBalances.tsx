"use client";

import { address } from "@solana/kit";
import { useClient, useRequest } from "@solana/react";
import { findAssociatedTokenPda } from "@solana-program/token";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { CopyAddress } from "@/components/CopyAddress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatTokenAmount } from "@/components/utils";
import { AppClient } from "@/lib/solana";
import { useWalletAddress } from "@/components/hooks";

// Hardcoded for now
const MINTS = [
  address("9ZZMtJ9y5mES7P4bgBUa3pcgpNzqwaw4pPLzn8Ghau64"),
  address("EtUUV91XJKe4VthcQCb1RBAiDBepMVnXg57hSyKJjYdX"),
  address("3znVbWWQcDPxhUNoZcMd3fQSDarCLwXqtAUut2GPhgU1"),
];

export const TokenBalances = () => {
  const client = useClient<AppClient>();
  const { wallet, noWalletFallback } = useWalletAddress();

  const fetchOwnerBalances = useMemo(() => {
    if (!wallet) return null;

    return () =>
      Promise.all(
        MINTS.map(async (mint) => {
          const mintAccount = await client.token.accounts.mint.fetch(mint);

          const [ata] = await findAssociatedTokenPda({
            owner: address(wallet.address),
            mint,
            tokenProgram: mintAccount.programAddress,
          });

          // The ATA only exists on-chain if the wallet has held this token
          const tokenAccount =
            await client.token.accounts.token.fetchMaybe(ata);

          return {
            mint,
            ata,
            balance: tokenAccount.exists
              ? formatTokenAmount(
                  tokenAccount.data.amount,
                  mintAccount.data.decimals,
                )
              : "0",
          };
        }),
      );
  }, [client, wallet]);

  const { data, status, refresh } = useRequest(fetchOwnerBalances);
  const isFetching = status === "fetching";

  if (!wallet) return noWalletFallback;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Token balances</CardTitle>
        <CardDescription>Associated token accounts on devnet</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "error" ? (
          <div className="flex items-center gap-1">
            <p role="alert" className="text-sm text-destructive">
              Could not load balances.
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh balances"
              title="Refresh balances"
              disabled={isFetching}
              onClick={() => refresh()}
            >
              <RefreshCw className={cn(isFetching && "animate-spin")} />
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mint</TableHead>
                <TableHead>ATA</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data
                ? data.map(({ mint, ata, balance }) => (
                    <TableRow key={mint}>
                      <TableCell>
                        <CopyAddress value={mint} />
                      </TableCell>
                      <TableCell>
                        <CopyAddress value={ata} />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {balance}
                      </TableCell>
                    </TableRow>
                  ))
                : MINTS.map((mint) => (
                    <TableRow key={mint}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-4 w-12" />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
