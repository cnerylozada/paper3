import { TransferSOLForm } from "@/components/dashboard/TransferSOLForm";
import { WelcomeUser } from "@/components/dashboard/WelcomeUser";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <WelcomeUser />
      <TransferSOLForm />
    </div>
  );
}
