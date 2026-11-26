"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAddress } from "@solana/kit";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWalletAddress } from "../hooks";
import { collectionBaseSchema } from "./SoloCollectionForm";
import { MAX_MEMBERS, MIN_MEMBERS } from "@/server/constants";
import { uploadTeamCollection } from "@/server/pinata/teamCollection";
import { CollectionUploaded } from "./CollectionUploaded";
import { FormField } from "./FormField";

// Mock until the submit creates the squad. It will be the new multisig address
const MOCK_SQUAD = "5CbNUCvtTUZEPkuUGHHio5dGuBQ7D5zSvoZ2NR9JVSr5";

const address = z
  .string()
  .refine((value) => isAddress(value), "Enter a valid address");

// The creator (the connected wallet) is always the first member and is not in
// the form's list, so the list holds one member less than the team
const schema = collectionBaseSchema.extend({
  members: z
    .array(z.object({ address }))
    .min(MIN_MEMBERS - 1, `A team needs at least ${MIN_MEMBERS} members`)
    .max(MAX_MEMBERS - 1, `A team has at most ${MAX_MEMBERS} members`)
    .refine(
      (members) =>
        new Set(members.map((m) => m.address.trim())).size === members.length,
      "A wallet is listed twice",
    ),
});

type FormValues = z.input<typeof schema>;
type SchemaType = z.output<typeof schema>;

// Collection for the papers of a squad (docs/metadata/team/collection.json)
export const TeamCollectionForm = () => {
  const { wallet, noWalletFallback } = useWalletAddress();

  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    setError: setFormError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      members: [{ address: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  if (!wallet) return noWalletFallback;

  const onSubmit = async ({ members, ...collection }: SchemaType) => {
    setError(null);
    setUri(null);
    // The creator goes first, then the members the student added
    const team = [wallet.address, ...members.map((m) => m.address.trim())];
    if (new Set(team).size !== team.length) {
      setFormError("members", { message: "A wallet is listed twice" });
      return;
    }
    try {
      const { url } = await uploadTeamCollection({
        ...collection,
        squad: MOCK_SQUAD,
        members: team,
      });
      setUri(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField id="team-name" label="Name" error={errors.name?.message}>
        <Input
          id="team-name"
          placeholder="Blockchain Research Team"
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "team-name-error" : undefined}
          {...register("name")}
        />
      </FormField>
      <FormField
        id="team-description"
        label="Description"
        error={errors.description?.message}
      >
        <Textarea
          id="team-description"
          rows={3}
          placeholder="Papers by the Blockchain Research Team."
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "team-description-error" : undefined
          }
          {...register("description")}
        />
      </FormField>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Members</legend>
        <p className="text-xs text-muted-foreground">
          Between {MIN_MEMBERS} and {MAX_MEMBERS} wallets. Each one is a creator
        </p>
        <FormField id="team-member-creator" label="Member 1 (you, the creator)">
          <Input
            id="team-member-creator"
            className="font-mono"
            value={wallet.address}
            disabled
          />
        </FormField>
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
      {uri && <CollectionUploaded uri={uri} />}
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
        {isSubmitting ? "Uploading..." : "Create team collection"}
      </Button>
    </form>
  );
};
