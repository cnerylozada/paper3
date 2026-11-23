"use client";

import { useClient, useRequest } from "@solana/react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useCallback } from "react";
import { CopyAddress } from "@/components/CopyAddress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTokenAmount } from "@/components/utils";
import { SWAP_PROGRAM_ADDRESS } from "@/lib/programs/swap/generated";
import { AppClient } from "@/lib/solana";

// We assume every mint has 9 decimals
const DECIMALS = 9;

// One side of an offer: amount + mint
const Side = ({
  label,
  amount,
  mint,
}: {
  label: string;
  amount: bigint;
  mint: string;
}) => (
  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-lg font-semibold tabular-nums">
      {formatTokenAmount(amount, DECIMALS)}
    </span>
    <CopyAddress value={mint} />
  </div>
);

// created_at is a unix timestamp in seconds
const formatDate = (seconds: bigint) =>
  new Date(Number(seconds) * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const OfferList = () => {
  const client = useClient<AppClient>();

  const fetchOffers = useCallback(async () => {
    // Every account owned by the swap program is an Offer
    const accounts = await client.rpc
      .getProgramAccounts(SWAP_PROGRAM_ADDRESS, { encoding: "base64" })
      .send();

    // Decode them with our swap plugin
    const offers = await client.swap.accounts.offer.fetchAll(
      accounts.map((account) => account.pubkey),
    );

    // Newest first
    return offers.sort((a, b) => Number(b.data.createdAt - a.data.createdAt));
  }, [client]);

  const { data: offers, status, refresh } = useRequest(fetchOffers);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Open offers</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={status === "fetching"}
        >
          <RefreshCw />
          Refresh
        </Button>
      </div>
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          Could not load the offers
        </p>
      )}
      {!offers && status !== "error" && <Skeleton className="h-24 w-full" />}
      {offers && offers.length === 0 && (
        <p className="text-sm text-muted-foreground">No offers yet</p>
      )}
      {offers?.map(({ address, data }) => (
        <Card key={address} size="sm" className="w-full max-w-md">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Side
                label="Offers"
                amount={data.offeredAmount}
                mint={data.offeredMint}
              />
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              <Side
                label="Wants"
                amount={data.wantedAmount}
                mint={data.wantedMint}
              />
            </div>
            <time
              dateTime={new Date(Number(data.createdAt) * 1000).toISOString()}
              className="text-xs text-muted-foreground"
            >
              {formatDate(data.createdAt)}
            </time>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
