"use client";

import {
  create,
  createCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import {
  createNoopSigner,
  generateSigner,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { getBase58Decoder } from "@solana/kit";
import { Layers } from "lucide-react";
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
import { useWalletAddress } from "../hooks";

// The URI points to the metadata JSON (image, description) already uploaded to Pinata
const COLLECTION_NAME = "Panagram Reward: EASY";
const COLLECTION_URI =
  "https://coral-giant-donkey-508.mypinata.cloud/ipfs/bafkreibv3myd2t7p2dx7exo3wfjsry2swfapum6nvfbqsfj6qjgdjifn6a";

const ASSET_NAME = "Research Draft: Title of the Research";
const ASSET_URI =
  "https://coral-giant-donkey-508.mypinata.cloud/ipfs/bafkreidvageavyhdsoyig35rryptwbyqkznqtvvpsxgaknddkowful5vfa";

export const NFT101 = () => {
  const { wallet, noWalletFallback } = useWalletAddress();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!wallet) return noWalletFallback;

  const onCreate = async () => {
    setSignature(null);
    setError(null);
    setIsSending(true);

    try {
      // The wallet is the identity (fee payer and collection authority) as a
      // no-op signer: it adds no signature here, Privy signs it when sending
      const umi = createUmi("https://api.devnet.solana.com")
        .use(mplCore())
        .use(signerIdentity(createNoopSigner(publicKey(wallet.address))));

      // The collection and the asset are new accounts, so each needs its own keypair
      const collectionSigner = generateSigner(umi);
      const assetSigner = generateSigner(umi);

      // Two instructions in a single transaction: the asset is created
      // after the collection, in the same transaction
      const collectionAndAssetTx = await createCollection(umi, {
        collection: collectionSigner,
        name: COLLECTION_NAME,
        uri: COLLECTION_URI,
      })
        .add(
          create(umi, {
            asset: assetSigner,
            collection: collectionSigner,
            name: ASSET_NAME,
            uri: ASSET_URI,
          }),
        )
        .buildAndSign(umi); // signs with the collection and asset keypairs only

      // Privy adds the wallet signature and sends the transaction
      const collectionAndAssetTxResult = await signAndSendTransaction({
        transaction: umi.transactions.serialize(collectionAndAssetTx),
        wallet,
        chain: "solana:devnet",
      });

      setSignature(
        getBase58Decoder().decode(collectionAndAssetTxResult.signature),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create NFT collection</CardTitle>
        <CardDescription>
          Create a Metaplex Core collection on devnet
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
          onClick={onCreate}
          disabled={isSending}
          className="w-full sm:w-auto"
        >
          <Layers />
          {isSending ? "Creating…" : "Create collection"}
        </Button>
      </CardFooter>
    </Card>
  );
};
