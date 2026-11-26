import { PaperDropzone } from "@/components/metaplex/PaperDropzone";
import { GROUP_ID } from "@/components/metaplex/constants";
import { UploadCollectionForm } from "@/components/metaplex/UploadCollectionForm";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <UploadCollectionForm />
      {/* <PaperDropzone mode="solo" groupId={GROUP_ID} /> */}
    </div>
  );
}
