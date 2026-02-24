/**
 * Verify seed data exists. Run after npm run db:seed.
 * Requires SUPABASE_SERVICE_ROLE_KEY.
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

async function verify() {
  const { data: family } = await supabase
    .from("families")
    .select("id, name, login_code")
    .eq("login_code", "demo")
    .single();

  if (!family) {
    console.error("FAIL: Demo family not found");
    process.exit(1);
  }

  const { data: members } = await supabase
    .from("members")
    .select("id, name, role")
    .eq("family_id", family.id);

  if (!members || members.length < 3) {
    console.error("FAIL: Expected at least 3 members, got", members?.length ?? 0);
    process.exit(1);
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("family_id", family.id);

  if (!tasks || tasks.length < 3) {
    console.error("FAIL: Expected at least 3 tasks, got", tasks?.length ?? 0);
    process.exit(1);
  }

  const { data: sport } = await supabase
    .from("sport_activities")
    .select("id")
    .in("member_id", members.map((m) => m.id));

  if (!sport || sport.length < 2) {
    console.error("FAIL: Expected at least 2 sport activities, got", sport?.length ?? 0);
    process.exit(1);
  }

  const { data: school } = await supabase
    .from("school_tasks")
    .select("id")
    .in("member_id", members.map((m) => m.id));

  if (!school || school.length < 1) {
    console.error("FAIL: Expected at least 1 school task, got", school?.length ?? 0);
    process.exit(1);
  }

  console.log("PASS: Demo family verified");
  console.log("  Family:", family.name, "(" + family.login_code + ")");
  console.log("  Members:", members.map((m) => m.name).join(", "));
  console.log("  Tasks:", tasks.length);
  console.log("  Sport activities:", sport.length);
  console.log("  School tasks:", school.length);
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
