import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CollectionMode } from "@/server/models/collections";

// What creating a collection does in each mode, in the order it happens
const SUMMARY: Record<
  CollectionMode,
  { steps: string[]; facts: { label: string; value: string }[] }
> = {
  solo: {
    steps: [
      "The title and description are uploaded to IPFS as the collection's metadata.",
      "The collection is minted on Solana, owned by your wallet.",
      "You approve it once in your wallet.",
    ],
    facts: [
      { label: "Mode", value: "Solo" },
      { label: "Creator", value: "You only" },
      { label: "Network", value: "Solana devnet" },
    ],
  },
  team: {
    steps: [
      "A squad (a Squads multisig) is created on Solana with you and your teammates as its members.",
      "The title and description are uploaded to IPFS, with the squad and every member as creators.",
      "You approve the squad once in your wallet.",
    ],
    facts: [
      { label: "Mode", value: "Team" },
      {
        label: "Creators",
        value: "2 to 5 authors, you and the wallets you add",
      },
      { label: "Network", value: "Solana devnet" },
    ],
  },
};

// Beside the form: what creating the collection does and its key facts
export const CollectionSummary = ({ mode }: { mode: CollectionMode }) => {
  const { steps, facts } = SUMMARY[mode];

  return (
    <Card className="max-w-sm min-w-72 flex-1">
      <CardHeader>
        <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          What happens when you create it
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed text-muted-foreground">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <Separator />
        <dl className="flex flex-col gap-3 text-sm">
          {facts.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <Separator />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Nothing is published yet. Upload your first draft afterwards.
        </p>
      </CardContent>
    </Card>
  );
};
