import { NewCollectionButton } from "@/components/dashboard/NewCollectionButton";
import { LeadMember } from "@/components/dashboard/LeadMember";
import { TransactionSigners } from "@/components/dashboard/TransactionSigners";
import { TransferSOLForm } from "@/components/dashboard/TransferSOLForm";
import { WelcomeUser } from "@/components/dashboard/WelcomeUser";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <NewCollectionButton />
      <LeadMember />
      {/* <VoteProposals /> */}
      {/* <CreateProposal /> */}
      {/* <ExecuteProposals /> */}
      <TransactionSigners />
      <WelcomeUser />
      <TransferSOLForm />
    </div>
  );
}
