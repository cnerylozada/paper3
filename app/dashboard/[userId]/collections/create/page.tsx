import { Suspense } from "react";
import { BackLink } from "@/components/commons/BackLink";
import { CreateCollectionForm } from "@/components/collections/create/CreateCollectionForm";
import { Separator } from "@/components/ui/separator";

type Params = Promise<{ userId: string }>;

// `params` is runtime data, so it is awaited inside Suspense
const DashboardLink = async ({ params }: { params: Params }) => {
  const { userId } = await params;
  return <BackLink href={`/dashboard/${userId}`}>Dashboard</BackLink>;
};

export default function Page({ params }: { params: Params }) {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-4">
        <Suspense>
          <DashboardLink params={params} />
        </Suspense>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            New collection
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            A collection is one research line. You&apos;ll add its drafts as
            versions afterwards, and set a price for each major version.
          </p>
        </div>
        <Separator />
      </header>
      <CreateCollectionForm />
    </div>
  );
}
