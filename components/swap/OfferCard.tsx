import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { CopyAddress } from "@/components/CopyAddress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTokenAmount } from "@/components/utils";
import { Offer } from "@/lib/programs/swap/generated";

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
const toDate = (seconds: bigint) => new Date(Number(seconds) * 1000);

export const OfferCard = ({
  offer,
  onTakeOffer,
  isTaking,
  disabled,
}: {
  offer: Offer;
  onTakeOffer: () => void;
  isTaking: boolean;
  disabled: boolean;
}) => (
  <Card size="sm" className="w-full max-w-md">
    <CardContent className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Side
          label="Offers"
          amount={offer.offeredAmount}
          mint={offer.offeredMint}
        />
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        <Side
          label="Wants"
          amount={offer.wantedAmount}
          mint={offer.wantedMint}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <time
          dateTime={toDate(offer.createdAt).toISOString()}
          className="text-xs text-muted-foreground"
        >
          {toDate(offer.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>
        <Button size="sm" onClick={onTakeOffer} disabled={disabled}>
          <ArrowLeftRight />
          {isTaking ? "Taking…" : "Take offer"}
        </Button>
      </div>
    </CardContent>
  </Card>
);
