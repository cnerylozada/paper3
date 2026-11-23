"use client";

import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useClient, useRequest } from "@solana/react";
import {
  Address,
  address,
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
import { RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { TransactionSuccess } from "@/components/TransactionSuccess";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Offer, SWAP_PROGRAM_ADDRESS } from "@/lib/programs/swap/generated";
import { AppClient } from "@/lib/solana";
import { useWalletAddress } from "../hooks";
import { OfferCard } from "./OfferCard";

export const OfferList = () => {
  const { wallet, noWalletFallback } = useWalletAddress();
  const client = useClient<AppClient>();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Address of the offer being taken (disables the buttons meanwhile)
  const [takingOffer, setTakingOffer] = useState<Address | null>(null);

  const fetchOffers = useCallback(async () => {
    // Every account owned by the swap program is an Offer
    const accounts = await client.rpc
      .getProgramAccounts(SWAP_PROGRAM_ADDRESS, { encoding: "base64" })
      .send();

    // Decode them with our swap plugin
    const offers = await client.swap.accounts.offer.fetchAll(
      accounts.map((account) => account.pubkey),
    );

    // Newest first
    return offers.sort((a, b) => Number(b.data.createdAt - a.data.createdAt));
  }, [client]);

  const { data: offers, status, refresh } = useRequest(fetchOffers);

  if (!wallet) return noWalletFallback;

  const takeOffer = async (offerAddress: Address, offer: Offer) => {
    setSignature(null);
    setError(null);
    setTakingOffer(offerAddress);

    const walletAddress = address(wallet.address);

    try {
      const { value: latestBlockhash } = await client.rpc
        .getLatestBlockhash()
        .send();

      // The plugin resolves the vault and all the ATAs from these inputs
      const takeOfferIx = await client.swap.instructions.takeOffer({
        taker: createNoopSigner(walletAddress),
        maker: offer.maker,
        offer: offerAddress,
        offeredMint: offer.offeredMint,
        wantedMint: offer.wantedMint,
      });

      const takeOfferTx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(walletAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(takeOfferIx, tx),
        (tx) => compileTransaction(tx),
        (tx) => new Uint8Array(getTransactionEncoder().encode(tx)),
      );

      const takeOfferTxResult = await signAndSendTransaction({
        transaction: takeOfferTx,
        wallet,
        chain: "solana:devnet",
      });

      setSignature(getBase58Decoder().decode(takeOfferTxResult.signature));
      // The offer account is closed, so reload the list
      refresh();
    } catch (e) {
      console.log("error", e);
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setTakingOffer(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Open offers</h2>
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
      {signature && <TransactionSuccess signature={signature} />}
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
          Could not load the offers
        </p>
      )}
      {!offers && status !== "error" && <Skeleton className="h-24 w-full" />}
      {offers && offers.length === 0 && (
        <p className="text-sm text-muted-foreground">No offers yet</p>
      )}
      {offers?.map(({ address, data }) => (
        <OfferCard
          key={address}
          offer={data}
          isTaking={takingOffer === address}
          disabled={takingOffer !== null}
          onTakeOffer={() => takeOffer(address, data)}
        />
      ))}
    </div>
  );
};
