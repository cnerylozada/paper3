"use client";

import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useClient, useRequest } from "@solana/react";
import {
  address,
  appendTransactionMessageInstruction,
  compileTransaction,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import * as multisig from "@sqds/multisig-kit";
import { Check, X } from "lucide-react";
import { useCallback, useState } from "react";
import { StatusAlert } from "@/components/commons/StatusAlert";
import { explorerTxUrl } from "@/components/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppClient } from "@/lib/solana";
import { useWalletAddress } from "../hooks";

// Same squad as LeadMember and CreateProposal
const MULTISIG_PDA = address("5CbNUCvtTUZEPkuUGHHio5dGuBQ7D5zSvoZ2NR9JVSr5");

export const VoteProposals = () => {
  const { wallet, noWalletFallback } = useWalletAddress();

  const client = useClient<AppClient>();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fetchProposals = useCallback(async () => {
    const { data: squad } = await multisig.accounts.fetchMultisig(
      client.rpc,
      MULTISIG_PDA,
    );

    // Proposals have no list on-chain: transaction indexes go from 1 to
    // transactionIndex, and each one has a proposal PDA
    const proposalPdas = await Promise.all(
      Array.from({ length: Number(squad.transactionIndex) }, async (_, i) => {
        const [proposalPda] = await multisig.getProposalPda({
          multisigPda: MULTISIG_PDA,
          transactionIndex: BigInt(i + 1),
        });
        return proposalPda;
      }),
    );
    const proposals = await multisig.accounts.fetchAllMaybeProposal(
      client.rpc,
      proposalPdas,
    );

    console.log("proposals", proposals);

    return {
      threshold: squad.threshold,
      // Only the proposals that are still open for voting
      // (flatMap instead of filter so TypeScript knows they exist)
      proposals: proposals.flatMap((proposal) =>
        proposal.exists && proposal.data.status.__kind === "Active"
          ? [proposal]
          : [],
      ),
    };
  }, [client]);

  const { data, status, refresh } = useRequest(fetchProposals);

  if (!wallet) return noWalletFallback;

  const walletAddress = address(wallet.address);

  const vote = async (transactionIndex: bigint, approve: boolean) => {
    setSignature(null);
    setError(null);
    setIsSending(true);

    try {
      const voteInput = {
        multisigPda: MULTISIG_PDA,
        transactionIndex,
        member: walletAddress, // an address: Privy signs it when sending
      };
      const voteIx = approve
        ? await multisig.instructions.proposalApprove(voteInput)
        : await multisig.instructions.proposalReject(voteInput);

      const { value: latestBlockhash } = await client.rpc
        .getLatestBlockhash()
        .send();

      const voteTx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(walletAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(voteIx, tx),
        (tx) => compileTransaction(tx),
        (tx) => new Uint8Array(getTransactionEncoder().encode(tx)),
      );

      const voteTxResult = await signAndSendTransaction({
        transaction: voteTx,
        wallet,
        chain: "solana:devnet",
      });

      setSignature(getBase58Decoder().decode(voteTxResult.signature));
      // Reload to show the new votes
      refresh();
    } catch (e) {
      console.log("error", e);
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Vote on proposals</CardTitle>
        <CardDescription>
          Approve or reject the squad&apos;s open proposals
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {signature && (
          <StatusAlert
            title="Transaction sent"
            href={explorerTxUrl(signature)}
          />
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/50 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="text-sm text-destructive">
            Could not load the proposals
          </p>
        )}
        {!data && status !== "error" && <Skeleton className="h-16 w-full" />}
        {data && data.proposals.length === 0 && (
          <p className="text-sm text-muted-foreground">No open proposals</p>
        )}
        {data?.proposals.map(({ address: proposalPda, data: proposal }) => {
          // A member can only vote once
          const hasVoted =
            proposal.approved.includes(walletAddress) ||
            proposal.rejected.includes(walletAddress);

          return (
            <div
              key={proposalPda}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">
                  Proposal #{proposal.transactionIndex.toString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {proposal.approved.length}/{data.threshold} approvals ·{" "}
                  {proposal.rejected.length} rejections
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={isSending || hasVoted}
                  onClick={() => vote(proposal.transactionIndex, true)}
                >
                  <Check />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSending || hasVoted}
                  onClick={() => vote(proposal.transactionIndex, false)}
                >
                  <X />
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
