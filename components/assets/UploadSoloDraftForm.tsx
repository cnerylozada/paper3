"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { Controller, useForm } from "react-hook-form";
import { uploadPdfHashSvg } from "@/server/pinata/assets";
import { uploadSoloAsset } from "@/server/pinata/soloAsset";
import { SuccessAlert } from "@/components/commons/SuccessAlert";
import { explorerTxUrl } from "@/components/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "../commons/FormField";
import { useWalletAddress } from "../hooks";
import { PaperDropzoneFormField } from "./PaperDropzoneFormField";
import { mintAsset } from "./onchain/metaplex";
import { buildSvg, hashFile, toHex } from "./utils";
import { soloDraftSchema, type SoloDraftValues } from "./schemas";

// Mocked until the form lets the student pick a collection: "My first solo
// collection" and its public Pinata group
const MOCK_COLLECTION = "A5bqtBh42m2ERkoZsU1hEe1VvcwQR6oDcUcieHMDCLuA";
const MOCK_GROUP_ID = "7829cc1e-de16-492e-a871-7623925e7a3a";

// Draft of a paper of a solo collection (docs/metadata/solo/asset.json)
export const UploadSoloDraftForm = () => {
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
  } = useForm<SoloDraftValues>({
    resolver: zodResolver(soloDraftSchema),
    defaultValues: {
      name: "",
      description: "",
      field: "",
      language: "",
    },
  });

  if (!wallet) return noWalletFallback;

  const onSubmit = async ({ pdf, ...paper }: SoloDraftValues) => {
    setError(null);
    setUri(null);
    setSignature(null);
    try {
      // 1. The PDF's hash becomes an SVG, uploaded to Pinata. The PDF itself
      // never leaves the browser
      const hash = await hashFile(pdf);
      const docHash = toHex(hash);
      const { url: image } = await uploadPdfHashSvg({
        svg: buildSvg(hash),
        docHash,
        owner: wallet.address,
        mode: "solo",
        groupId: MOCK_GROUP_ID,
      });

      // 2. The asset's metadata JSON, its URL is the asset's uri
      const { url } = await uploadSoloAsset({
        ...paper,
        image,
        docHash,
        owner: wallet.address,
        groupId: MOCK_GROUP_ID,
      });
      setUri(url);

      // 3. The asset is minted on-chain inside the collection
      const { signature } = await mintAsset({
        wallet,
        signAndSendTransaction,
        collection: MOCK_COLLECTION,
        name: paper.name,
        uri: url,
      });
      setSignature(signature);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the draft");
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField id="draft-name" label="Title" error={errors.name?.message}>
        <Input
          id="draft-name"
          placeholder="Consensus in Solana"
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "draft-name-error" : undefined}
          {...register("name")}
        />
      </FormField>
      <FormField
        id="draft-description"
        label="Abstract"
        error={errors.description?.message}
      >
        <Textarea
          id="draft-description"
          rows={4}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "draft-description-error" : undefined
          }
          {...register("description")}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="draft-field" label="Field" error={errors.field?.message}>
          <Input
            id="draft-field"
            placeholder="Blockchain"
            autoComplete="off"
            aria-invalid={!!errors.field}
            aria-describedby={errors.field ? "draft-field-error" : undefined}
            {...register("field")}
          />
        </FormField>
        <FormField
          id="draft-language"
          label="Language"
          error={errors.language?.message}
        >
          <Input
            id="draft-language"
            placeholder="English"
            autoComplete="off"
            aria-invalid={!!errors.language}
            aria-describedby={
              errors.language ? "draft-language-error" : undefined
            }
            {...register("language")}
          />
        </FormField>
      </div>
      <Controller
        name="pdf"
        control={control}
        render={({ field }) => (
          <PaperDropzoneFormField
            id="draft-pdf"
            label="PDF"
            value={field.value ?? null}
            onChange={field.onChange}
            error={errors.pdf?.message}
          />
        )}
      />
      <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        Creator: <span className="font-mono">{wallet.address}</span>
      </p>
      {uri && <SuccessAlert title="Asset metadata uploaded" href={uri} />}
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
        {isSubmitting ? "Minting..." : "Upload draft"}
      </Button>
    </form>
  );
};
