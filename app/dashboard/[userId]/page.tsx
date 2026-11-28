import { MyCollectionList } from "@/components/collections/list/MyCollectionList";
import { WelcomeUser } from "@/components/dashboard/WelcomeUser";

export default function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <WelcomeUser />
      <MyCollectionList params={params} />
    </div>
  );
}
