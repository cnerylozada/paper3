"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useClient } from "@solana/react";
import { type Address, isSignature, signature } from "@solana/kit";
import * as multisig from "@sqds/multisig-kit";
import { Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CopyAddress } from "@/components/CopyAddress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppClient } from "@/lib/solana";
import { cn } from "@/lib/utils";

const schema = z.object({
  signature: z
    .string()
    .trim()
    // Boolean() keeps the type a plain string (isSignature is a type guard)
    .refine((value) => Boolean(isSignature(value)), "Enter a valid signature"),
});

type SchemaType = z.infer<typeof schema>;

export const TransactionSigners = () => {
  const client = useClient<AppClient>();

  const [result, setResult] = useState<{
    proposalPda: Address;
    // Every member of the squad and what they did in this proposal
    members: { key: Address; executed: boolean; approved: boolean }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: { signature: "" },
  });

  const onSubmit = async (values: SchemaType) => {
    setResult(null);
    setError(null);
    setIsLoading(true);

    try {
      // 1. The execution transaction
      const transaction = await client.rpc
        .getTransaction(signature(values.signature), {
          encoding: "jsonParsed",
          maxSupportedTransactionVersion: 0,
        })
        .send();

      if (!transaction) {
        throw new Error("Transaction not found on devnet");
      }

      // 2. Its Squads instruction (vaultTransactionExecute)
      const executeIx = transaction.transaction.message.instructions.find(
        (ix) => ix.programId === multisig.PROGRAM_ADDRESS,
      );
      if (!executeIx || !("accounts" in executeIx)) {
        throw new Error("This is not a Squads execution transaction");
      }

      // vaultTransactionExecute accounts: [multisig, proposal, transaction, member]
      const proposalPda = executeIx.accounts[1];
      // The member who executed it, and signed this transaction
      const executor = executeIx.accounts[3];

      // 3. The proposal keeps the members who approved it. They are only
      // added when they sign their approve transaction
      const { data: proposal } = await multisig.accounts.fetchProposal(
        client.rpc,
        proposalPda,
      );

      // 4. The squad's members, to compare them with who took part
      const { data: squad } = await multisig.accounts.fetchMultisig(
        client.rpc,
        executeIx.accounts[0],
      );

      setResult({
        proposalPda,
        members: squad.members.map(({ key }) => ({
          key,
          executed: key === executor,
          approved: proposal.approved.includes(key),
        })),
      });
    } catch (e) {
      console.log("error", e);
      setError(
        e instanceof Error ? e.message : "Could not read the transaction",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Approving or executing both mean the member signed a transaction
  const participants =
    result?.members.filter((m) => m.approved || m.executed).length ?? 0;
  const allTookPart = !!result && participants === result.members.length;

  return (
    <Card className="w-full max-w-2xl">
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <CardHeader>
          <CardTitle>Transaction signers</CardTitle>
          <CardDescription>
            Paste the signature of a proposal execution to see who executed and
            who approved it
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="signature">Signature</Label>
            <Input
              id="signature"
              type="text"
              placeholder="Transaction signature"
              autoComplete="off"
              aria-invalid={!!errors.signature}
              aria-describedby={
                errors.signature ? "signature-error" : undefined
              }
              {...register("signature")}
            />
            {errors.signature && (
              <p
                id="signature-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.signature.message}
              </p>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/50 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {result && (
            <div className="flex flex-col gap-3">
              <p
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium",
                  allTookPart
                    ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {allTookPart ? (
                  <ShieldCheck className="size-4 shrink-0" />
                ) : (
                  <ShieldAlert className="size-4 shrink-0" />
                )}
                {allTookPart
                  ? `All ${result.members.length} squad members took part`
                  : `${participants} of ${result.members.length} squad members took part`}
              </p>
              <ul className="flex flex-col divide-y rounded-lg border">
                {result.members.map((member) => (
                  <li
                    key={member.key}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <CopyAddress value={member.key} />
                    <span className="flex gap-1.5 text-xs">
                      {member.approved && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                          Approved
                        </span>
                      )}
                      {member.executed && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium">
                          Executed
                        </span>
                      )}
                      {!member.approved && !member.executed && (
                        <span className="text-muted-foreground">
                          Did not sign
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Proposal
                <CopyAddress value={result.proposalPda} />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <Search />
            {isLoading ? "Searching…" : "Get signers"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
