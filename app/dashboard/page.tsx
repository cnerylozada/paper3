import { TokenBalances } from "@/components/dashboard/TokenBalances";
import { TransferSOLForm } from "@/components/dashboard/TransferSOLForm";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <TokenBalances />
      <TransferSOLForm />
    </div>
  );
}
