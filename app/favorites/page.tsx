import { Read } from "@/components/favorites/Read";
import { Write } from "@/components/favorites/Write";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div>Favorites</div>
      <Read />
      <Write />
    </div>
  );
}
