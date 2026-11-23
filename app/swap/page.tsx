import { MakeOffer } from "@/components/swap/MakeOffer";
import { Offers } from "@/components/swap/Offers";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Swap
        </h1>
        <p className="text-sm text-muted-foreground">
          Trade tokens peer to peer. Lock the tokens you offer in a vault and
          choose what you want in return. Anyone can take your offer.
        </p>
      </div>
      <Offers />
      <MakeOffer />
    </div>
  );
}
