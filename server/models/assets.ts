import type { Enums } from "@/lib/database.types";

// Column types of the assets table, taken from the database so the form can
// only offer what the database accepts
export type AssetDocumentType = Enums<"asset_document_type">;
export type AssetLanguage = Enums<"asset_language">;
