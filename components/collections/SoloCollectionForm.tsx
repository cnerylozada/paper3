"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useForm } from "react-hook-form";
import { SuccessAlert } from "@/components/commons/SuccessAlert";
import { explorerTxUrl } from "@/components/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWalletAddress } from "../hooks";
import { uploadSoloCollection } from "@/server/pinata/soloCollection";
import { FormField } from "../commons/FormField";
import { mintCollection } from "./onchain/metaplex";
import { soloCollectionSchema, type SoloCollectionValues } from "./schemas";

// Collection for the papers of one student (docs/metadata/solo/collection.json)
export const SoloCollectionForm = () => {
  const { wallet, noWalletFallback } = useWalletAddress();

  const [uri, setUri] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { signAndSendTransaction } = useSignAndSendTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SoloCollectionValues>({
    resolver: zodResolver(soloCollectionSchema),
    defaultValues: { name: "", description: "" },
  });

  if (!wallet) return noWalletFallback;

  const onSubmit = async (values: SoloCollectionValues) => {
    setError(null);
    setUri(null);
    setSignature(null);
    try {
      // 1. The metadata JSON goes to Pinata, its URL is the collection's uri
      const { url } = await uploadSoloCollection({
        ...values,
        owner: wallet.address,
      });
      setUri(url);

      // 2. The collection is minted on-chain with that uri
      const { signature } = await mintCollection({
        wallet,
        signAndSendTransaction,
        name: values.name,
        uri: url,
      });
      setSignature(signature);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not create the collection",
      );
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField id="solo-name" label="Name" error={errors.name?.message}>
        <Input
          id="solo-name"
          placeholder="Student Research Papers"
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "solo-name-error" : undefined}
          {...register("name")}
        />
      </FormField>
      <FormField
        id="solo-description"
        label="Description"
        error={errors.description?.message}
      >
        <Textarea
          id="solo-description"
          rows={3}
          placeholder="Papers by a solo student."
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "solo-description-error" : undefined
          }
          {...register("description")}
        />
      </FormField>
      <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        You will be the only creator:{" "}
        <span className="font-mono">{wallet.address}</span>
      </p>
      {uri && <SuccessAlert title="Collection metadata uploaded" href={uri} />}
      {signature && (
        <SuccessAlert
          title="Transaction sent"
          href={explorerTxUrl(signature)}
        />
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto sm:self-start"
      >
        {isSubmitting ? "Creating..." : "Create collection"}
      </Button>
    </form>
  );
};
