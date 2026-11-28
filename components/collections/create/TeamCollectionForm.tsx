"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useClient } from "@solana/react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { StatusAlert } from "@/components/commons/StatusAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Constants } from "@/lib/database.types";
import { useWalletAddress } from "@/components/hooks";
import { AppClient } from "@/lib/solana";
import { byteLength } from "@/server/constants";
import { saveCollection } from "@/server/collections";
import { uploadTeamCollection } from "@/server/pinata/teamCollection";
import { explorerTxUrl } from "@/components/utils";
import { mintCollection } from "./onchain/metaplex";
import { createSquad } from "./onchain/squads";
import {
  teamCollectionSchema,
  type TeamCollectionInput,
  type TeamCollectionValues,
} from "./schemas";
import {
  MAX_COLLECTION_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_KEYWORD_LENGTH,
  MAX_KEYWORDS,
  MAX_MEMBERS,
  MIN_MEMBERS,
} from "./models";
import { AppButton } from "@/components/commons/AppButton";
import { AppChipGroup } from "@/components/commons/AppChipGroup";
import { AppKeywordsInput } from "@/components/commons/AppKeywordsInput";
import { AppTextArea } from "@/components/commons/AppTextArea";
import { CantChangeBadge } from "@/components/commons/CantChangeBadge";
import { LengthCounter } from "@/components/commons/LengthCounter";
import { AppTextInput } from "@/components/commons/AppTextInput";
import { FormField } from "@/components/commons/FormField";

// Collection for the papers of a squad (docs/metadata/team/collection.json)
export const TeamCollectionForm = () => {
  const { wallet, noWalletFallback } = useWalletAddress();

  const client = useClient<AppClient>();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [uri, setUri] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    setError: setFormError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamCollectionInput, unknown, TeamCollectionValues>({
    resolver: zodResolver(teamCollectionSchema),
    defaultValues: {
      name: "",
      description: "",
      keywords: [],
      members: [{ address: "" }],
    },
  });

  const nameLength = byteLength(useWatch({ control, name: "name" }));
  const descriptionLength = useWatch({ control, name: "description" }).length;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  if (!wallet) return noWalletFallback;

  const onSubmit = async ({ members, ...collection }: TeamCollectionValues) => {
    setError(null);
    setUri(null);
    setSignature(null);
    setIsSaved(false);
    // The creator goes first, then the members the student added
    const team = [wallet.address, ...members.map((m) => m.address.trim())];
    if (new Set(team).size !== team.length) {
      setFormError("members", { message: "A wallet is listed twice" });
      return;
    }
    try {
      // 1. The squad is created on-chain with the team as its members
      const { multisigPda } = await createSquad({
        client,
        wallet,
        signAndSendTransaction,
        members: team,
      });

      // 2. The metadata JSON goes to Pinata, with the new squad in it
      const { url } = await uploadTeamCollection({
        ...collection,
        squad: multisigPda,
        members: team,
      });
      setUri(url);

      // 3. The collection is minted on-chain with that uri
      const { signature, collection: nftAddress } = await mintCollection({
        wallet,
        signAndSendTransaction,
        name: collection.name,
        uri: url,
      });
      setSignature(signature);

      // 4. The collection and its members are stored
      await saveCollection({
        mode: "team",
        creatorWallet: wallet.address,
        members: team,
        ...collection,
        nftAddress,
        uri: url,
        txSignature: signature,
        multisigPda,
      });
      setIsSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the team");
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
        id="team-name"
        label="Collection name"
        hint="Name the topic, not a single draft."
        placeholder="Blockchain Research Team"
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
        id="team-description"
        label="Description"
        hint="One or two sentences about the question you are studying."
        placeholder="Papers by the Blockchain Research Team."
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
            id="team-field"
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
            id="team-keywords"
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
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Members</legend>
        <p className="text-xs text-muted-foreground">
          Between {MIN_MEMBERS} and {MAX_MEMBERS} wallets. Each one is a creator
        </p>
        <AppTextInput
          id="team-member-creator"
          label="Member 1 (you, the creator)"
          className="font-mono"
          value={wallet.address}
          disabled
        />
        {fields.map((field, index) => {
          const error = errors.members?.[index]?.address?.message;
          return (
            <FormField
              key={field.id}
              id={`team-member-${index}`}
              label={`Member ${index + 2}`}
              error={error}
            >
              <div className="flex gap-2">
                <Input
                  id={`team-member-${index}`}
                  className="font-mono"
                  placeholder="Wallet address"
                  autoComplete="off"
                  aria-invalid={!!error}
                  aria-describedby={
                    error ? `team-member-${index}-error` : undefined
                  }
                  {...register(`members.${index}.address`)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Remove member ${index + 2}`}
                  disabled={fields.length <= MIN_MEMBERS - 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            </FormField>
          );
        })}
        {(errors.members?.root?.message || errors.members?.message) && (
          <p role="alert" className="text-xs text-destructive">
            {errors.members?.root?.message ?? errors.members?.message}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={fields.length >= MAX_MEMBERS - 1}
          onClick={() => append({ address: "" })}
        >
          <Plus />
          Add member
        </Button>
      </fieldset>
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
        {isSubmitting ? "Creating..." : "Create team collection"}
      </AppButton>
    </form>
  );
};
