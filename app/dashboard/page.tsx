import { CreateProposal } from "@/components/dashboard/CreateProposal";
import { ExecuteProposals } from "@/components/dashboard/ExecuteProposals";
import { LeadMember } from "@/components/dashboard/LeadMember";
import { TransactionSigners } from "@/components/dashboard/TransactionSigners";
import { TransferSOLForm } from "@/components/dashboard/TransferSOLForm";
import { VoteProposals } from "@/components/dashboard/VoteProposals";
import { WelcomeUser } from "@/components/dashboard/WelcomeUser";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
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
