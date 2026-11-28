import { FileUp, Upload, UserRound } from "lucide-react";
import { AppLinkButton } from "@/components/commons/AppLinkButton";
import { Badge } from "@/components/ui/badge";

// What the creator gives when publishing a version
const VERSION_FIELD_LIST = [
  "Title",
  "Description",
  "Document type",
  "Language",
  "Price",
];

// Shown while a collection has no versions: the next step is to publish v1.0
// Only the creator of the collection can publish versions
export const EmptyVersionList = ({
  isCreator,
  createHref,
}: {
  isCreator: boolean;
  createHref: string;
}) => (
  <div className="flex flex-col items-center gap-6 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
    <span className="flex size-14 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
      <FileUp className="size-6 text-muted-foreground" />
    </span>
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-2xl font-semibold tracking-tight">No versions yet</h2>
      <p className="max-w-md text-muted-foreground">
        {isCreator
          ? "Upload your first draft to publish v1.0. Then the collection appears on the marketplace."
          : "The creator will publish v1.0. Then the collection appears on the marketplace."}
      </p>
    </div>
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        The creator will set
      </span>
      <ul className="flex flex-wrap justify-center gap-2">
        {VERSION_FIELD_LIST.map((field) => (
          <li key={field}>
            <Badge variant="outline" className="bg-background">
              {field}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
    {isCreator ? (
      <AppLinkButton icon={Upload} href={createHref}>
        Publish first version
      </AppLinkButton>
    ) : (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <UserRound className="size-4" />
        Only the creator can publish versions
      </p>
    )}
  </div>
);
