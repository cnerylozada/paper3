import { CircleCheck } from "lucide-react";

// Success message shown by the collection forms once the JSON is in Pinata
export const CollectionUploaded = ({ uri }: { uri: string }) => (
  <div
    role="status"
    className="flex flex-col gap-1 rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-sm"
  >
    <p className="flex items-center gap-2 font-medium">
      <CircleCheck className="size-4 text-green-600" />
      Collection metadata uploaded
    </p>
    <a
      href={uri}
      target="_blank"
      rel="noreferrer"
      className="break-all font-mono text-xs underline"
    >
      {uri}
    </a>
  </div>
);
