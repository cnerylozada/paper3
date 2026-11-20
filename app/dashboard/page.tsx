import { CreateSquad } from "@/components/dashboard/CreateSquad";
import { LeadMember } from "@/components/dashboard/LeadMember";
import { NFT101 } from "@/components/dashboard/NFT101";
import { TransferSOLForm } from "@/components/dashboard/TransferSOLForm";
import { WelcomeUser } from "@/components/dashboard/WelcomeUser";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <LeadMember />
      {/* <CreateSquad /> */}
      <WelcomeUser />
      <TransferSOLForm />
      <NFT101 />
    </div>
  );
}
