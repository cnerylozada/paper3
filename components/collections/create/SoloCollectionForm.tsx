"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { Controller, useForm, useWatch } from "react-hook-form";
import { StatusAlert } from "@/components/commons/StatusAlert";
import { explorerTxUrl } from "@/components/utils";
import { byteLength } from "@/server/constants";
import { Constants } from "@/lib/database.types";
import { useWalletAddress } from "@/components/hooks";
import { saveCollection } from "@/server/collections";
import { uploadSoloCollection } from "@/server/pinata/soloCollection";
import { AppButton } from "@/components/commons/AppButton";
import { AppChipGroup } from "@/components/commons/AppChipGroup";
import { AppKeywordsInput } from "@/components/commons/AppKeywordsInput";
import { AppTextInput } from "@/components/commons/AppTextInput";
import { AppTextArea } from "@/components/commons/AppTextArea";
import { CantChangeBadge } from "@/components/commons/CantChangeBadge";
import { LengthCounter } from "@/components/commons/LengthCounter";
import { mintCollection } from "./onchain/metaplex";
import { soloCollectionSchema, type SoloCollectionValues } from "./schemas";
import {
  MAX_COLLECTION_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_KEYWORD_LENGTH,
  MAX_KEYWORDS,
} from "./models";

// Collection for the papers of one student (docs/metadata/solo/collection.json)
export const SoloCollectionForm = () => {
  const { wallet, noWalletFallback } = useWalletAddress();

  const [uri, setUri] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signAndSendTransaction } = useSignAndSendTransaction();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SoloCollectionValues>({
    resolver: zodResolver(soloCollectionSchema),
    defaultValues: { name: "", description: "", keywords: [] },
  });

  const nameLength = byteLength(useWatch({ control, name: "name" }));
  const descriptionLength = useWatch({ control, name: "description" }).length;

  if (!wallet) return noWalletFallback;

  const onSubmit = async (values: SoloCollectionValues) => {
    setError(null);
    setUri(null);
    setSignature(null);
    setIsSaved(false);
    try {
      // 1. The metadata JSON goes to Pinata, its URL is the collection's uri
      const { url } = await uploadSoloCollection({
        ...values,
        owner: wallet.address,
      });
      setUri(url);

      // 2. The collection is minted on-chain with that uri
      const { signature, collection } = await mintCollection({
        wallet,
        signAndSendTransaction,
        name: values.name,
        uri: url,
      });

      setSignature(signature);

      // 3. The collection and its only member (the creator) are stored
      await saveCollection({
        mode: "solo",
        creatorWallet: wallet.address,
        members: [wallet.address],
        ...values,
        nftAddress: collection,
        uri: url,
        txSignature: signature,
      });
      setIsSaved(true);
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
      <StatusAlert variant="warning" title="Saved on Solana for good">
        The name and description can&apos;t be edited after you create the
        collection.
      </StatusAlert>
      <AppTextInput
        id="solo-name"
        label="Collection name"
        hint="Name the topic, not a single draft."
        placeholder="Student Research Papers"
        error={errors.name?.message}
        aside={
          <>
            <CantChangeBadge />
            <LengthCounter
              length={nameLength}
              max={MAX_COLLECTION_NAME_LENGTH}
            />
          </>
        }
        {...register("name")}
      />
      <AppTextArea
        id="solo-description"
        label="Description"
        hint="One or two sentences about the question you are studying."
        placeholder="Papers by a solo student."
        maxLength={MAX_DESCRIPTION_LENGTH}
        error={errors.description?.message}
        aside={
          <>
            <CantChangeBadge />
            <LengthCounter
              length={descriptionLength}
              max={MAX_DESCRIPTION_LENGTH}
            />
          </>
        }
        {...register("description")}
      />
      <Controller
        name="field"
        control={control}
        render={({ field }) => (
          <AppChipGroup
            id="solo-field"
            label="Field"
            aside={<CantChangeBadge />}
            error={errors.field?.message}
            options={Constants.public.Enums.collection_field}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        name="keywords"
        control={control}
        render={({ field }) => (
          <AppKeywordsInput
            id="solo-keywords"
            label="Keywords"
            hint={`Up to ${MAX_KEYWORDS} words a reader would search for. Readers find your collection by these, by name and by field.`}
            error={errors.keywords?.message}
            aside={
              <LengthCounter length={field.value.length} max={MAX_KEYWORDS} />
            }
            value={field.value}
            onChange={field.onChange}
            max={MAX_KEYWORDS}
            maxLength={MAX_KEYWORD_LENGTH}
          />
        )}
      />
      <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        You will be the only creator:{" "}
        <span className="font-mono">{wallet.address}</span>
      </p>
      {uri && <StatusAlert title="Collection metadata uploaded" href={uri} />}
      {signature && (
        <StatusAlert
          title="Collection NFT minted on Solana"
          href={explorerTxUrl(signature)}
        />
      )}
      {isSaved && (
        <StatusAlert title="Collection saved">
          It is in your collections now.
        </StatusAlert>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <AppButton
        type="submit"
        loading={isSubmitting}
        className="w-full sm:w-auto sm:self-start"
      >
        {isSubmitting ? "Creating..." : "Create collection"}
      </AppButton>
    </form>
  );
};
