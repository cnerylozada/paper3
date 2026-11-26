import { isAddress } from "@solana/kit";
import { z } from "zod";
import {
  MAX_COLLECTION_NAME_LENGTH,
  MAX_MEMBERS,
  MIN_MEMBERS,
} from "@/server/constants";

const address = z
  .string()
  .refine((value) => isAddress(value), "Enter a valid address");

// The fields every collection has
const collectionBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(
      MAX_COLLECTION_NAME_LENGTH,
      `Max ${MAX_COLLECTION_NAME_LENGTH} characters`,
    ),
  description: z.string().trim().min(1, "Enter a description"),
});

// Solo: the student is the only creator, so there is nothing else to ask
export const soloCollectionSchema = collectionBaseSchema;
export type SoloCollectionValues = z.infer<typeof soloCollectionSchema>;

// Team: the creator (the connected wallet) is always the first member and is
// not in the form's list, so the list holds one member less than the team
export const teamCollectionSchema = collectionBaseSchema.extend({
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
export type TeamCollectionInput = z.input<typeof teamCollectionSchema>;
export type TeamCollectionValues = z.output<typeof teamCollectionSchema>;
