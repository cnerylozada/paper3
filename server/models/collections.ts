import type { Enums } from "@/lib/database.types";

// Column types of the collections table, taken from the database so the form
// can only offer what the database accepts
export type CollectionField = Enums<"collection_field">;
export type CollectionMode = Enums<"collection_mode">;
