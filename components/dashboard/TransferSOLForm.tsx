"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  address,
  isAddress,
  sol,
  appendTransactionMessageInstruction,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import { Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Balance } from "@/components/Balance";
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
import { useClient } from "@solana/react";
import { StatusAlert } from "@/components/commons/StatusAlert";
import { explorerTxUrl } from "@/components/utils";
import { AppClient } from "@/lib/solana";
import { useWalletAddress } from "../hooks";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";

const transferSchema = z.object({
  destination: z
    .string()
    .trim()
    .min(1, "Enter a destination address")
    .refine((value) => Boolean(isAddress(value)), "Not a valid Solana address"),
  amount: z
    .string()
    .trim()
    .min(1, "Enter an amount")
    .regex(/^\d+(\.\d{1,9})?$/, "Use a number with up to 9 decimals")
    .refine((value) => Number(value) > 0, "Amount must be greater than 0"),
});

type TransferSchemaType = z.infer<typeof transferSchema>;

export const TransferSOLForm = () => {
  const { wallet, noWalletFallback } = useWalletAddress();

  const client = useClient<AppClient>();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferSchemaType>({
    resolver: zodResolver(transferSchema),
    defaultValues: { destination: "", amount: "" },
  });

  if (!wallet) return noWalletFallback;

  const onSubmit = async (values: TransferSchemaType) => {
    setSignature(null);
    setError(null);
    setIsSending(true);

    const walletAddress = address(wallet.address);

    try {
      const { value: latestBlockhash } = await client.rpc
        .getLatestBlockhash()
        .send();

      const transferSOLIx = client.system.instructions.transferSol({
        source: createNoopSigner(walletAddress),
        destination: address(values.destination),
        amount: sol(values.amount).raw,
      });

      const transferSOLTx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(walletAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx), // Set recent blockhash
        (tx) => appendTransactionMessageInstruction(transferSOLIx, tx),
        (tx) => compileTransaction(tx), // Compile the transaction
        (tx) => new Uint8Array(getTransactionEncoder().encode(tx)), // Finally encode the transaction
      );

      const transferSOLTxResult = await signAndSendTransaction({
        transaction: transferSOLTx,
        wallet,
        chain: "solana:devnet",
      });

      setSignature(getBase58Decoder().decode(transferSOLTxResult.signature));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Balance address={address(wallet.address)} variant="card" />

      <Card className="w-full max-w-2xl">
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <CardHeader>
            <CardTitle>Transfer SOL</CardTitle>
            <CardDescription>
              Send SOL from your wallet on devnet
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                type="text"
                placeholder="Recipient wallet address"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={!!errors.destination}
                aria-describedby={
                  errors.destination ? "destination-error" : undefined
                }
                className="font-mono"
                {...register("destination")}
              />
              {errors.destination && (
                <p
                  id="destination-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.destination.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  autoComplete="off"
                  aria-invalid={!!errors.amount}
                  aria-describedby={errors.amount ? "amount-error" : undefined}
                  className="pr-12 tabular-nums"
                  {...register("amount")}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  SOL
                </span>
              </div>
              {errors.amount && (
                <p
                  id="amount-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.amount.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isSending}
              className="w-full sm:w-auto"
            >
              <Send />
              {isSending ? "Sending…" : "Transfer"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
