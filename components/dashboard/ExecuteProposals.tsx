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
import { Play, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { SuccessAlert } from "@/components/commons/SuccessAlert";
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

export const ExecuteProposals = () => {
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

    return {
      members: squad.members,
      // flatMap instead of filter so TypeScript knows they exist.
      // Newest first
      proposals: proposals
        .flatMap((proposal) => (proposal.exists ? [proposal] : []))
        .reverse(),
    };
  }, [client]);

  const { data, status, refresh } = useRequest(fetchProposals);

  if (!wallet) return noWalletFallback;

  const walletAddress = address(wallet.address);

  // Only members with the Execute permission can execute proposals
  const member = data?.members.find((m) => m.key === walletAddress);
  const canExecute =
    !!member &&
    multisig.Permissions.has(member.permissions, multisig.Permission.Execute);

  const execute = async (transactionIndex: bigint) => {
    setSignature(null);
    setError(null);
    setIsSending(true);

    try {
      const { instruction: executeIx } =
        await multisig.instructions.vaultTransactionExecute({
          rpc: client.rpc,
          multisigPda: MULTISIG_PDA,
          transactionIndex,
          member: walletAddress, // an address: Privy signs it when sending
        });

      const { value: latestBlockhash } = await client.rpc
        .getLatestBlockhash()
        .send();

      const executeTx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(walletAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(executeIx, tx),
        (tx) => compileTransaction(tx),
        (tx) => new Uint8Array(getTransactionEncoder().encode(tx)),
      );

      const executeTxResult = await signAndSendTransaction({
        transaction: executeTx,
        wallet,
        chain: "solana:devnet",
      });

      setSignature(getBase58Decoder().decode(executeTxResult.signature));
      // Reload to show the new status
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
        <CardTitle>Proposals</CardTitle>
        <CardDescription>
          {canExecute
            ? "Execute a proposal once it is approved"
            : "Only members with the Execute permission can execute proposals"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={status === "fetching"}
          >
            <RefreshCw />
            Refresh
          </Button>
        </div>
        {signature && (
          <SuccessAlert
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
          <p className="text-sm text-muted-foreground">No proposals yet</p>
        )}
        {data?.proposals.map(({ address: proposalPda, data: proposal }) => (
          <div
            key={proposalPda}
            className="flex items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">
                Proposal #{proposal.transactionIndex.toString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {proposal.status.__kind} · {proposal.approved.length} approvals
                · {proposal.rejected.length} rejections
              </span>
            </div>
            {/* Approved = it reached the threshold and is ready to execute */}
            {canExecute && proposal.status.__kind === "Approved" && (
              <Button
                size="sm"
                disabled={isSending}
                onClick={() => execute(proposal.transactionIndex)}
              >
                <Play />
                {isSending ? "Executing…" : "Execute"}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
