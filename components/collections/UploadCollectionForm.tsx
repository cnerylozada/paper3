"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { SoloCollectionForm } from "./SoloCollectionForm";
import { TeamCollectionForm } from "./TeamCollectionForm";

const MODES = [
  {
    value: "solo",
    title: "Solo",
    description: "Only you. You are the only creator of its papers.",
  },
  {
    value: "team",
    title: "Team",
    description: "2 to 5 authors. Your squad approves what is published.",
  },
] as const;

type Mode = (typeof MODES)[number]["value"];

const SOLO_STEPS = [
  "The title and description are uploaded to IPFS as the collection's metadata.",
  "The collection is minted on Solana, owned by your wallet.",
  "You approve it once in your wallet.",
];

const SOLO_FACTS = [
  { label: "Mode", value: "Solo" },
  { label: "Creator", value: "You only" },
  { label: "Network", value: "Solana devnet" },
];

// The student picks the kind of collection with a card
export const UploadCollectionForm = () => {
  const [mode, setMode] = useState<Mode>("solo");

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex min-w-0 flex-[999_1_32rem] flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Who writes this research?</CardTitle>
            <CardDescription>
              This decides who the creators of the collection are.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as Mode)}
              aria-label="Mode"
              className="grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {MODES.map(({ value, title, description }) => (
                <Label
                  key={value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5"
                >
                  <RadioGroupItem value={value} className="mt-0.5" />
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{title}</span>
                    <span className="text-xs leading-relaxed font-normal text-muted-foreground">
                      {description}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Collection details
              <Badge variant="outline">
                {mode === "solo" ? "Solo" : "Team"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "solo" ? <SoloCollectionForm /> : <TeamCollectionForm />}
          </CardContent>
        </Card>
      </div>

      {mode === "solo" && (
        <Card className="max-w-sm min-w-72 flex-1">
          <CardHeader>
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              What happens when you create it
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed text-muted-foreground">
              {SOLO_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Separator />
            <dl className="flex flex-col gap-3 text-sm">
              {SOLO_FACTS.map(({ label, value }) => (
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
      )}
    </div>
  );
};
