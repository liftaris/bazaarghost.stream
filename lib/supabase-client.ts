import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { BACKEND_PUBLIC_KEY, BACKEND_URL } from "@/lib/backend";

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(BACKEND_URL, BACKEND_PUBLIC_KEY, {
  auth: {
    persistSession: false, // No auth needed for public search
  },
});

// Re-export types from the generated file
export type { Database } from "@/types/supabase";
export type { Tables, TablesInsert, TablesUpdate, Enums } from "@/types/supabase";