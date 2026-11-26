import { z } from "zod";

// The fields the student fills in (docs/metadata/solo/asset.json). The rest
// is generated: status (Draft), created (today), the hash and the creator
export const soloDraftSchema = z.object({
  name: z.string().trim().min(1, "Enter the paper title"),
  description: z.string().trim().min(1, "Enter the abstract"),
  field: z.string().trim().min(1, "Enter the field"),
  language: z.string().trim().min(1, "Enter the language"),
  pdf: z.custom<File>((value) => value instanceof File, "Choose the PDF"),
});
export type SoloDraftValues = z.infer<typeof soloDraftSchema>;
