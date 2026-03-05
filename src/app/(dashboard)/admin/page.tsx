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

  const { data: tasksRaw } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", member.family_id)
    .order("created_at", { ascending: false });

  const memberIds = (members ?? []).map((m) => m.id);
  const { data: sportActivitiesRaw } = await supabase
    .from("sport_activities")
    .select("*")
    .or(memberIds.length > 0 ? `member_id.in.(${memberIds.join(",")}),member_id.is.null` : "member_id.is.null")
    .order("created_at", { ascending: false });

  const { data: schoolTasksRaw } = await supabase
    .from("school_tasks")
    .select("*")
    .order("due_date", { ascending: true });

  // Sort: no date/deadline and no day limit first
  const tasks = (tasksRaw ?? []).slice().sort((a, b) => {
    const aNoLimit = !a.deadline && (!a.scheduled_days || a.scheduled_days.length === 0);
    const bNoLimit = !b.deadline && (!b.scheduled_days || b.scheduled_days.length === 0);
    if (aNoLimit !== bNoLimit) return aNoLimit ? -1 : 1;
    return (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31");
  });

  const sportActivities = (sportActivitiesRaw ?? []).slice().sort((a, b) => {
    const aNoLimit = !a.scheduled_days || a.scheduled_days.length === 0;
    const bNoLimit = !b.scheduled_days || b.scheduled_days.length === 0;
    if (aNoLimit !== bNoLimit) return aNoLimit ? -1 : 1;
    const dayA = (a.scheduled_days?.[0] ?? 7) as number;
    const dayB = (b.scheduled_days?.[0] ?? 7) as number;
    return dayA - dayB;
  });

  const schoolTasks = (schoolTasksRaw ?? []).slice().sort((a, b) => {
    const aNoLimit = !a.due_date && (!a.scheduled_days || a.scheduled_days.length === 0);
    const bNoLimit = !b.due_date && (!b.scheduled_days || b.scheduled_days.length === 0);
    if (aNoLimit !== bNoLimit) return aNoLimit ? -1 : 1;
    return (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31");
  });

  const { data: family } = await supabase
    .from("families")
    .select("show_reset_button, show_remove_from_today")
    .eq("id", member.family_id)
    .single();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Parent Panel</h1>

      <AdminMembers members={members ?? []} />

      <AdminPoints members={members ?? []} />

      <AdminTasks tasks={tasks} members={members ?? []} />

      <AdminSport
        activities={sportActivities}
        members={members ?? []}
      />

      <AdminSchool
        tasks={schoolTasks}
        members={members ?? []}
      />

      <AdminSettings
        showResetButton={family?.show_reset_button ?? false}
        showRemoveFromToday={family?.show_remove_from_today ?? false}
      />
    </div>
  );
}
