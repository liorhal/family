/**
 * Set password for old families (those without login_code).
 * Creates family login: {login_code} / password: demo123
 * Login code = first 8 chars of family id (no hyphens).
 *
 * Run with: npx tsx scripts/migrate-old-families-password.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = "demo123";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

function getLoginCode(familyId: string): string {
  return familyId.replace(/-/g, "").substring(0, 8);
}

async function migrate() {
  const { data: families, error } = await supabase
    .from("families")
    .select("id, name")
    .is("login_code", null);

  if (error) {
    console.error("Failed to fetch families:", error);
    process.exit(1);
  }

  if (!families?.length) {
    console.log("No old families to migrate.");
    return;
  }

  console.log(`Found ${families.length} old families. Setting password to demo123...\n`);

  for (const family of families) {
    const loginCode = getLoginCode(family.id);
    const email = `${loginCode}@family.local`;

    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });

    if (authErr) {
      if (authErr.message?.includes("already been registered")) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find((u) => u.email === email);
        if (existingUser) {
          await supabase.auth.admin.updateUserById(existingUser.id, { password: PASSWORD });
          await supabase.from("families").update({ login_code: loginCode }).eq("id", family.id);
          console.log(`  ${family.name}: Updated password, login: ${loginCode} / ${PASSWORD}`);
        } else {
          console.error(`  ${family.name}: User exists but not found -`, authErr.message);
        }
      } else {
        console.error(`  ${family.name}: Failed -`, authErr.message);
      }
      continue;
    } else if (authUser?.user) {
      const { data: member, error: memberErr } = await supabase
        .from("members")
        .insert({
          family_id: family.id,
          user_id: authUser.user.id,
          name: "Family",
          role: "admin",
        })
        .select("id")
        .single();

      if (memberErr) {
        console.error(`  ${family.name}: Failed to create member -`, memberErr.message);
        continue;
      }

      await supabase.from("families").update({ login_code: loginCode }).eq("id", family.id);
      if (member?.id) {
        await supabase.from("streaks").upsert(
          { member_id: member.id, current_streak: 0, longest_streak: 0 },
          { onConflict: "member_id" }
        );
      }
      console.log(`  ${family.name}: Created, login: ${loginCode} / ${PASSWORD}`);
    }
  }

  console.log("\nDone. Old families can now sign in with their login code and demo123.");
}

migrate().catch(console.error);
