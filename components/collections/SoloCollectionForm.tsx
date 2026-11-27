"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { Controller, useForm, useWatch } from "react-hook-form";
import { SuccessAlert } from "@/components/commons/SuccessAlert";
import { explorerTxUrl } from "@/components/utils";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  byteLength,
  MAX_COLLECTION_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  FIELDS,
  MAX_KEYWORD_LENGTH,
  MAX_KEYWORDS,
} from "@/server/constants";
import { useWalletAddress } from "../hooks";
import { uploadSoloCollection } from "@/server/pinata/soloCollection";
import { ChipRadioGroup } from "../commons/ChipRadioGroup";
import { KeywordsInput } from "../commons/KeywordsInput";
import { AppButton } from "../commons/AppButton";
import { FormField } from "../commons/FormField";
import { mintCollection } from "./onchain/metaplex";
import { soloCollectionSchema, type SoloCollectionValues } from "./schemas";

const CantChangeBadge = () => (
  <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
    Can&apos;t change later
  </Badge>
);

// Collection for the papers of one student (docs/metadata/solo/collection.json)
export const SoloCollectionForm = () => {
  const { wallet, noWalletFallback } = useWalletAddress();

  const [uri, setUri] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
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
  const keywordCount = useWatch({ control, name: "keywords" }).length;

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
      <Alert className="border-amber-600/30 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
        <TriangleAlert />
        <AlertTitle>Saved on Solana for good</AlertTitle>
        <AlertDescription className="text-amber-900/90 dark:text-amber-200/90">
          The name and description can&apos;t be edited after you create the
          collection.
        </AlertDescription>
      </Alert>
      <FormField
        id="solo-name"
        label="Collection name"
        hint="Name the topic, not a single draft."
        aside={
          <span className="flex items-center gap-2">
            <CantChangeBadge />
            <span className="text-xs text-muted-foreground">
              {nameLength}/{MAX_COLLECTION_NAME_LENGTH}
            </span>
          </span>
        }
        error={errors.name?.message}
      >
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
        hint="One or two sentences about the question you are studying."
        aside={
          <span className="flex items-center gap-2">
            <CantChangeBadge />
            <span className="text-xs text-muted-foreground">
              {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </span>
        }
        error={errors.description?.message}
      >
        <Textarea
          id="solo-description"
          rows={4}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder="Papers by a solo student."
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "solo-description-error" : undefined
          }
          {...register("description")}
        />
      </FormField>
      <Controller
        name="field"
        control={control}
        render={({ field }) => (
          <FormField
            id="solo-field"
            label="Field"
            aside={<CantChangeBadge />}
            error={errors.field?.message}
          >
            <ChipRadioGroup
              label="Field"
              options={FIELDS}
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.field}
            />
          </FormField>
        )}
      />
      <Controller
        name="keywords"
        control={control}
        render={({ field }) => (
          <FormField
            id="solo-keywords"
            label="Keywords"
            hint="Up to 5 words a reader would search for. Readers find your collection by these, by name and by field."
            aside={
              <span className="text-xs text-muted-foreground">
                {keywordCount}/{MAX_KEYWORDS}
              </span>
            }
            error={errors.keywords?.message}
          >
            <KeywordsInput
              id="solo-keywords"
              value={field.value}
              onChange={field.onChange}
              max={MAX_KEYWORDS}
              maxLength={MAX_KEYWORD_LENGTH}
              invalid={!!errors.keywords}
              describedBy={errors.keywords ? "solo-keywords-error" : undefined}
            />
          </FormField>
        )}
      />
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
