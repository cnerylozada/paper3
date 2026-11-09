import type { Address } from "@solana/kit";
import { useClient, useRequest } from "@solana/react";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSol } from "@/components/utils";
import { AppClient } from "@/lib/solana";
import { cn } from "@/lib/utils";

export const Balance = ({
  address,
  variant = "compact",
}: {
  address: Address;
  // "compact" fits the header pill; "card" is the larger dashboard version
  variant?: "compact" | "card";
}) => {
  const client = useClient<AppClient>();

  const source = useMemo(
    () => client.rpc.getBalance(address),
    [client, address],
  );
  const { data, status, refresh } = useRequest(source);
  const isFetching = status === "fetching";
  const isCard = variant === "card";

  const retry = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Refresh balance"
      title="Refresh balance"
      disabled={isFetching}
      onClick={() => refresh()}
    >
      <RefreshCw className={cn(isFetching && "animate-spin")} />
    </Button>
  );

  if (isCard)
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>SOL balance</CardTitle>
          <CardDescription>Available in your wallet on devnet</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "error" ? (
            <div className="flex items-center gap-1">
              <p role="alert" className="text-sm text-destructive">
                Balance unavailable.
              </p>
              {retry}
            </div>
          ) : data ? (
            <p className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tabular-nums tracking-tight">
                {formatSol(data.value)}
              </span>
              <span className="text-lg text-muted-foreground">SOL</span>
            </p>
          ) : (
            <Skeleton className="h-10 w-40" />
          )}
        </CardContent>
      </Card>
    );

  return (
    <div className="flex items-center gap-1">
      {status === "error" ? (
        <>
          <span role="alert" className="px-1 text-sm text-destructive">
            Balance unavailable
          </span>
          {retry}
        </>
      ) : (
        data && (
          <span className="px-1 text-sm font-medium tabular-nums">
            {formatSol(data.value)}{" "}
            <span className="text-muted-foreground">SOL</span>
          </span>
        )
      )}
    </div>
  );
};
