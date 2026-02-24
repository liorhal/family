/**
 * Remove the first family (by created_at).
 * Run with: npx tsx scripts/remove-first-family.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function remove() {
  const { data: family, error } = await supabase
    .from("families")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !family) {
    console.error("No family found or error:", error?.message ?? "none");
    process.exit(1);
  }

  const { error: delErr } = await supabase.from("families").delete().eq("id", family.id);

  if (delErr) {
    console.error("Failed to delete:", delErr);
    process.exit(1);
  }

  console.log(`Removed family: ${family.name} (${family.id})`);
}

remove().catch(console.error);
