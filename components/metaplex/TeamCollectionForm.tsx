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
import { COLLECTION_IMAGE_URL } from "./constants";
import { FormField } from "./FormField";

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 5;

const address = z
  .string()
  .refine((value) => isAddress(value), "Enter a valid address");

const schema = collectionBaseSchema.extend({
  squad: address.transform((value) => value.trim()), // the multisig address
  members: z
    .array(z.object({ address }))
    .min(MIN_MEMBERS, `A team needs at least ${MIN_MEMBERS} members`)
    .max(MAX_MEMBERS, `A team has at most ${MAX_MEMBERS} members`)
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

  const [metadata, setMetadata] = useState<object | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues, unknown, SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      squad: "",
      members: [{ address: "" }, { address: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  if (!wallet) return noWalletFallback;

  const onSubmit = ({ squad, members, ...collection }: SchemaType) => {
    setMetadata({
      ...collection,
      image: COLLECTION_IMAGE_URL,
      attributes: [
        { trait_type: "Mode", value: "Team" },
        { trait_type: "Squad", value: squad },
      ],
      properties: { creators: members },
    });
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
      <FormField
        id="team-squad"
        label="Squad address"
        hint="The squad's multisig address"
        error={errors.squad?.message}
      >
        <Input
          id="team-squad"
          className="font-mono"
          autoComplete="off"
          aria-invalid={!!errors.squad}
          aria-describedby={errors.squad ? "team-squad-error" : undefined}
          {...register("squad")}
        />
      </FormField>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Members</legend>
        <p className="text-xs text-muted-foreground">
          Between {MIN_MEMBERS} and {MAX_MEMBERS} wallets. Each one is a creator
        </p>
        {fields.map((field, index) => {
          const error = errors.members?.[index]?.address?.message;
          return (
            <FormField
              key={field.id}
              id={`team-member-${index}`}
              label={`Member ${index + 1}`}
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
                  aria-label={`Remove member ${index + 1}`}
                  disabled={fields.length <= MIN_MEMBERS}
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
          disabled={fields.length >= MAX_MEMBERS}
          onClick={() => append({ address: "" })}
        >
          <Plus />
          Add member
        </Button>
      </fieldset>
      {metadata && (
        <pre className="overflow-x-auto rounded-lg border p-3 text-xs">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
      <Button type="submit" className="w-full sm:w-auto sm:self-start">
        Create team collection
      </Button>
    </form>
  );
};
