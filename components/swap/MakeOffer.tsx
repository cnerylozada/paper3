"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useClient } from "@solana/react";
import {
  address,
  appendTransactionMessageInstruction,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  isAddress,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppClient } from "@/lib/solana";
import { useWalletAddress } from "../hooks";

const mintSchema = z
  .string()
  .trim()
  // Boolean() keeps the type a plain string (isAddress is a type guard)
  .refine((value) => Boolean(isAddress(value)), "Enter a valid mint address");

// Fixed choices instead of a free numeric input
const AMOUNTS = ["0.5", "1", "1.5", "2", "2.5"] as const;

const makeOfferSchema = z.object({
  offeredMint: mintSchema,
  offeredAmount: z.enum(AMOUNTS),
  wantedMint: mintSchema,
  wantedAmount: z.enum(AMOUNTS),
});

type MakeOfferSchemaType = z.infer<typeof makeOfferSchema>;

// Each row: mint address on the left, amount picker on the right
const rows = [
  {
    mint: "offeredMint",
    amount: "offeredAmount",
    label: "You offer",
  },
  {
    mint: "wantedMint",
    amount: "wantedAmount",
    label: "You want",
  },
] as const;

// Same as Uuid::parse_str(id).into_bytes() in Rust: 32 hex chars -> 16 bytes
const uuidToBytes = (uuid: string) => {
  const hex = uuid.replace(/-/g, "");
  return Uint8Array.from(hex.match(/.{2}/g)!, (byte) => parseInt(byte, 16));
};

// We assume every mint has 9 decimals
const DECIMALS = 9;

// "2.5" -> 2500000000 (base units the program expects)
const toBaseUnits = (amount: string) =>
  BigInt(Math.round(Number(amount) * 10 ** DECIMALS));

export const MakeOffer = () => {
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
  } = useForm<MakeOfferSchemaType>({
    resolver: zodResolver(makeOfferSchema),
    defaultValues: {
      offeredMint: "",
      offeredAmount: "1",
      wantedMint: "",
      wantedAmount: "1",
    },
  });

  if (!wallet) return noWalletFallback;

  const onSubmit = async (values: MakeOfferSchemaType) => {
    setSignature(null);
    setError(null);
    setIsSending(true);

    const walletAddress = address(wallet.address);

    try {
      const { value: latestBlockhash } = await client.rpc
        .getLatestBlockhash()
        .send();

      // Simulates the uuid Supabase would give us when creating the offer row
      const supabaseId = crypto.randomUUID();
      // The offer PDA is derived from this id + the maker
      const id = uuidToBytes(supabaseId);

      // The plugin resolves the offer PDA and both ATAs from these inputs
      const makeOfferIx = await client.swap.instructions.makeOffer({
        id,
        maker: createNoopSigner(walletAddress),
        offeredMint: address(values.offeredMint),
        offeredAmount: toBaseUnits(values.offeredAmount),
        wantedMint: address(values.wantedMint),
        wantedAmount: toBaseUnits(values.wantedAmount),
      });

      const makeOfferTx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(walletAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(makeOfferIx, tx),
        (tx) => compileTransaction(tx),
        (tx) => new Uint8Array(getTransactionEncoder().encode(tx)),
      );

      const makeOfferTxResult = await signAndSendTransaction({
        transaction: makeOfferTx,
        wallet,
        chain: "solana:devnet",
      });

      setSignature(getBase58Decoder().decode(makeOfferTxResult.signature));
    } catch (e) {
      console.log("error", e);
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card size="sm" className="w-full max-w-md">
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <CardHeader>
          <CardTitle>Make offer</CardTitle>
          <CardDescription>
            Lock tokens in a vault and ask for another token in return
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {signature && <TransactionSuccess signature={signature} />}
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/50 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {rows.map((row) => {
            const mintError = errors[row.mint];
            return (
              <div key={row.mint} className="flex flex-col gap-1.5">
                <Label htmlFor={row.mint}>{row.label}</Label>
                <div className="flex gap-2">
                  <Input
                    id={row.mint}
                    type="text"
                    placeholder="Mint address"
                    autoComplete="off"
                    aria-invalid={!!mintError}
                    aria-describedby={
                      mintError ? `${row.mint}-error` : undefined
                    }
                    {...register(row.mint)}
                  />
                  <select
                    aria-label={`${row.label} amount`}
                    className="h-8 w-20 shrink-0 rounded-lg border border-input bg-transparent px-2 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    {...register(row.amount)}
                  >
                    {AMOUNTS.map((amount) => (
                      <option key={amount} value={amount}>
                        {amount}
                      </option>
                    ))}
                  </select>
                </div>
                {mintError && (
                  <p
                    id={`${row.mint}-error`}
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {mintError.message}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isSending}
            className="w-full sm:w-auto"
          >
            <ArrowLeftRight />
            {isSending ? "Sending…" : "Make offer"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
