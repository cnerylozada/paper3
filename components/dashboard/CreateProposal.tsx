"use client";

import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useClient } from "@solana/react";
import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import * as multisig from "@sqds/multisig-kit";
import { FileText } from "lucide-react";
import { useState } from "react";
import { SuccessAlert } from "@/components/commons/SuccessAlert";
import { explorerTxUrl } from "@/components/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppClient } from "@/lib/solana";
import { useWalletAddress } from "../hooks";

// Same squad as LeadMember
const MULTISIG_PDA = address("5CbNUCvtTUZEPkuUGHHio5dGuBQ7D5zSvoZ2NR9JVSr5");

// The vault that holds the squad's SOL
const VAULT_INDEX = 0;

// 1 SOL in lamports
const AMOUNT = BigInt(1_000_000_000);

export const CreateProposal = () => {
  const { wallet, noWalletFallback } = useWalletAddress();

  const client = useClient<AppClient>();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!wallet) return noWalletFallback;

  const onCreateProposal = async () => {
    setSignature(null);
    setError(null);
    setIsSending(true);

    const walletAddress = address(wallet.address);

    try {
      // Vault 0 holds the squad's SOL
      const [vaultPda] = await multisig.getVaultPda({
        multisigPda: MULTISIG_PDA,
        index: VAULT_INDEX,
      });

      // Each new vault transaction uses the next index
      const { data: squad } = await multisig.accounts.fetchMultisig(
        client.rpc,
        MULTISIG_PDA,
      );
      const transactionIndex = squad.transactionIndex + BigInt(1);

      // What the vault will run once the proposal is approved and executed:
      // send 1 SOL from vault 0 to the connected wallet
      const transferIx = client.system.instructions.transferSol({
        source: createNoopSigner(vaultPda), // the vault signs at execution
        destination: walletAddress,
        amount: AMOUNT,
      });

      // Stores the transfer on-chain as a vault transaction
      const vaultTransactionIx =
        await multisig.instructions.vaultTransactionCreate({
          multisigPda: MULTISIG_PDA,
          transactionIndex,
          creator: walletAddress, // an address: Privy signs it when sending
          vaultIndex: VAULT_INDEX,
          ephemeralSigners: 0,
          transactionMessage: {
            payerKey: vaultPda,
            instructions: [transferIx],
          },
          // A note for the members. It is saved in the transaction's logs
          // (Explorer, Squads app), not in the proposal account
          memo: `Send 1 SOL from vault ${VAULT_INDEX} to ${walletAddress}`,
        });

      // Opens the vote for that vault transaction
      const proposalIx = await multisig.instructions.proposalCreate({
        multisigPda: MULTISIG_PDA,
        transactionIndex,
        creator: walletAddress,
      });

      const { value: latestBlockhash } = await client.rpc
        .getLatestBlockhash()
        .send();

      const createProposalTx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(walletAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) =>
          appendTransactionMessageInstructions(
            [vaultTransactionIx, proposalIx],
            tx,
          ),
        (tx) => compileTransaction(tx),
        (tx) => new Uint8Array(getTransactionEncoder().encode(tx)),
      );

      const createProposalTxResult = await signAndSendTransaction({
        transaction: createProposalTx,
        wallet,
        chain: "solana:devnet",
      });

      setSignature(getBase58Decoder().decode(createProposalTxResult.signature));
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
        <CardTitle>Create proposal</CardTitle>
        <CardDescription>
          Propose sending 1 SOL from the squad&apos;s vault 0 to your wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
      </CardContent>
      <CardFooter>
        <Button
          onClick={onCreateProposal}
          disabled={isSending}
          className="w-full sm:w-auto"
        >
          <FileText />
          {isSending ? "Creating…" : "Create proposal"}
        </Button>
      </CardFooter>
    </Card>
  );
};
