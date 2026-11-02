import type { Address } from "@solana/kit";
import { useClient, useRequest } from "@solana/react";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatSol } from "@/components/utils";
import { AppClient } from "@/lib/solana";
import { cn } from "@/lib/utils";

export const Balance = ({ address }: { address: Address }) => {
  const client = useClient<AppClient>();

  const source = useMemo(
    () => client.rpc.getBalance(address),
    [client, address],
  );
  const { data, status, refresh } = useRequest(source);
  const isFetching = status === "fetching";

  return (
    <div className="flex items-center gap-1">
      {data ? (
        <span className="px-1 text-sm font-medium tabular-nums">
          {formatSol(data.value)}{" "}
          <span className="text-muted-foreground">SOL</span>
        </span>
      ) : status === "error" ? (
        <span role="alert" className="px-1 text-sm text-destructive">
          Balance unavailable
        </span>
      ) : (
        // First load: no data yet
        <span className="mx-1 h-4 w-16 animate-pulse rounded bg-muted" />
      )}
      {status !== "success" && (
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
      )}
    </div>
  );
};
