import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { TodayTasks } from "@/components/today/TodayTasks";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!member) return null;

  const { data: members } = await supabase
    .from("members")
    .select("id, name, avatar_url")
    .eq("family_id", member.family_id);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayStr = format(today, "yyyy-MM-dd");

  // All taken tasks (any family member) - family-wide view
  const { data: takenAssignments } = await supabase
    .from("task_assignments")
    .select("*, tasks(*)")
    .is("completed_at", null);

  const { data: openTasksRaw } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", member.family_id)
    .eq("status", "open")
    .or(`deadline.gte.${todayStr},deadline.is.null`);

  const openTasks = (openTasksRaw ?? []).filter(
    (t) =>
      !t.scheduled_days ||
      t.scheduled_days.length === 0 ||
      t.scheduled_days.includes(dayOfWeek)
  );

  // All family sport activities (any member)
  const { data: sportActivitiesRaw } = await supabase
    .from("sport_activities")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id))
    .is("completed_at", null);

  const sportActivities = (sportActivitiesRaw ?? []).filter(
    (a) =>
      a.type === "extra" ||
      ((a.scheduled_days?.length ?? 0) > 0 && a.scheduled_days!.includes(dayOfWeek))
  );

  // All family school tasks (any member)
  const { data: schoolTasksRaw } = await supabase
    .from("school_tasks")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id))
    .is("completed_at", null)
    .gte("due_date", todayStr)
    .order("due_date", { ascending: true });

  const schoolTasks = (schoolTasksRaw ?? []).filter(
    (t) =>
      !t.scheduled_days ||
      t.scheduled_days.length === 0 ||
      t.scheduled_days.includes(dayOfWeek)
  );

  // Filter taken assignments to only tasks in our family
  const takenTasksWithAssignee = (takenAssignments ?? [])
    .map((a) => {
      const t = (a as { tasks: unknown }).tasks;
      if (!t || typeof t !== "object" || !("family_id" in t)) return null;
      if ((t as { family_id: string }).family_id !== member.family_id) return null;
      const task = t as unknown as { id: string; title: string; score_value: number };
      return {
        id: task.id,
        title: task.title,
        score_value: task.score_value,
        assignee_id: (a as { member_id: string }).member_id,
      };
    })
    .filter(Boolean) as { id: string; title: string; score_value: number; assignee_id: string }[];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Today</h1>

      <TodayTasks
        takenTasks={takenTasksWithAssignee}
        openTasks={openTasks}
        sportActivities={sportActivities ?? []}
        schoolTasks={schoolTasks ?? []}
        members={members ?? []}
      />
    </div>
  );
}
