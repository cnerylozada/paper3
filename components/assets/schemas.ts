import { z } from "zod";
import { byteLength, MAX_COLLECTION_NAME_LENGTH } from "@/server/constants";

// The fields the student fills in (docs/metadata/solo/asset.json). The rest
// is generated: status (Draft), created (today), the hash and the creator
export const soloDraftSchema = z.object({
  // The title is the asset's on-chain name: same 32 bytes limit as a collection
  name: z
    .string()
    .trim()
    .min(1, "Enter the paper title")
    .refine(
      (value) => byteLength(value) <= MAX_COLLECTION_NAME_LENGTH,
      `Max ${MAX_COLLECTION_NAME_LENGTH} bytes (accents and emoji count more)`,
    ),
  description: z.string().trim().min(1, "Enter the abstract"),
  field: z.string().trim().min(1, "Enter the field"),
  language: z.string().trim().min(1, "Enter the language"),
  pdf: z.custom<File>((value) => value instanceof File, "Choose the PDF"),
});
export type SoloDraftValues = z.infer<typeof soloDraftSchema>;
