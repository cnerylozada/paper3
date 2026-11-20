"use client";

import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useClient } from "@solana/react";
import {
  address,
  type Address,
  appendTransactionMessageInstruction,
  compileTransaction,
  createTransactionMessage,
  generateKeyPairSigner,
  getBase58Decoder,
  getTransactionEncoder,
  partiallySignTransaction,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import * as multisig from "@sqds/multisig-kit";
import { Users } from "lucide-react";
import { useState } from "react";
import { TransactionSuccess } from "@/components/TransactionSuccess";
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

export const CreateSquad = () => {
  const { wallet, noWalletFallback } = useWalletAddress();

  const client = useClient<AppClient>();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [signature, setSignature] = useState<string | null>(null);
  const [squad, setSquad] = useState<{
    multisigPda: Address;
    vaultPda: Address;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!wallet) return noWalletFallback;

  const onCreateSquad = async () => {
    setSignature(null);
    setSquad(null);
    setError(null);
    setIsSending(true);

    const walletAddress = address(wallet.address);

    try {
      // Random keypair whose address derives the multisig PDA.
      // It is a signer of the transaction, so it must be a real signer
      const createKeySigner = await generateKeyPairSigner();

      const [multisigPda] = await multisig.getMultisigPda({
        createKey: createKeySigner.address,
      });

      // The vault (index 0) is the squad's account that holds funds and assets
      const [vaultPda] = await multisig.getVaultPda({
        multisigPda,
        index: 0,
      });

      // The Squads program charges a creation fee that goes to its treasury
      const [programConfigPda] = await multisig.getProgramConfigPda({});
      const { data: programConfig } =
        await multisig.accounts.fetchProgramConfig(
          client.rpc,
          programConfigPda,
        );

      const createSquadIx = await multisig.instructions.multisigCreateV2({
        treasury: programConfig.treasury,
        creator: walletAddress, // an address: Privy signs it when sending
        multisigPda,
        configAuthority: null, // no admin: changes need a vote
        threshold: 2, // This means that there needs to be 2 votes for a transaction proposal to be approved
        members: [
          { key: walletAddress, permissions: multisig.Permissions.all() },
          {
            key: address("HgoGPQn97w15z6M5rXJJVStXMAe8Wm58ztjStSKstXsN"),
            permissions: multisig.Permissions.fromPermissions([
              multisig.Permission.Vote,
            ]),
          },
          {
            key: address("5Ai9JL3Xbc8YkezGYGAKn2vHL7yL7DTr2Be8eT5W1TK2"),
            permissions: multisig.Permissions.fromPermissions([
              multisig.Permission.Vote,
            ]),
          },
        ],
        timeLock: 0,
        createKey: createKeySigner, // a signer: signed here, below
        rentCollector: null,
      });

      const { value: latestBlockhash } = await client.rpc
        .getLatestBlockhash()
        .send();

      const compiledTx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(walletAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx), // Set recent blockhash
        (tx) => appendTransactionMessageInstruction(createSquadIx, tx),
        (tx) => compileTransaction(tx), // Compile the transaction
      );

      // Sign with the createKey keypair only; Privy adds the wallet signature
      const signedTx = await partiallySignTransaction(
        [createKeySigner.keyPair],
        compiledTx,
      );

      const createSquadTx = new Uint8Array(
        // Finally encode the transaction
        getTransactionEncoder().encode(signedTx),
      );

      const createSquadTxResult = await signAndSendTransaction({
        transaction: createSquadTx,
        wallet,
        chain: "solana:devnet",
      });

      setSignature(getBase58Decoder().decode(createSquadTxResult.signature));
      setSquad({ multisigPda, vaultPda });
      console.log("multisigPda and vaultPda", { multisigPda, vaultPda });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create squad</CardTitle>
        <CardDescription>
          Create a Squads multisig on devnet with your wallet as the only member
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {signature && <TransactionSuccess signature={signature} />}
        {squad && (
          <dl className="flex flex-col gap-2 text-sm">
            {[
              ["Multisig", squad.multisigPda],
              ["Vault", squad.vaultPda],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd>
                  <a
                    href={`https://explorer.solana.com/address/${value}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all font-mono text-xs underline underline-offset-4"
                  >
                    {value}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
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
          onClick={onCreateSquad}
          disabled={isSending}
          className="w-full sm:w-auto"
        >
          <Users />
          {isSending ? "Creating…" : "Create squad"}
        </Button>
      </CardFooter>
    </Card>
  );
};
