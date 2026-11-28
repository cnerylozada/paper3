import { BackLink } from "@/components/commons/BackLink";

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string; collectionId: string }>;
}) {
  const { userId, collectionId } = await params;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <BackLink href={`/dashboard/${userId}/collections/${collectionId}`}>
        Back to collection
      </BackLink>
      <h1 className="text-3xl font-semibold tracking-tight">
        Publish first version
      </h1>
      <p className="text-muted-foreground">Mock page: the form goes here.</p>
    </div>
  );
}
