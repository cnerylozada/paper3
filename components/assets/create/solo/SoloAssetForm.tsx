"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { AppButton } from "@/components/commons/AppButton";
import { AppChipGroup } from "@/components/commons/AppChipGroup";
import { AppTextArea } from "@/components/commons/AppTextArea";
import { AppTextInput } from "@/components/commons/AppTextInput";
import { LengthCounter } from "@/components/commons/LengthCounter";
import { RadioCardGroup } from "@/components/commons/RadioCardGroup";
import { StatusAlert } from "@/components/commons/StatusAlert";
import { useWalletAddress } from "@/components/hooks";
import { explorerTxUrl } from "@/components/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Constants } from "@/lib/database.types";
import { saveSoloAsset } from "@/server/assets";
import { uploadPdfHashSvg } from "@/server/pinata/assets/hashSvg";
import {
  getSoloCollectionGroupId,
  uploadSoloAssetPdf,
  uploadSoloAssetMetadata,
} from "@/server/pinata/assets/soloAsset";
import { PublishNotes } from "../PublishNotes";
import { buildSvg, hashFile, toHex } from "../../utils";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_WHATS_NEW_LENGTH,
} from "../../models";
import { mintAssetInCollection } from "./onchain/metaplex";
import { PdfDropzone } from "../PdfDropzone";
import { soloAssetSchema, type SoloAssetValues } from "../schemas";
import type { NextVersion } from "../../version";

// A new version (asset) of a solo collection: its details and the draft PDF
export const SoloAssetForm = ({
  collectionId,
  collectionName,
  collectionAddress,
  next,
}: {
  collectionId: string;
  collectionName: string;
  collectionAddress: string; // the Metaplex Core collection the asset joins
  next: NextVersion;
}) => {
  const { wallet, noWalletFallback } = useWalletAddress();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [metadataUri, setMetadataUri] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SoloAssetValues>({
    resolver: zodResolver(soloAssetSchema),
    defaultValues: {
      kind: "major",
      title: "",
      description: "",
      whatsNew: "",
    },
  });

  const kind = useWatch({ control, name: "kind" });
  const titleLength = useWatch({ control, name: "title" }).length;
  const descriptionLength = useWatch({ control, name: "description" }).length;
  const whatsNewLength = useWatch({ control, name: "whatsNew" }).length;

  const version = kind === "minor" && next.minor ? next.minor : next.major;

  if (!wallet) return noWalletFallback;

  const onSubmit = async ({
    file,
    title,
    description,
    documentType,
    language,
    whatsNew,
  }: SoloAssetValues) => {
    const values = { title, description, documentType, language, whatsNew };
    setError(null);
    setMetadataUri(null);
    setSignature(null);
    setFileUri(null);
    setIsSaved(false);
    try {
      const owner = wallet.address;
      // Every file of the version goes in the collection's group, named after
      // the version (v1.0-image.svg, v1.0-asset.json, v1.0-paper.pdf)
      const groupId = await getSoloCollectionGroupId({
        collectionName,
        owner,
      });

      // 1. The PDF's hash becomes an SVG, uploaded to Pinata
      const hash = await hashFile(file);
      const docHash = toHex(hash);
      const { url: image } = await uploadPdfHashSvg({
        svg: buildSvg(hash),
        docHash,
        owner,
        mode: "solo",
        groupId,
        version,
      });

      // 2. The JSON with the form's values and the SVG, its URL is the uri
      const { url: metadataUri } = await uploadSoloAssetMetadata({
        ...values,
        version,
        image,
        docHash,
        owner,
        groupId,
      });
      setMetadataUri(metadataUri);

      // 3. The asset is minted inside the collection
      const { signature, asset } = await mintAssetInCollection({
        wallet,
        signAndSendTransaction,
        collection: collectionAddress,
        name: values.title,
        uri: metadataUri,
      });
      setSignature(signature);

      // 4. The PDF goes to Pinata's public network
      const { url: fileUri } = await uploadSoloAssetPdf({
        file,
        version,
        docHash,
        owner,
        groupId,
      });
      setFileUri(fileUri);

      // 5. The version is stored
      await saveSoloAsset({
        collectionId,
        creatorWallet: owner,
        version,
        ...values,
        fileUri,
        metadataUri,
        nftAddress: asset,
        mintTxSignature: signature,
      });
      setIsSaved(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not publish the version",
      );
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
      <Card>
        <CardContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {next.minor && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  What kind of change is it?
                </span>
                <Controller
                  name="kind"
                  control={control}
                  render={({ field }) => (
                    <RadioCardGroup
                      label="What kind of change is it?"
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        {
                          value: "major",
                          title: `Major · ${next.major}`,
                          description: `New results or a rewrite. Sold separately, buyers of ${next.latest} don't get it.`,
                        },
                        {
                          value: "minor",
                          title: `Minor · ${next.minor}`,
                          description: `Corrections and small additions. Free for everyone with ${next.latest} access.`,
                        },
                      ]}
                    />
                  )}
                />
              </div>
            )}
            <Controller
              name="file"
              control={control}
              render={({ field }) => (
                <PdfDropzone
                  id="solo-asset-file"
                  label="Draft PDF"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.file?.message}
                />
              )}
            />
            <AppTextInput
              id="solo-asset-title"
              label="Version title"
              hint={`The title of this draft only. Buyers see it on the ${version} card.`}
              error={errors.title?.message}
              aside={
                <LengthCounter length={titleLength} max={MAX_TITLE_LENGTH} />
              }
              {...register("title")}
            />
            <AppTextArea
              id="solo-asset-description"
              label="Version description"
              hint={`Shown free to buyers, and on the marketplace card while ${version} is the latest.`}
              maxLength={MAX_DESCRIPTION_LENGTH}
              error={errors.description?.message}
              aside={
                <LengthCounter
                  length={descriptionLength}
                  max={MAX_DESCRIPTION_LENGTH}
                />
              }
              {...register("description")}
            />
            <Controller
              name="documentType"
              control={control}
              render={({ field }) => (
                <AppChipGroup
                  id="solo-asset-document-type"
                  label="Document type"
                  hint="What this version is. It can change between versions, for example from proposal to article."
                  error={errors.documentType?.message}
                  options={Constants.public.Enums.asset_document_type}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <AppChipGroup
                  id="solo-asset-language"
                  label="Language"
                  error={errors.language?.message}
                  options={Constants.public.Enums.asset_language}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {next.latest && (
              <AppTextArea
                id="solo-asset-whats-new"
                label={`What's new in ${version}`}
                hint={`What changed from ${next.latest}. Optional.`}
                maxLength={MAX_WHATS_NEW_LENGTH}
                error={errors.whatsNew?.message}
                aside={
                  <LengthCounter
                    length={whatsNewLength}
                    max={MAX_WHATS_NEW_LENGTH}
                  />
                }
                {...register("whatsNew")}
              />
            )}
            {metadataUri && (
              <StatusAlert
                title="Version metadata uploaded"
                href={metadataUri}
              />
            )}
            {signature && (
              <StatusAlert
                title="Version minted on Solana"
                href={explorerTxUrl(signature)}
              />
            )}
            {fileUri && <StatusAlert title="PDF uploaded" href={fileUri} />}
            {isSaved && (
              <StatusAlert title="Version saved">
                {version} is in your collection now.
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
              {isSubmitting ? "Publishing..." : `Publish ${version}`}
            </AppButton>
          </form>
        </CardContent>
      </Card>
      <aside>
        <PublishNotes
          version={version}
          change={
            kind === "minor" && next.minor
              ? "minor"
              : next.latest
                ? "major"
                : "first"
          }
        />
      </aside>
    </div>
  );
};
