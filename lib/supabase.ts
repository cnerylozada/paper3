import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server only (server actions). The secret key bypasses RLS, so never import
// this file from a "use client" component
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);
