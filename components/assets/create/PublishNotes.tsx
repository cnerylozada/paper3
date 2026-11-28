import {
  ArrowUpCircle,
  FileLock2,
  Lock,
  PenLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// What the version being published is, and what it means for buyers
const CHANGE = {
  first: { label: "Your first version", style: "bg-primary/10 text-primary" },
  major: {
    label: "New major, sold separately",
    style:
      "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  },
  minor: {
    label: "New minor, free for buyers",
    style:
      "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  },
} as const;

const Note = ({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) => (
  <li className="flex gap-3">
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
      <Icon className="size-3.5 text-muted-foreground" />
    </span>
    <span className="pt-1 text-sm leading-snug text-muted-foreground">
      {children}
    </span>
  </li>
);

// The side card of the publish form
export const PublishNotes = ({
  version,
  change,
}: {
  version: string; // like v3.0
  change: keyof typeof CHANGE;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
        Before you publish
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-5">
      <div className="flex flex-col items-start gap-2 rounded-xl border bg-muted/30 p-4">
        <span className="text-4xl font-semibold tracking-tight">{version}</span>
        <Badge className={cn(CHANGE[change].style)}>
          {CHANGE[change].label}
        </Badge>
      </div>
      <ul className="flex flex-col gap-4">
        <Note icon={PenLine}>You approve one transaction in your wallet.</Note>
        {change !== "first" && (
          <Note icon={Lock}>
            Published versions can&apos;t be edited or deleted. Upload a new
            minor to fix something.
          </Note>
        )}
        {change !== "first" && (
          <Note icon={ArrowUpCircle}>
            Minor versions can only be added to the latest major.
          </Note>
        )}
        <Note icon={FileLock2}>
          The PDF is stored on Pinata&apos;s public network: anyone with its
          link can read it.
        </Note>
        <Note icon={Sparkles}>
          The NFT image is drawn from the PDF&apos;s hash, so it proves which
          file you published.
        </Note>
      </ul>
    </CardContent>
  </Card>
);
