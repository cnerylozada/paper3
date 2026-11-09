"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { address, isAddress, lamports, sol } from "@solana/kit";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Balance } from "@/components/Balance";
import { useWalletAddress } from "@/components/hooks";
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
import { AppClient } from "@/lib/solana";

// Kept as a string: SOL has 9 decimals, so the amount is converted to lamports later
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

type TransferValues = z.infer<typeof transferSchema>;

export const TransferSOLForm = () => {
  const client = useClient<AppClient>();
  const { walletAddress, noWalletFallback } = useWalletAddress();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { destination: "", amount: "" },
  });

  if (!walletAddress) return noWalletFallback;

  const onSubmit = async (values: TransferValues) => {
    const transferIx = client.system.instructions.transferSol({
      source: client.payer,
      destination: address(values.destination),
      amount: sol(values.amount).raw,
    });
    const transferTxResult = await client.sendTransaction([transferIx]);
    console.log("transferTxResult", transferTxResult.context.signature);
  };

  return (
    <div className="flex flex-col gap-6">
      <Balance address={walletAddress} variant="card" />

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
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <Send />
              Transfer
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
