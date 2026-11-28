import { AppLinkButton } from "@/components/commons/AppLinkButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { CollectionCardItem } from "@/server/collections";

// One collection of the list: its mode, the user's role in it, its field, its
// name, and the next step (there are no versions yet)
export const CollectionCard = ({
  userId,
  collection,
}: {
  userId: string;
  collection: CollectionCardItem;
}) => (
  <Card>
    <CardContent className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {collection.mode === "solo" ? "Solo" : "Team"}
          </Badge>
          {collection.isCreator && (
            <Badge className="bg-primary/10 text-primary">Creator</Badge>
          )}
        </div>
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {collection.field}
        </span>
      </div>
      <h2 className="text-xl leading-snug font-semibold">{collection.name}</h2>
      <div className="flex flex-col gap-1 rounded-lg border border-dashed bg-muted/40 p-4">
        <p className="font-medium">No versions yet</p>
        <p className="text-sm text-muted-foreground">
          Not on the marketplace. Upload your first draft to publish v1.0 and
          set its price.
        </p>
      </div>
    </CardContent>
    <CardFooter className="justify-between gap-2">
      <span className="text-sm text-muted-foreground">
        Created {new Date(collection.created_at).toLocaleDateString("en-US")}
      </span>
      <AppLinkButton href={`/dashboard/${userId}/collections/${collection.id}`}>
        Publish first version
      </AppLinkButton>
    </CardFooter>
  </Card>
);
