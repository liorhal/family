import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminMembers } from "@/components/admin/AdminMembers";
import { AdminTasks } from "@/components/admin/AdminTasks";
import { AdminSport } from "@/components/admin/AdminSport";
import { AdminSchool } from "@/components/admin/AdminSchool";
import { AdminPoints } from "@/components/admin/AdminPoints";
import { AdminSettings } from "@/components/admin/AdminSettings";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "admin") {
    redirect("/");
  }

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("family_id", member.family_id);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", member.family_id)
    .order("created_at", { ascending: false });

  const { data: sportActivities } = await supabase
    .from("sport_activities")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id))
    .order("created_at", { ascending: false });

  const { data: schoolTasks } = await supabase
    .from("school_tasks")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id))
    .order("due_date", { ascending: true });

  const { data: family } = await supabase
    .from("families")
    .select("show_reset_button")
    .eq("id", member.family_id)
    .single();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Parent Panel</h1>

      <AdminSettings showResetButton={family?.show_reset_button ?? false} />

      <AdminMembers members={members ?? []} />

      <AdminPoints members={members ?? []} />

      <AdminTasks tasks={tasks ?? []} members={members ?? []} />

      <AdminSport
        activities={sportActivities ?? []}
        members={members ?? []}
      />

      <AdminSchool
        tasks={schoolTasks ?? []}
        members={members ?? []}
      />
    </div>
  );
}
