import { Plus } from "lucide-react";
import { AppLinkButton } from "@/components/commons/AppLinkButton";
import { getCollectionListByMember } from "@/server/collections";
import { CollectionCard } from "./CollectionCard";

// The collections of a user, as creator or co-author, under their header
export const MyCollectionList = async ({
  params,
}: {
  params: Promise<{ userId: string }>;
}) => {
  const { userId } = await params;
  const collectionList = await getCollectionListByMember(userId);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            My collections
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Research lines you created or co-author. Open one to see its
            members, versions and earnings.
          </p>
        </div>
        <AppLinkButton
          href={`/dashboard/${userId}/collections/create`}
          icon={Plus}
        >
          New collection
        </AppLinkButton>
      </header>
      {collectionList.length === 0 ? (
        <p className="text-muted-foreground">
          You are not in any collection yet.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collectionList.map((collection) => (
            <li key={collection.id}>
              <CollectionCard userId={userId} collection={collection} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
