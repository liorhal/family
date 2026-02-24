/**
 * Seed script for demo family.
 * Run with: npm run db:seed
 * Requires SUPABASE_SERVICE_ROLE_KEY in env for bypassing RLS.
 *
 * Creates demo family with login: demo / password: demo123
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_LOGIN_CODE = "demo";
const DEMO_PASSWORD = "demo123";
const DEMO_EMAIL = `${DEMO_LOGIN_CODE}@family.local`;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function seed() {
  console.log("Seeding demo family...");

  // Remove existing demo family if present (to allow re-seeding)
  const { data: existing } = await supabase
    .from("families")
    .select("id")
    .eq("login_code", DEMO_LOGIN_CODE)
    .single();
  if (existing) {
    await supabase.from("families").delete().eq("id", existing.id);
    console.log("Removed existing demo family");
  }

  // Create auth user for family login
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  if (authErr) {
    if (authErr.message?.includes("already been registered")) {
      console.log("Demo user already exists, continuing...");
      const { data: existing } = await supabase.auth.admin.listUsers();
      const user = existing?.users?.find((u) => u.email === DEMO_EMAIL);
      if (!user) {
        console.error("Could not find existing demo user");
        process.exit(1);
      }
      await createFamilyWithUser(user.id);
    } else {
      console.error("Failed to create auth user:", authErr);
      process.exit(1);
    }
  } else if (authUser?.user) {
    await createFamilyWithUser(authUser.user.id);
  } else {
    console.error("Failed to create auth user");
    process.exit(1);
  }
}

async function createFamilyWithUser(userId: string) {
  const { data: family, error: familyErr } = await supabase
    .from("families")
    .insert({ name: "Demo Family", login_code: DEMO_LOGIN_CODE })
    .select("id")
    .single();

  if (familyErr || !family) {
    console.error("Failed to create family:", familyErr);
    process.exit(1);
  }

  const { data: members, error: membersErr } = await supabase
    .from("members")
    .insert([
      { family_id: family.id, user_id: userId, name: "Parent", role: "admin" },
      { family_id: family.id, name: "Emma", role: "kid" },
      { family_id: family.id, name: "Leo", role: "kid" },
    ])
    .select("id, name");

  if (membersErr || !members) {
    console.error("Failed to create members:", membersErr);
    process.exit(1);
  }

  const adminId = members.find((m) => m.name === "Parent")?.id ?? members[0].id;
  const emmaId = members.find((m) => m.name === "Emma")?.id;
  const leoId = members.find((m) => m.name === "Leo")?.id;

  const today = new Date().toISOString().split("T")[0];
  await supabase.from("tasks").insert([
    {
      family_id: family.id,
      title: "Wash dishes",
      score_value: 10,
      created_by: adminId,
      status: "open",
      deadline: today,
    },
    {
      family_id: family.id,
      title: "Take out trash",
      score_value: 15,
      created_by: adminId,
      status: "open",
      deadline: today,
    },
    {
      family_id: family.id,
      title: "Vacuum living room",
      score_value: 20,
      created_by: adminId,
      status: "open",
      deadline: today,
    },
  ]);

  if (emmaId) {
    await supabase.from("sport_activities").insert([
      {
        member_id: emmaId,
        title: "Soccer practice",
        type: "weekly",
        scheduled_days: [2],
        score_value: 15,
      },
      {
        member_id: emmaId,
        title: "Swimming",
        type: "weekly",
        scheduled_days: [4],
        score_value: 20,
      },
    ]);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    await supabase.from("school_tasks").insert([
      {
        member_id: emmaId,
        title: "Math homework",
        type: "homework",
        due_date: nextWeek.toISOString().split("T")[0],
        score_value: 10,
      },
    ]);
  }

  if (leoId) {
    await supabase.from("sport_activities").insert([
      {
        member_id: leoId,
        title: "Basketball",
        type: "weekly",
        scheduled_days: [1],
        score_value: 15,
      },
    ]);
  }

  await supabase.from("streaks").upsert(
    members.map((m) => ({
      member_id: m.id,
      current_streak: 0,
      longest_streak: 0,
    })),
    { onConflict: "member_id" }
  );

  console.log("Seed complete!");
  console.log("  Family ID:", family.id);
  console.log("  Login: demo / password: demo123");
}

seed().catch(console.error);
