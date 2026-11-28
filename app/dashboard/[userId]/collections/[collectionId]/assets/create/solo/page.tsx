import { notFound } from "next/navigation";
import { SoloAssetForm } from "@/components/assets/create/solo/SoloAssetForm";
import { getNextVersion } from "@/components/assets/version";
import { BackLink } from "@/components/commons/BackLink";
import { getAssetListByCollection } from "@/server/assets";
import { getCollectionByMember } from "@/server/collections";

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string; collectionId: string }>;
}) {
  const { userId, collectionId } = await params;
  const collection = await getCollectionByMember(userId, collectionId);
  // Only the creator publishes versions, and this is the solo form
  if (!collection || !collection.isCreator || collection.mode !== "solo")
    notFound();

  const next = getNextVersion(
    (await getAssetListByCollection(collectionId)).map(
      ({ version }) => version,
    ),
  );

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-4">
        <BackLink href={`/dashboard/${userId}/collections/${collectionId}`}>
          {collection.name}
        </BackLink>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {next.latest
              ? "Publish a new version"
              : "Publish your first version"}
          </h1>
          <p className="text-muted-foreground">
            Solo ·{" "}
            {next.latest
              ? `latest version is ${next.latest}`
              : "no versions yet"}
          </p>
        </div>
      </header>
      <SoloAssetForm
        collectionId={collectionId}
        collectionName={collection.name}
        collectionAddress={collection.nft_address}
        next={next}
      />
    </div>
  );
}
