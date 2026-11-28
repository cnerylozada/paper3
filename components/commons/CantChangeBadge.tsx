import { Badge } from "@/components/ui/badge";

// For a field that is saved on-chain or in the published JSON
export const CantChangeBadge = () => (
  <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
    Can&apos;t change later
  </Badge>
);
