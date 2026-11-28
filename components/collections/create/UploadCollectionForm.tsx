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
import { RadioCardGroup } from "@/components/commons/RadioCardGroup";
import { SoloCollectionForm } from "./SoloCollectionForm";
import type { CollectionMode } from "@/server/models/collections";
import { CollectionSummary } from "./CollectionSummary";
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
] as const satisfies readonly {
  value: CollectionMode;
  title: string;
  description: string;
}[];

// The student picks the kind of collection with a card
export const UploadCollectionForm = () => {
  const [mode, setMode] = useState<CollectionMode>("solo");

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
            <RadioCardGroup
              label="Mode"
              options={MODES}
              value={mode}
              onChange={setMode}
            />
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

      <CollectionSummary mode={mode} />
    </div>
  );
};
