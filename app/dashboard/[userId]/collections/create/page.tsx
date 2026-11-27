import { BackLink } from "@/components/commons/BackLink";
import { UploadCollectionForm } from "@/components/collections/UploadCollectionForm";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-4">
        <BackLink href="/dashboard">Dashboard</BackLink>
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
      <UploadCollectionForm />
    </div>
  );
}
