import { z } from "zod";
import { Constants } from "@/lib/database.types";
import type { AssetDocumentType, AssetLanguage } from "@/server/models/assets";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PDF_BYTES,
  MAX_PDF_MB,
  MAX_TITLE_LENGTH,
  MAX_WHATS_NEW_LENGTH,
} from "../models";

export const soloAssetSchema = z.object({
  kind: z.enum(["major", "minor"]),
  title: z
    .string()
    .trim()
    .min(1, "Enter a title")
    .max(MAX_TITLE_LENGTH, `Max ${MAX_TITLE_LENGTH} characters`),
  description: z
    .string()
    .trim()
    .min(1, "Enter a description")
    .max(MAX_DESCRIPTION_LENGTH, `Max ${MAX_DESCRIPTION_LENGTH} characters`),
  documentType: z.custom<AssetDocumentType>(
    (value) =>
      Constants.public.Enums.asset_document_type.includes(
        value as AssetDocumentType,
      ),
    "Choose a document type",
  ),
  language: z.custom<AssetLanguage>(
    (value) =>
      Constants.public.Enums.asset_language.includes(value as AssetLanguage),
    "Choose a language",
  ),
  whatsNew: z
    .string()
    .trim()
    .max(MAX_WHATS_NEW_LENGTH, `Max ${MAX_WHATS_NEW_LENGTH} characters`),
  file: z
    .custom<File>((value) => value instanceof File, "Choose your draft PDF")
    .refine((file) => file.type === "application/pdf", "Only PDF files")
    .refine((file) => file.size <= MAX_PDF_BYTES, `Up to ${MAX_PDF_MB} MB`),
});
export type SoloAssetValues = z.infer<typeof soloAssetSchema>;
