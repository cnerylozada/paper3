import { ExternalLink, Lock } from "lucide-react";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/commons/BackLink";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyAddress } from "@/components/CopyAddress";
import { explorerTxUrl } from "@/components/utils";
import { EmptyVersionList } from "@/components/collections/detail/EmptyVersionList";
import { MemberList } from "@/components/collections/detail/MemberList";
import { getCollectionByMember } from "@/server/collections";

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string; collectionId: string }>;
}) {
  const { userId, collectionId } = await params;
  const collection = await getCollectionByMember(userId, collectionId);
  if (!collection) notFound();

  const isTeam = collection.mode === "team";

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <BackLink href={`/dashboard/${userId}`}>My collections</BackLink>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="uppercase">
            {collection.field}
          </Badge>
          <Badge variant="secondary">
            {collection.mode === "solo"
              ? "Solo"
              : `Team of ${collection.memberList.length}`}
          </Badge>
          {collection.isCreator ? (
            <Badge className="bg-primary/10 text-primary">
              You are the creator
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300">
              You are a co-author
            </Badge>
          )}
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            Not on the marketplace yet
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {collection.name}
        </h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <EmptyVersionList
            isCreator={collection.isCreator}
            createHref={`/dashboard/${userId}/collections/${collectionId}/assets/create`}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                About this research line
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <p className="leading-relaxed">{collection.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Keywords</span>
                {collection.keywords.map((keyword) => (
                  <Badge key={keyword} className="bg-primary/10 text-primary">
                    {keyword}
                  </Badge>
                ))}
              </div>
              <dl className="grid gap-4 rounded-lg border bg-muted/40 p-4 text-sm sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <dt className="text-muted-foreground">Collection address</dt>
                  <dd>
                    <CopyAddress value={collection.nft_address} />
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="flex flex-wrap items-center gap-x-2">
                    {new Date(collection.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    <a
                      href={explorerTxUrl(collection.tx_signature)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Transaction
                      <ExternalLink className="size-3" />
                    </a>
                  </dd>
                </div>
              </dl>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-4 shrink-0" />
                Title, description and field were saved on Solana at creation
                and can&apos;t be changed.
              </p>
            </CardContent>
          </Card>
        </div>
        <aside className="flex flex-col gap-6">
          <MemberList
            userId={userId}
            memberList={collection.memberList}
            isTeam={isTeam}
          />
        </aside>
      </div>
    </div>
  );
}
